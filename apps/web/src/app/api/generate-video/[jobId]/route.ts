import { NextRequest, NextResponse } from 'next/server';
import { getDramaVideoJob } from '@/lib/gemini-video';

const API_BASE = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000/api';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;
  try {
    const authHeader = req.headers.get('authorization') || '';

    // 1. If an external backend is configured, attempt forwarding
    if (API_BASE && API_BASE.startsWith('http')) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2500);

        const apiRes = await fetch(`${API_BASE}/generate-video/${jobId}`, {
          headers: {
            ...(authHeader ? { Authorization: authHeader } : {}),
          },
          signal: controller.signal,
          cache: 'no-store',
        });

        clearTimeout(timeoutId);

        if (apiRes.ok) {
          const data = await apiRes.json();
          return NextResponse.json(data);
        }
      } catch (proxyErr) {
        // Fall back to direct local store lookup
      }
    }

    // 2. Direct job lookup in Next.js (serverless compatible)
    const job = await getDramaVideoJob(jobId);
    if (job) {
      return NextResponse.json(job);
    }

    return NextResponse.json(
      { error: 'Video vazifasi topilmadi' },
      { status: 404 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: `Video maʼlumotlarini olishda xatolik: ${err?.message || 'Server xatosi'}` },
      { status: 500 }
    );
  }
}
