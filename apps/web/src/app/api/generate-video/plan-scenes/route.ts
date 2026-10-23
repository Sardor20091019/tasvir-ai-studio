import { NextRequest, NextResponse } from 'next/server';
import { generateDramaScenesWithGemini } from '@/lib/gemini-video';

const API_BASE = process.env.API_URL;

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const body = await req.json();

    // 1. If an external backend is configured, attempt forwarding
    if (API_BASE && API_BASE.startsWith('http')) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        const apiRes = await fetch(`${API_BASE}/generate-video/plan-scenes`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(authHeader ? { Authorization: authHeader } : {}),
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
        console.warn('Proxy to backend failed, falling back to Gemini AI:', proxyErr);
      }
    }

    // 2. Direct Gemini AI execution (works seamlessly on real deployed website / Vercel)
    const result = await generateDramaScenesWithGemini(
      body.prompt || '',
      body.dramaLevel,
      body.productImageUrl || body.imageUrl,
    );
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Plan scenes execution error:', error);
    return NextResponse.json(
      {
        statusCode: 500,
        message: 'AI ssenariy yaratishda xatolik yuz berdi: ' + (error?.message || 'Server xatosi'),
      },
      { status: 500 }
    );
  }
}
