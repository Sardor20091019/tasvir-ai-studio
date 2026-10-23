import { Pool } from 'pg';
import crypto from 'crypto';

let pool: Pool | null = null;

export function getDbPool(): Pool | null {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) return null;

  if (!pool) {
    pool = new Pool({
      connectionString: dbUrl,
      ssl: { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
    });
  }
  return pool;
}

export function signServerJwt(payload: { sub: string; email?: string | null; role?: string }): string {
  const secret = process.env.JWT_SECRET || 'tasvir_dev_fallback_secret_key_32chars_secure!';
  const now = Math.floor(Date.now() / 1000);
  const fullPayload = {
    ...payload,
    iat: now,
    exp: now + 7 * 24 * 3600,
  };

  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const encodedPayload = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${header}.${encodedPayload}`)
    .digest('base64url');

  return `${header}.${encodedPayload}.${signature}`;
}

export function decodeServerJwt(token: string): { sub?: string; email?: string; role?: string } | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length === 3) {
    try {
      const decoded = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
      return decoded;
    } catch {}
  }
  // Fallback for simple tokens like jwt_token_BASE64EMAIL_timestamp
  if (token.startsWith('jwt_token_')) {
    try {
      const segs = token.split('_');
      if (segs[2]) {
        const email = Buffer.from(segs[2], 'base64').toString('utf8');
        if (email.includes('@')) return { email };
      }
    } catch {}
  }
  return null;
}

