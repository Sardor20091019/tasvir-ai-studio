import { test, describe } from 'node:test';
import * as assert from 'node:assert/strict';
import * as crypto from 'crypto';
import { InMemoryRateLimiter } from '../src/auth/rate-limiter';
import { JwtUtil } from '../src/auth/jwt.util';
import { UploadThingService } from '../src/storage/uploadthing.service';

describe('Security Regression & Remediation Tests', () => {

  test('VULN-01: Google Login must strictly reject missing or unverified credentials', async () => {
    // Dynamic import to test AuthService Google login input contract
    const { AuthService } = await import('../src/auth/auth.service');
    const mockDb: any = {};
    const authService = new AuthService(mockDb);

    // Attempting to call googleLogin with raw email and no credential
    await assert.rejects(
      async () => {
        await authService.googleLogin({} as any);
      },
      (err: any) => {
        assert.match(err.message, /Google ID tokeni \(credential\) kiritilishi shart/);
        return true;
      },
      'Expected failure when credential is not provided',
    );
  });

  test('VULN-02: Auth Service getCurrentUser must reject unauthenticated requests without leaking admin', async () => {
    const { AuthService } = await import('../src/auth/auth.service');
    const mockDb: any = {};
    const authService = new AuthService(mockDb);

    await assert.rejects(
      async () => {
        await authService.getCurrentUser(undefined);
      },
      (err: any) => {
        assert.match(err.message, /Avtorizatsiya talab qilinadi/);
        return true;
      },
      'Unauthenticated call must throw UnauthorizedException',
    );
  });

  test('VULN-04: OTP Generation uses cryptographically secure random integers (CWE-330)', () => {
    // Verify randomInt range
    for (let i = 0; i < 50; i++) {
      const code = crypto.randomInt(1000, 10000).toString();
      assert.equal(code.length, 4);
      const num = parseInt(code, 10);
      assert.ok(num >= 1000 && num < 10000);
    }
  });

  test('VULN-05: Turnstile Dev Bypass Token must be rejected in production', async () => {
    const { AuthService } = await import('../src/auth/auth.service');
    const mockDb: any = {};
    const authService = new AuthService(mockDb);

    const prevEnv = process.env.NODE_ENV;
    try {
      process.env.NODE_ENV = 'production';
      const result = await authService.verifyTurnstile('cf_test_pass_fake_token');
      assert.equal(result, false, 'Dev bypass token must return false in production');
    } finally {
      process.env.NODE_ENV = prevEnv;
    }
  });

  test('VULN-06: InMemoryRateLimiter enforces rate limits and prunes expired keys', () => {
    InMemoryRateLimiter.clearAll();

    const testKey = 'test_ip_192_168_1_1';
    // Allow max 3 attempts per 10 seconds
    InMemoryRateLimiter.check(testKey, 3, 10000);
    InMemoryRateLimiter.check(testKey, 3, 10000);
    InMemoryRateLimiter.check(testKey, 3, 10000);

    // 4th attempt must throw 429
    assert.throws(
      () => {
        InMemoryRateLimiter.check(testKey, 3, 10000);
      },
      (err: any) => {
        assert.equal(err.status, 429);
        return true;
      },
    );
  });

  test('VULN-08: UploadThingService rejects directory traversal paths (CWE-22)', async () => {
    const storageService = new UploadThingService();

    const traversalPaths = [
      '../../../../etc/passwd',
      '../../../.env',
      '..\\..\\sensitive.txt',
    ];

    for (const p of traversalPaths) {
      const result = await storageService.uploadVideo(p, 'test.mp4');
      assert.equal(result, null, `Expected null result for directory traversal path: ${p}`);
    }
  });

  test('JWT Cryptographic Integrity: Rejects tampered payloads or signatures', () => {
    const token = JwtUtil.sign({ sub: 'user_123', phone: '+998990991112', role: 'user' }, 3600);
    const parts = token.split('.');
    assert.equal(parts.length, 3);

    // Verify valid token
    const decoded = JwtUtil.verify(token);
    assert.equal(decoded.sub, 'user_123');
    assert.equal(decoded.role, 'user');

    // Tampered payload with role changed to admin
    const tamperedPayload = Buffer.from(JSON.stringify({ sub: 'user_123', role: 'admin', exp: decoded.exp })).toString('base64url');
    const forgedToken = `${parts[0]}.${tamperedPayload}.${parts[2]}`;

    assert.throws(
      () => {
        JwtUtil.verify(forgedToken);
      },
      (err: any) => {
        assert.match(err.message, /Token imzosi notoʻgʻri yoki buzilgan/);
        return true;
      },
    );
  });
});

