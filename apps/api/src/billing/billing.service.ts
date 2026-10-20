import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  UnauthorizedException,
  Logger,
  Inject,
} from '@nestjs/common';
import { KyselyService } from '../database/kysely.service';
import { sql } from 'kysely';
import { PaymentTransaction } from '../database/schema';
import * as crypto from 'crypto';

export interface PlanConfig {
  id: string;
  nameUz: string;
  priceUzs: number;
  credits: number;
  description: string;
  badge?: string;
  features: string[];
}

export const BILLING_PLANS: Record<string, PlanConfig> = {
  starter: {
    id: 'starter',
    nameUz: 'Boshlangʻich',
    priceUzs: 99000,
    credits: 10,
    description: 'Yangi boshlagan Uzum va Telegram sotuvchilari uchun',
    features: ['10 ta HD video', 'Barcha 4 ta AI boshlovchi', '9:16 formati', 'Subtitrlar bilan'],
  },
  shop_pro: {
    id: 'shop_pro',
    nameUz: 'Doʻkon Pro',
    priceUzs: 249000,
    credits: 35,
    badge: 'Eng ommabop',
    description: 'Faol savdo qiluvchi doʻkonlar va brendlar uchun',
    features: [
      '35 ta Full HD video',
      'Tezkor render navbati',
      'Maxsus logotip va fonlar',
      'Ovoz tonlarini moslash',
      'Telegram bot integratsiyasi',
    ],
  },
  agency: {
    id: 'agency',
    nameUz: 'Agentlik / Top Seller',
    priceUzs: 590000,
    credits: 100,
    description: 'Katta doʻkonlar va marketing agentliklari uchun',
    features: [
      '100 ta 4K video',
      'Eng yuqori server ustuvorligi',
      'Eksklyuziv klonlangan ovozlar',
      'API kalitlar va cheksiz yuklash',
      '24/7 shaxsiy menejer',
    ],
  },
};

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(@Inject(KyselyService) private readonly db: KyselyService) {}

  getPlans(): PlanConfig[] {
    return Object.values(BILLING_PLANS);
  }

  async createCheckoutSession(params: {
    userId: string;
    planTier: string;
    provider: 'payme' | 'click' | 'uzum';
    phoneNumber: string;
  }): Promise<{
    transactionId: string;
    checkoutUrl: string;
    amountUzs: number;
    creditsAdded: number;
    provider: string;
  }> {
    const plan = BILLING_PLANS[params.planTier];
    if (!plan) {
      throw new BadRequestException(`Notoʻgʻri tarif rejasi: ${params.planTier}`);
    }

    if (!['payme', 'click', 'uzum'].includes(params.provider)) {
      throw new BadRequestException(`Nomaʼlum toʻlov tizimi: ${params.provider}`);
    }

    let cleanPhone = (params.phoneNumber || '').replace(/[^\d+]/g, '');
    if (!cleanPhone.startsWith('+998') && cleanPhone.length === 9) {
      cleanPhone = '+998' + cleanPhone;
    }

    const tx = await this.db
      .insertInto('payment_transactions')
      .values({
        user_id: params.userId,
        provider: params.provider,
        plan_tier: params.planTier,
        amount_uzs: plan.priceUzs,
        credits_added: plan.credits,
        phone_number: cleanPhone || '+998900000000',
        status: 'pending',
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    // Generate provider-specific deep link / checkout URL
    let checkoutUrl = '';
    const encodedParams = Buffer.from(`m=tasvir;ac.order_id=${tx.id};a=${plan.priceUzs * 100}`).toString('base64');

    if (params.provider === 'payme') {
      checkoutUrl = `https://checkout.paycom.uz/${encodedParams}`;
    } else if (params.provider === 'click') {
      checkoutUrl = `https://my.click.uz/services/pay?service_id=tasvir_ai&merchant_id=9821&amount=${plan.priceUzs}&transaction_param=${tx.id}`;
    } else {
      checkoutUrl = `https://www.bankuzum.uz/pay?orderId=${tx.id}&amount=${plan.priceUzs}`;
    }

    return {
      transactionId: tx.id,
      checkoutUrl,
      amountUzs: plan.priceUzs,
      creditsAdded: plan.credits,
      provider: params.provider,
    };
  }

  async confirmTestPayment(
    transactionId: string,
    authenticatedUserId: string,
  ): Promise<{ success: boolean; newCreditsBalance: number; planTier: string }> {
    if (process.env.NODE_ENV === 'production') {
      throw new ForbiddenException('Sinov toʻlovlarini faollashtirish ishlab chiqarish (production) muhitida qatʼiyan man etiladi.');
    }

    const tx = await this.db
      .selectFrom('payment_transactions')
      .selectAll()
      .where('id', '=', transactionId)
      .executeTakeFirst();

    if (!tx) {
      throw new NotFoundException('Toʻlov tranzaksiyasi topilmadi');
    }

    // BOLA protection: ensure user can only confirm their own test transaction
    if (tx.user_id !== authenticatedUserId) {
      throw new ForbiddenException('Siz faqat oʻzingizning toʻlovingizni tasdiqlashingiz mumkin');
    }

    return this.applyPaymentConfirmation(transactionId);
  }

  async applyPaymentConfirmation(transactionId: string): Promise<{ success: boolean; newCreditsBalance: number; planTier: string }> {
    return await this.db.transaction().execute(async (trx) => {
      const tx = await trx
        .selectFrom('payment_transactions')
        .selectAll()
        .where('id', '=', transactionId)
        .forUpdate()
        .executeTakeFirst();

      if (!tx) {
        throw new NotFoundException('Toʻlov tranzaksiyasi topilmadi');
      }

      if (tx.status === 'paid') {
        const user = await trx
          .selectFrom('users')
          .select(['credits_balance', 'plan_tier'])
          .where('id', '=', tx.user_id)
          .executeTakeFirstOrThrow();
        return { success: true, newCreditsBalance: user.credits_balance, planTier: user.plan_tier };
      }

      // Mark paid
      await trx
        .updateTable('payment_transactions')
        .set({ status: 'paid' })
        .where('id', '=', transactionId)
        .execute();

      // Atomically add credits and update plan tier
      const updatedUser = await trx
        .updateTable('users')
        .set({
          credits_balance: sql`credits_balance + ${tx.credits_added}`,
          plan_tier: tx.plan_tier,
          updated_at: sql`now()`,
        })
        .where('id', '=', tx.user_id)
        .returning(['credits_balance', 'plan_tier'])
        .executeTakeFirstOrThrow();

      this.logger.log(`Confirmed payment ${transactionId}: Added ${tx.credits_added} credits to user ${tx.user_id}`);

      return {
        success: true,
        newCreditsBalance: updatedUser.credits_balance,
        planTier: updatedUser.plan_tier,
      };
    });
  }

  async listUserTransactions(userId: string): Promise<PaymentTransaction[]> {
    return await this.db
      .selectFrom('payment_transactions')
      .selectAll()
      .where('user_id', '=', userId)
      .orderBy('created_at', 'desc')
      .execute();
  }

  // Payme Webhook Handler with Basic Auth Verification
  async handlePaymeWebhook(body: any, authHeader?: string) {
    const paymeSecret = process.env.PAYME_SECRET_KEY || process.env.PAYME_KEY;

    if (paymeSecret) {
      if (!authHeader || !authHeader.startsWith('Basic ')) {
        throw new UnauthorizedException('Payme Basic Authorization header talab qilinadi');
      }
      const rawCreds = Buffer.from(authHeader.slice(6).trim(), 'base64').toString('utf8');
      const expectedCreds = `Paycom:${paymeSecret}`;
      const bufA = Buffer.from(rawCreds);
      const bufB = Buffer.from(expectedCreds);

      if (bufA.length !== bufB.length || !crypto.timingSafeEqual(bufA, bufB)) {
        throw new UnauthorizedException('Payme autentifikatsiyasi xato');
      }
    } else if (process.env.NODE_ENV === 'production') {
      this.logger.warn('PAYME_SECRET_KEY is not set in production! Webhook rejected for security.');
      throw new UnauthorizedException('Server toʻlov kaliti sozlanmagan');
    }

    this.logger.log(`Payme webhook verified: ${JSON.stringify(body?.method)}`);
    const { method, params, id } = body || {};

    if (method === 'CheckPerformTransaction') {
      return { result: { allow: true }, id };
    }

    if (method === 'PerformTransaction') {
      const orderId = params?.account?.order_id;
      if (orderId) {
        await this.applyPaymentConfirmation(orderId);
      }
      return {
        result: {
          transaction: params?.id || 'payme_tx',
          perform_time: Date.now(),
          state: 2,
        },
        id,
      };
    }

    return { result: { state: 2 }, id };
  }

  // Click Webhook Handler with MD5 Signature Verification
  async handleClickWebhook(body: any) {
    const clickSecret = process.env.CLICK_SECRET_KEY;
    const {
      click_trans_id,
      service_id,
      merchant_trans_id,
      amount,
      action,
      sign_time,
      sign_string,
    } = body || {};

    if (clickSecret) {
      if (!sign_string) {
        throw new UnauthorizedException('Click sign_string mavjud emas');
      }
      // Click signature: md5(click_trans_id + service_id + secret_key + merchant_trans_id + amount + action + sign_time)
      const expectedSign = crypto
        .createHash('md5')
        .update(`${click_trans_id}${service_id}${clickSecret}${merchant_trans_id}${amount}${action}${sign_time}`)
        .digest('hex');

      const bufExpected = Buffer.from(expectedSign.toLowerCase());
      const bufReceived = Buffer.from(String(sign_string).toLowerCase());

      if (bufExpected.length !== bufReceived.length || !crypto.timingSafeEqual(bufExpected, bufReceived)) {
        throw new UnauthorizedException('Click imzosi notoʻgʻri');
      }
    } else if (process.env.NODE_ENV === 'production') {
      this.logger.warn('CLICK_SECRET_KEY is not set in production! Webhook rejected for security.');
      throw new UnauthorizedException('Server toʻlov kaliti sozlanmagan');
    }

    this.logger.log(`Click webhook verified for merchant_trans_id: ${merchant_trans_id}`);

    if (Number(action) === 1 && merchant_trans_id) {
      await this.applyPaymentConfirmation(merchant_trans_id);
    }

    return {
      click_trans_id,
      merchant_trans_id,
      merchant_confirm_id: Date.now(),
      error: 0,
      error_note: 'Success',
    };
  }

  // Uzum Webhook Handler with Auth Header Verification
  async handleUzumWebhook(body: any, uzumTokenHeader?: string) {
    const uzumSecret = process.env.UZUM_SECRET_KEY || process.env.UZUM_WEBHOOK_SECRET;

    if (uzumSecret) {
      if (!uzumTokenHeader) {
        throw new UnauthorizedException('Uzum webhook xavfsizlik tokeni kiritilmagan');
      }
      const bufA = Buffer.from(uzumTokenHeader);
      const bufB = Buffer.from(uzumSecret);
      if (bufA.length !== bufB.length || !crypto.timingSafeEqual(bufA, bufB)) {
        throw new UnauthorizedException('Uzum webhook tokeni yaroqsiz');
      }
    } else if (process.env.NODE_ENV === 'production') {
      this.logger.warn('UZUM_SECRET_KEY is not set in production! Webhook rejected for security.');
      throw new UnauthorizedException('Server toʻlov kaliti sozlanmagan');
    }

    this.logger.log(`Uzum webhook event received: ${JSON.stringify(body)}`);
    const { orderId, status } = body || {};
    if (status === 'SUCCESS' && orderId) {
      await this.applyPaymentConfirmation(orderId);
    }
    return { status: 'OK', orderId };
  }
}
