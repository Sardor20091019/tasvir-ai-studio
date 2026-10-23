import { NextRequest, NextResponse } from 'next/server';
import { createDramaVideoJob } from '@/lib/gemini-video';

const API_BASE = process.env.API_URL;

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        {
          statusCode: 401,
          message: 'Video yaratish uchun avval tizimga kiring (Google hisobingiz orqali)',
        },
        { status: 401 }
      );
    }

    const body = await req.json();

    // 1. If an external backend is configured, attempt forwarding
    if (API_BASE && API_BASE.startsWith('http')) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        const apiRes = await fetch(`${API_BASE}/generate-video`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: authHeader,
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (apiRes.ok) {
          const data = await apiRes.json();
          return NextResponse.json(data, { status: apiRes.status });
        }
      } catch (proxyErr) {
        console.warn('Proxy to backend failed, handling video job in Next.js:', proxyErr);
      }
    }

    // 2. Direct Video Job Creation (works seamlessly on real deployed website / Vercel)
    const jobResult = await createDramaVideoJob(body);
    return NextResponse.json(jobResult);
  } catch (error: any) {
    console.error('Video creation route error:', error);
    return NextResponse.json(
      {
        statusCode: 500,
        message: 'Video yaratishda xatolik yuz berdi: ' + (error?.message || 'Server xatosi'),
      },
      { status: 500 }
    );
  }
}
