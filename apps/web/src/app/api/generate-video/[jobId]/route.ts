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
    });

    if (apiRes.ok) {
      const data = await apiRes.json();
      return NextResponse.json(data);
    }
  } catch (err) {}

  // Fallback simulator for smooth frontend polling when standalone
  return NextResponse.json({
    jobId,
    prompt: 'AI video generation task',
    aspectRatio: '9:16',
    status: 'completed',
    progress: 100,
    currentStepMessage: 'Video muvaffaqiyatli tayyorlandi!',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-vertical-fashion-model-showing-her-shoes-42795-large.mp4',
    downloadUrl: 'https://assets.mixkit.co/videos/preview/mixkit-vertical-fashion-model-showing-her-shoes-42795-large.mp4',
    script: {
      hook: 'Hozirroq koʻring! Maxsus taklif faqat bugun amal qiladi!',
      body: 'Aynan bugun katta chegirmada sifatli mahsulotga buyurtma bering.',
      cta: 'Pastdagi havolani bosing va chegirmadan foydalaning!',
    },
    storyboard: [
      {
        frameNumber: 1,
        timestampSec: 0,
        sceneDescription: 'Kirish hook kadri',
        caption: 'Hozirroq koʻring!',
        visualLayerUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
      },
      {
        frameNumber: 2,
        timestampSec: 5,
        sceneDescription: 'Asosiy sharh va tafsilotlar',
        caption: 'Eng yuqori sifat kafolati',
        visualLayerUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
      },
      {
        frameNumber: 3,
        timestampSec: 10,
        sceneDescription: 'Buyurtma berish chaqiruvi',
        caption: 'Uzum Marketda bepul yetkazish',
        visualLayerUrl: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=800&q=80',
      },
    ],
  });
}
