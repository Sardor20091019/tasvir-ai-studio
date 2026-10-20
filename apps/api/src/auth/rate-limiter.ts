import { HttpException, HttpStatus } from '@nestjs/common';

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

export class InMemoryRateLimiter {
  private static store = new Map<string, RateLimitRecord>();

  /**
   * Enforces max `limit` requests within `windowMs` seconds.
   * Throws HTTP 429 Too Many Requests if exceeded.
   */
  static check(key: string, limit: number, windowMs: number, errorMessage?: string): void {
    const now = Date.now();
    const record = this.store.get(key);

    if (!record || record.resetAt <= now) {
      this.store.set(key, { count: 1, resetAt: now + windowMs });
      return;
    }

    if (record.count >= limit) {
      const waitSeconds = Math.ceil((record.resetAt - now) / 1000);
      throw new HttpException(
        errorMessage || `Juda koʻp soʻrov yuborildi. Iltimos, ${waitSeconds} soniyadan keyin qaytadan urinib koʻring.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    record.count += 1;
  }

  static reset(key: string): void {
    this.store.delete(key);
  }
}

