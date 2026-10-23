import { NextRequest, NextResponse } from 'next/server';
import { getDbPool, decodeServerJwt } from '@/lib/server-db';

const NEST_API_BASE = process.env.API_URL || 'http://127.0.0.1:4000/api';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const rawToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : authHeader.trim();

    // 1. Try forwarding to NestJS API if available
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500);

      const apiRes = await fetch(`${NEST_API_BASE}/auth/me`, {
        headers: {
          Authorization: authHeader,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (apiRes.ok) {
        const data = await apiRes.json();
        return NextResponse.json(data);
      }
    } catch {}

    // 2. Direct PostgreSQL fallback if NestJS is offline
    if (rawToken) {
      const decoded = decodeServerJwt(rawToken);
      const pool = getDbPool();

      if (pool) {
        let userRow = null;

        if (decoded?.sub && decoded.sub.length > 10 && !decoded.sub.startsWith('usr_')) {
          try {
            const res = await pool.query(
              'SELECT id, email, full_name, avatar_url, role, plan_tier, credits_balance, created_at, updated_at FROM users WHERE id::text = $1 LIMIT 1',
              [decoded.sub],
            );
            if (res.rows.length > 0) userRow = res.rows[0];
          } catch {}
        }

        if (!userRow && decoded?.email) {
          try {
            const res = await pool.query(
              'SELECT id, email, full_name, avatar_url, role, plan_tier, credits_balance, created_at, updated_at FROM users WHERE email = $1 LIMIT 1',
              [decoded.email.toLowerCase().trim()],
            );
            if (res.rows.length > 0) userRow = res.rows[0];
          } catch {}
        }

        if (userRow) {
          return NextResponse.json(userRow);
        }
      }
    }

    return NextResponse.json(
      {
        message: 'Unauthorized',
      },
      { status: 401 },
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        message: err?.message || 'Server xatosi',
      },
      { status: 500 },
    );
  }
}
