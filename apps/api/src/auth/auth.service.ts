import { Injectable, BadRequestException, UnauthorizedException, Logger, Inject } from '@nestjs/common';
import * as crypto from 'crypto';
import { KyselyService } from '../database/kysely.service';
import { User } from '../database/schema';
import { JwtUtil } from './jwt.util';
import { InMemoryRateLimiter } from './rate-limiter';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  // In-memory verification codes cache with attempt counter
  private otpCache = new Map<string, { code: string; expiresAt: number; attempts: number }>();

  constructor(@Inject(KyselyService) private readonly db: KyselyService) {}

  async verifyTurnstile(token?: string, remoteip?: string): Promise<boolean> {
    const secretKey = process.env.TURNSTILE_SECRET_KEY;
    if (!secretKey) {
      if (process.env.NODE_ENV === 'production') {
        this.logger.error('TURNSTILE_SECRET_KEY is not configured in production!');
        return false;
      }
      return true; // If not configured in dev, allow
    }
    if (!token) return false;

    // Local dev bypass token strictly prohibited in production
    if (token.startsWith('cf_test_pass_')) {
      if (process.env.NODE_ENV === 'production') {
        this.logger.warn('Turnstile test bypass token rejected in production environment.');
        return false;
      }
      this.logger.log('Turnstile dev test token accepted in non-production.');
      return true;
    }

    try {
      const formData = new URLSearchParams();
      formData.append('secret', secretKey);
      formData.append('response', token);
      if (remoteip) formData.append('remoteip', remoteip);

      const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        body: formData,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      const data: any = await res.json();
      this.logger.log(`Cloudflare Turnstile verification result: ${data.success}`);
      return Boolean(data.success);
    } catch (err: any) {
      this.logger.warn(`Turnstile verify network error: ${err.message}. Permitting in dev.`);
      return process.env.NODE_ENV !== 'production';
    }
  }

  async sendOtp(phoneNumber: string, turnstileToken?: string): Promise<{ success: boolean; message: string; demoCode?: string }> {
    const cleanPhone = this.normalizePhone(phoneNumber);
    if (!cleanPhone.startsWith('+998') || cleanPhone.length !== 13) {
      throw new BadRequestException('Faqat Oʻzbekiston raqamlari qabul qilinadi (+998XXXXXXXXX)');
    }

    // Anti-SMS Pumping Rate Limit: Max 5 OTP requests per phone in 10 minutes
    InMemoryRateLimiter.check(
      `send_otp:${cleanPhone}`,
      5,
      10 * 60 * 1000,
      'SMS soʻrovlari cheklovi oshdi. Iltimos, 10 daqiqadan soʻng qayta urinib koʻring.',
    );

    const isHuman = await this.verifyTurnstile(turnstileToken);
    if (!isHuman) {
      throw new BadRequestException('Botlardan himoya (Turnstile) tekshiruvidan oʻtmadi. Qaytadan urinib koʻring.');
    }

    // Cryptographically secure 4-digit OTP generation (CWE-330 fix)
    const code = crypto.randomInt(1000, 10000).toString();
    this.otpCache.set(cleanPhone, {
      code,
      expiresAt: Date.now() + 5 * 60 * 1000,
      attempts: 0,
    });

    this.logger.log(`Generated OTP ${code} for phone ${cleanPhone}`);

    const isDev = process.env.NODE_ENV !== 'production';

    return {
      success: true,
      message: `Tasdiqlash kodi ${cleanPhone} raqamiga yuborildi`,
      // NEVER leak OTP in production responses
      demoCode: isDev ? code : undefined,
    };
  }

  async verifyOtp(phoneNumber: string, code: string): Promise<{ user: User; token: string }> {
    const cleanPhone = this.normalizePhone(phoneNumber);
    const cached = this.otpCache.get(cleanPhone);

    if (!cached || cached.expiresAt < Date.now()) {
      throw new BadRequestException('Tasdiqlash kodi muddati oʻtgan yoki mavjud emas. Yangi kod soʻrang.');
    }

    // Increment failed attempt counter to prevent brute-forcing
    cached.attempts += 1;
    if (cached.attempts > 5) {
      this.otpCache.delete(cleanPhone);
      throw new BadRequestException('Urinishlar soni oshib ketdi. Xavfsizlik yuzasidan yangi SMS kod soʻrang.');
    }

    const isDev = process.env.NODE_ENV !== 'production';
    const isExactMatch = cached.code === code;
    const isDevBypass = isDev && (code === '1234' || code === '7777');

    if (!isExactMatch && !isDevBypass) {
      const remainingAttempts = 5 - cached.attempts;
      throw new BadRequestException(`Tasdiqlash kodi notoʻgʻri. ${remainingAttempts} ta urinish qoldi.`);
    }

    // Clear OTP after successful use
    this.otpCache.delete(cleanPhone);
    InMemoryRateLimiter.reset(`send_otp:${cleanPhone}`);

    // Find or create user
    let user = await this.db
      .selectFrom('users')
      .selectAll()
      .where('phone_number', '=', cleanPhone)
      .executeTakeFirst();

    if (!user) {
      user = await this.db
        .insertInto('users')
        .values({
          phone_number: cleanPhone,
          full_name: 'Yangi Foydalanuvchi',
          telegram_id: null,
          locale: 'uz',
          role: 'user',
          plan_tier: 'starter',
          credits_balance: 3,
        })
        .returningAll()
        .executeTakeFirstOrThrow();
    }

    // Generate cryptographically signed HMAC-SHA256 JWT
    const token = JwtUtil.sign({ sub: user.id, phone: user.phone_number, role: user.role });
    return { user, token };
  }

  async googleLogin(params: {
    credential?: string;
  }): Promise<{ user: User; token: string }> {
    if (!params?.credential || typeof params.credential !== 'string') {
      throw new BadRequestException('Google ID tokeni (credential) kiritilishi shart');
    }

    let email: string;
    let name: string = 'Google Merchant';

    // Allow mock credential in development for test suites
    if (process.env.NODE_ENV !== 'production' && params.credential.startsWith('mock_demo_credential')) {
      email = 'sardor.sunatullayev@tasvir.ai';
      name = 'Sardor Sunatullayev';
    } else {
      try {
        const verifyRes = await fetch(
          `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(params.credential)}`,
        );
        if (!verifyRes.ok) {
          throw new BadRequestException('Google tokeni yaroqsiz yoki muddati oʻtgan');
        }
        const gInfo: any = await verifyRes.json();

        const expectedClientId = process.env.GOOGLE_CLIENT_ID;
        if (expectedClientId && gInfo.aud !== expectedClientId && gInfo.azp !== expectedClientId) {
          throw new BadRequestException('Google token auditoriyasi (aud) mos kelmadi');
        }

        if (!gInfo.email) {
          throw new BadRequestException('Google tokenida email mavjud emas');
        }

        email = gInfo.email;
        name = gInfo.name || gInfo.email.split('@')[0] || 'Google User';
      } catch (err: any) {
        if (err instanceof BadRequestException) throw err;
        throw new BadRequestException(`Google autentifikatsiyasini tekshirib boʻlmadi: ${err.message}`);
      }
    }

    const syntheticPhone = `+998${Math.abs(this.hashCode(email)).toString().slice(0, 9).padStart(9, '9')}`;

    let user = await this.db
      .selectFrom('users')
      .selectAll()
      .where('phone_number', '=', syntheticPhone)
      .executeTakeFirst();

    if (!user) {
      user = await this.db
        .insertInto('users')
        .values({
          phone_number: syntheticPhone,
          full_name: name,
          telegram_id: null,
          locale: 'uz',
          role: 'user',
          plan_tier: 'starter',
          credits_balance: 3,
        })
        .returningAll()
        .executeTakeFirstOrThrow();
      this.logger.log(`Created new verified Google user: ${name} (${syntheticPhone})`);
    }

    const token = JwtUtil.sign({ sub: user.id, phone: user.phone_number, role: user.role });
    return { user, token };
  }

  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }

  async getCurrentUser(userId?: string): Promise<User> {
    if (!userId) {
      throw new UnauthorizedException('Avtorizatsiya talab qilinadi. Iltimos, tizimga kiring.');
    }

    const user = await this.db
      .selectFrom('users')
      .selectAll()
      .where('id', '=', userId)
      .executeTakeFirst();

    if (!user) {
      throw new UnauthorizedException('Foydalanuvchi hisobi topilmadi');
    }

    return user;
  }

  private normalizePhone(phone: string): string {
    let clean = phone.replace(/[^\d+]/g, '');
    if (clean.startsWith('998')) {
      clean = '+' + clean;
    } else if (clean.length === 9) {
      clean = '+998' + clean;
    }
    return clean;
  }
}
