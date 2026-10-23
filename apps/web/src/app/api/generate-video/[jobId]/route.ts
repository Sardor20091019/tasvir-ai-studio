import { NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.API_URL || 'http://127.0.0.1:4000/api';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;
  try {
    const authHeader = req.headers.get('authorization') || '';
    const apiRes = await fetch(`${API_BASE}/generate-video/${jobId}`, {
      headers: {
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      cache: 'no-store',
    });

    if (apiRes.ok) {
      const data = await apiRes.json();
      return NextResponse.json(data);
    }

    const errData = await apiRes.json().catch(() => null);
    return NextResponse.json(
      { error: errData?.message || 'Video vazifasi topilmadi' },
      { status: apiRes.status || 404 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: `API serveriga bogʻlanishda xatolik: ${err?.message || 'Server unavailable'}` },
      { status: 502 }
    );
  }
}
