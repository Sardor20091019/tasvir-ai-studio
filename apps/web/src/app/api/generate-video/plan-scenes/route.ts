import { NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.API_URL || 'http://127.0.0.1:4000/api';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const body = await req.json();

    const apiRes = await fetch(`${API_BASE}/generate-video/plan-scenes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      body: JSON.stringify(body),
    });

    const data = await apiRes.json();
    return NextResponse.json(data, { status: apiRes.status });
  } catch (error: any) {
    return NextResponse.json(
      {
        statusCode: 502,
        message: 'Backend API serverga ulanishda xatolik: ' + (error?.message || 'Server xatosi'),
      },
      { status: 502 }
    );
  }
}

