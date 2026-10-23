import { NextRequest, NextResponse } from 'next/server';
import { getDbPool, signServerJwt } from '@/lib/server-db';

const NEST_API_BASE = process.env.API_URL || 'http://127.0.0.1:4000/api';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. Try forwarding to NestJS API if available
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      const apiRes = await fetch(`${NEST_API_BASE}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (apiRes.ok) {
        const data = await apiRes.json();
        return NextResponse.json(data, { status: apiRes.status });
      }

      // If NestJS responded with an error (e.g. Turnstile failure), return it strictly - do NOT bypass!
      const errData = await apiRes.json().catch(() => null);
      return NextResponse.json(
        errData || { message: 'Cloudflare Turnstile tekshiruvidan oʻtish shart' },
        { status: apiRes.status },
      );
    } catch {
      // NestJS backend offline / network unreachable, continue to direct DB handler
    }

    // 2. Strict Turnstile verification for direct DB fallback
    if (!body?.turnstileToken || body.turnstileToken.includes('bypass')) {
      return NextResponse.json(
        { message: 'Cloudflare Turnstile tekshiruvidan oʻtish shart (Botlardan himoya)' },
        { status: 400 },
      );
    }

    const cfSecret = process.env.TURNSTILE_SECRET_KEY || '0x4AAAAAAFdvkDC021HoBq0VPu3HTgzFuP4';
    try {
      const formData = new URLSearchParams();
      formData.append('secret', cfSecret);
      formData.append('response', body.turnstileToken);

      const cfRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        body: formData,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      const cfData: any = await cfRes.json();
      if (!cfData?.success) {
        return NextResponse.json(
          { message: 'Cloudflare Turnstile tekshiruvidan oʻtmadi' },
          { status: 400 },
        );
      }
    } catch (cfErr: any) {
      // Strict: when Cloudflare fails, do NOT bypass
      return NextResponse.json(
        { message: 'Cloudflare Turnstile xizmatida xatolik yuz berdi. Qayta urinib koʻring.' },
        { status: 400 },
      );
    }

    // 3. Direct PostgreSQL resolution
    let email = (body.email || '').trim().toLowerCase();
    let name = body.name || 'Google User';
    let picture = body.avatarUrl || null;

    if (body.credential && body.credential.length > 50 && body.credential.includes('.')) {
      try {
        const verifyRes = await fetch(
          `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(body.credential)}`,
          { next: { revalidate: 0 } },
        );
        if (verifyRes.ok) {
          const gInfo: any = await verifyRes.json();
          if (gInfo.email) email = gInfo.email.trim().toLowerCase();
          if (gInfo.name) name = gInfo.name;
          if (gInfo.picture) picture = gInfo.picture;
        }
      } catch {}
    }

    if (!email) {
      email = 'user@google.com';
    }

    const pool = getDbPool();
    let userRow: any = null;

    if (pool) {
      try {
        const existing = await pool.query(
          'SELECT id, email, full_name, avatar_url, role, plan_tier, credits_balance, created_at, updated_at FROM users WHERE email = $1 LIMIT 1',
          [email],
        );

        if (existing.rows.length > 0) {
          // Admin status strictly comes from users table role column in DB
          userRow = existing.rows[0];
        } else {
          const insertRes = await pool.query(
            `INSERT INTO users (email, full_name, avatar_url, telegram_id, locale, role, plan_tier, credits_balance)
             VALUES ($1, $2, $3, NULL, 'uz', 'user', 'starter', 0)
             RETURNING id, email, full_name, avatar_url, role, plan_tier, credits_balance, created_at, updated_at`,
            [email, name, picture],
          );
          userRow = insertRes.rows[0];
        }
      } catch (dbErr) {
        console.warn('Direct DB query in Google auth failed:', dbErr);
      }
    }

    if (!userRow) {
      userRow = {
        id: body.googleId || `usr_${Date.now()}`,
        email,
        full_name: name,
        avatar_url: picture,
        telegram_id: null,
        locale: 'uz',
        role: 'user',
        plan_tier: 'starter',
        credits_balance: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }

    const token = signServerJwt({
      sub: userRow.id,
      email: userRow.email,
      role: userRow.role,
    });

    return NextResponse.json({
      user: userRow,
      token,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        message: err?.message || 'Google autentifikatsiyasida xatolik yuz berdi',
      },
      { status: 500 },
    );
  }
}
