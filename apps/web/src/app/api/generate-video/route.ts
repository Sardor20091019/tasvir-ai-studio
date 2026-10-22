import { NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.API_URL || 'http://127.0.0.1:4000/api';

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

    const apiRes = await fetch(`${API_BASE}/generate-video`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify(body),
    });

    const data = await apiRes.json();
    return NextResponse.json(data, { status: apiRes.status });
  } catch (error: any) {
    return NextResponse.json(
      {
        statusCode: 500,
        message: 'Video yaratishda xatolik yuz berdi. Iltimos, qayta urinib koʻring.',
      },
      { status: 500 }
    );
  }
}

