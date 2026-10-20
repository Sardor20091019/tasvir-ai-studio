import * as crypto from 'crypto';
import { UnauthorizedException } from '@nestjs/common';

export interface JwtPayload {
  sub: string;
  phone?: string;
  role?: string;
  iat: number;
  exp: number;
}

export class JwtUtil {
  private static getSecret(): string {
    const secret = process.env.JWT_SECRET;
    if (!secret || secret.length < 16) {
      // In production, enforce strong secret
      if (process.env.NODE_ENV === 'production') {
        throw new Error('FATAL: JWT_SECRET must be configured with at least 16 characters in production!');
      }
      return 'tasvir_dev_fallback_secret_key_32chars_secure!';
    }
    return secret;
  }

  static sign(payload: Omit<JwtPayload, 'iat' | 'exp'>, expiresInSeconds: number = 7 * 24 * 3600): string {
    const secret = this.getSecret();
    const now = Math.floor(Date.now() / 1000);

    const fullPayload: JwtPayload = {
      ...payload,
      iat: now,
      exp: now + expiresInSeconds,
    };

    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const encodedPayload = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');
    const signature = crypto
      .createHmac('sha256', secret)
      .update(`${header}.${encodedPayload}`)
      .digest('base64url');

    return `${header}.${encodedPayload}.${signature}`;
  }

  static verify(token: string): JwtPayload {
    if (!token || typeof token !== 'string') {
      throw new UnauthorizedException('Token taqdim etilmagan');
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new UnauthorizedException('Yaroqsiz token formati');
    }

    const [header, payload, signature] = parts;
    const secret = this.getSecret();

    // Verify cryptographic signature using constant-time comparison
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${header}.${payload}`)
      .digest('base64url');

    const expectedBuffer = Buffer.from(expectedSignature);
    const signatureBuffer = Buffer.from(signature);

    if (
      expectedBuffer.length !== signatureBuffer.length ||
      !crypto.timingSafeEqual(expectedBuffer, signatureBuffer)
    ) {
      throw new UnauthorizedException('Token imzosi notoʻgʻri yoki buzilgan');
    }

    // Decode and check expiration
    try {
      const decodedPayload: JwtPayload = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
      const now = Math.floor(Date.now() / 1000);

      if (decodedPayload.exp && decodedPayload.exp < now) {
        throw new UnauthorizedException('Token muddati tugagan. Iltimos, qaytadan kiring');
      }

      return decodedPayload;
    } catch (e: any) {
      throw new UnauthorizedException('Token maʼlumotlarini oʻqib boʻlmadi');
    }
  }
}

