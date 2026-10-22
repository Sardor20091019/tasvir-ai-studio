import { HttpException, HttpStatus } from '@nestjs/common';

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

export class InMemoryRateLimiter {
  private static store = new Map<string, RateLimitRecord>();
  private static MAX_STORE_SIZE = 10000;

  static check(key: string, limit: number, windowMs: number, errorMessage?: string): void {
    const now = Date.now();

    if (this.store.size > this.MAX_STORE_SIZE) {
      this.cleanup(now);
    }

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

  static clearAll(): void {
    this.store.clear();
  }

  private static cleanup(now: number): void {
    for (const [k, v] of this.store.entries()) {
      if (v.resetAt <= now) {
        this.store.delete(k);
      }
    }
  }
}
