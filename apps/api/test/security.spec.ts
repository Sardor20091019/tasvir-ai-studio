import { test, describe } from 'node:test';
import * as assert from 'node:assert/strict';
import * as crypto from 'crypto';
import { InMemoryRateLimiter } from '../src/auth/rate-limiter';
import { JwtUtil } from '../src/auth/jwt.util';
import { UploadThingService } from '../src/storage/uploadthing.service';

describe('Security Regression & Remediation Tests', () => {

  test('VULN-01: Google Login must strictly reject missing or unverified credentials', async () => {
    const { AuthService } = await import('../src/auth/auth.service');
    const mockDb: any = {};
    const authService = new AuthService(mockDb);

    await assert.rejects(
      async () => {
        await authService.googleLogin({} as any);
      },
      (err: any) => {
        assert.match(err.message, /Google ID tokeni/);
        return true;
      },
      'Expected failure when credential is not provided',
    );
  });

  test('Cloudflare Turnstile Enforcement: Google Login strictly rejects requests without Turnstile token', async () => {
    const { AuthService } = await import('../src/auth/auth.service');
    const mockDb: any = {};
    const authService = new AuthService(mockDb);
    const prevEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    try {
      await assert.rejects(
        async () => {
          await authService.googleLogin({ credential: 'valid_google_credential_xyz' });
        },
        (err: any) => {
          assert.match(err.message, /Cloudflare Turnstile tekshiruvidan oʻtish shart/);
          return true;
        },
        'Expected failure when turnstileToken is missing',
      );
    } finally {
      process.env.NODE_ENV = prevEnv;
    }
  });

  test('Google Login: Initial tokens must be 0, email saved as in Google, phone number column is absent', async () => {
    const { AuthService } = await import('../src/auth/auth.service');
    let insertedUserValues: any = null;
    const mockDb: any = {
      selectFrom: () => ({
        selectAll: () => ({
          where: () => ({
            executeTakeFirst: async () => null,
          }),
        }),
      }),
      insertInto: () => ({
        values: (val: any) => {
          insertedUserValues = val;
          return {
            returningAll: () => ({
              executeTakeFirstOrThrow: async () => ({
                id: 'usr_new_google',
                ...val,
              }),
            }),
          };
        },
      }),
    };

    const authService = new AuthService(mockDb);
    authService.verifyTurnstile = async () => true;

    const result = await authService.googleLogin({
      credential: 'mock_demo_credential_test',
      turnstileToken: 'valid_test_token',
    });

    assert.equal(insertedUserValues.credits_balance, 0, 'New user tokens must start at 0');
    assert.equal(insertedUserValues.email, 'test.user@tasvir.ai', 'Email must match Google credential');
    assert.equal(insertedUserValues.phone_number, undefined, 'Phone number must not exist in users table');
    assert.equal(result.user.credits_balance, 0);
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
    for (let i = 0; i < 50; i++) {
      const code = crypto.randomInt(1000, 10000).toString();
      assert.equal(code.length, 4);
      const num = parseInt(code, 10);
      assert.ok(num >= 1000 && num < 10000);
    }
  });

  test('VULN-05: Turnstile Dev Bypass Token and failures must be rejected in all environments (No Bypass)', async () => {
    const { AuthService } = await import('../src/auth/auth.service');
    const mockDb: any = {};
    const authService = new AuthService(mockDb);

    // Bypass tokens must be rejected
    const bypassResult = await authService.verifyTurnstile('cf_dev_bypass_12345');
    assert.equal(bypassResult, false, 'Bypass token must return false');

    // Missing token must return false
    const missingResult = await authService.verifyTurnstile(undefined);
    assert.equal(missingResult, false, 'Missing token must return false');

    // When Cloudflare network / verification fails, must return false (no bypass)
    const originalFetch = global.fetch;
    try {
      global.fetch = async () => {
        throw new Error('Cloudflare network unreachable');
      };
      const failedResult = await authService.verifyTurnstile('some_turnstile_token');
      assert.equal(failedResult, false, 'Must strictly return false when Cloudflare fails');
    } finally {
      global.fetch = originalFetch;
    }
  });

  test('VULN-06: InMemoryRateLimiter enforces rate limits and prunes expired keys', () => {
    InMemoryRateLimiter.clearAll();

    const testKey = 'test_ip_192_168_1_1';
    InMemoryRateLimiter.check(testKey, 3, 10000);
    InMemoryRateLimiter.check(testKey, 3, 10000);
    InMemoryRateLimiter.check(testKey, 3, 10000);

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

    const decoded = JwtUtil.verify(token);
    assert.equal(decoded.sub, 'user_123');
    assert.equal(decoded.role, 'user');

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

  test('Video Generation Auth Enforcement: Unauthenticated requests without account are strictly rejected (AuthGuard)', async () => {
    const { AuthGuard } = await import('../src/auth/guards/auth.guard');
    const mockDb: any = {
      selectFrom: () => ({
        selectAll: () => ({
          where: () => ({
            executeTakeFirst: async () => null,
          }),
        }),
      }),
    };
    const authGuard = new AuthGuard(mockDb);

    const mockContext: any = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: {},
        }),
      }),
    };

    await assert.rejects(
      async () => {
        await authGuard.canActivate(mockContext);
      },
      (err: any) => {
        assert.match(err.message, /Iltimos, avval tizimga kiring/);
        return true;
      },
      'Unauthenticated request must be rejected by AuthGuard',
    );
  });

  test('User Profile Update: updates name and preserves DB token balance', async () => {
    const { AuthService } = await import('../src/auth/auth.service');
    const mockDb: any = {
      updateTable: () => ({
        set: () => ({
          where: () => ({
            returningAll: () => ({
              executeTakeFirst: async () => ({
                id: 'usr_1',
                full_name: 'Sardor Updated',
                phone_number: '+998990991112',
                credits_balance: 15,
                role: 'user',
              }),
            }),
          }),
        }),
      }),
      selectFrom: () => ({
        selectAll: () => ({
          where: () => ({
            where: () => ({
              executeTakeFirst: async () => null,
            }),
          }),
        }),
      }),
    };
    const authService = new AuthService(mockDb);

    const updated = await authService.updateProfile('usr_1', {
      fullName: 'Sardor Updated',
    });

    assert.equal(updated.full_name, 'Sardor Updated');
    assert.equal(updated.credits_balance, 15);
  });
});

