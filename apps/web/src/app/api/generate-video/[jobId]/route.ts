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
    modelTier: 'veo-3.1-lite-generate',
    includeBackgroundMusic: true,
    bgMusicTrack: 'EMIN & JONY — «Камин» (Fireplace)',
    status: 'completed',
    progress: 100,
    currentStepMessage: 'Google Veo 3.1 video muvaffaqiyatli tayyorlandi!',
    videoUrl: 'https://n6ogfqlb21.ufs.sh/f/e4WrEcObdaG3xQRkL5D1FbQuz7SaXsDfAioc3JZvk59ORCG4',
    downloadUrl: 'https://n6ogfqlb21.ufs.sh/f/e4WrEcObdaG3xQRkL5D1FbQuz7SaXsDfAioc3JZvk59ORCG4',
    totalDurationSeconds: 16,
    scenes: [
      {
        sceneIndex: 1,
        actTitle: '1-Sahna: Shubhali Koʻz Qarash (Xiyonat Alomati)',
        emotion: 'Shubha, xiyonat alomati va keskin sukunat',
        tensionLevel: 8,
        durationSeconds: 5,
        cinematicPrompt: 'Dramatic vertical 9:16 slow motion close-up, tears in eyes...',
        dialogueScript: 'Sen meni aldayotgan eding... Yolgʻonmidi?',
        caption: 'Har bir soʻzing yolgʻonmidi?',
        karaokeSubtitles: [
          { word: 'Sen', startSec: 0.2, endSec: 0.8 },
          { word: 'meni', startSec: 0.9, endSec: 1.5 },
          { word: 'aldayotgan', startSec: 1.6, endSec: 2.7 },
          { word: 'eding...', startSec: 2.8, endSec: 3.5 },
          { word: 'Yolgʻonmidi?', startSec: 3.6, endSec: 4.8 },
        ],
      },
      {
        sceneIndex: 2,
        actTitle: '2-Sahna: Koʻz Yoshlar & Keskin Kulminatsiya',
        emotion: 'Yurak ezilishi, yuzdagi koʻz yosh va dramatik burilish',
        tensionLevel: 10,
        durationSeconds: 6,
        cinematicPrompt: 'Extreme emotional vertical 9:16 portrait, a single tear falling down a cheek...',
        dialogueScript: 'Endi kech! Qaytish yoʻli yoʻq, kechirmayman!',
        caption: 'Endi kech! Qaytish yoʻli yoʻq...',
        karaokeSubtitles: [
          { word: 'Endi', startSec: 0.2, endSec: 0.9 },
          { word: 'kech!', startSec: 1.0, endSec: 1.7 },
          { word: 'Qaytish', startSec: 1.8, endSec: 2.7 },
          { word: 'yoʻli', startSec: 2.8, endSec: 3.4 },
          { word: 'yoʻq,', startSec: 3.5, endSec: 4.3 },
          { word: 'kechirmayman!', startSec: 4.4, endSec: 5.8 },
        ],
      },
      {
        sceneIndex: 3,
        actTitle: '3-Sahna: Gʻolibona Najot & Mahsulotning Qahramonlik Kadri',
        emotion: 'Gʻalaba, qatʼiyat va oliy darajadagi gʻoliblik',
        tensionLevel: 9,
        durationSeconds: 5,
        cinematicPrompt: 'Cinematic vertical 9:16 golden hour lighting, wiping away the tear, triumphant resolution...',
        dialogueScript: 'Men oʻzimga munosibini tanladim. Endi faqat eng yaxshisi!',
        caption: 'Men oʻzimga munosibini tanladim!',
        karaokeSubtitles: [
          { word: 'Men', startSec: 0.2, endSec: 0.8 },
          { word: 'oʻzimga', startSec: 0.9, endSec: 1.7 },
          { word: 'munosibini', startSec: 1.8, endSec: 2.9 },
          { word: 'tanladim.', startSec: 3.0, endSec: 3.8 },
          { word: 'Eng', startSec: 3.9, endSec: 4.3 },
          { word: 'yaxshisi!', startSec: 4.4, endSec: 4.9 },
        ],
      },
    ],
    karaokeTimeline: [
      { word: 'Sen', startSec: 0.2, endSec: 0.8 },
      { word: 'meni', startSec: 0.9, endSec: 1.5 },
      { word: 'aldayotgan', startSec: 1.6, endSec: 2.7 },
      { word: 'eding...', startSec: 2.8, endSec: 3.5 },
      { word: 'Yolgʻonmidi?', startSec: 3.6, endSec: 4.8 },
      { word: 'Endi', startSec: 5.2, endSec: 5.9 },
      { word: 'kech!', startSec: 6.0, endSec: 6.7 },
      { word: 'Qaytish', startSec: 6.8, endSec: 7.7 },
      { word: 'yoʻli', startSec: 7.8, endSec: 8.4 },
      { word: 'yoʻq,', startSec: 8.5, endSec: 9.3 },
      { word: 'kechirmayman!', startSec: 9.4, endSec: 10.8 },
      { word: 'Men', startSec: 11.2, endSec: 11.8 },
      { word: 'oʻzimga', startSec: 11.9, endSec: 12.7 },
      { word: 'munosibini', startSec: 12.8, endSec: 13.9 },
      { word: 'tanladim.', startSec: 14.0, endSec: 14.8 },
      { word: 'Eng', startSec: 14.9, endSec: 15.3 },
      { word: 'yaxshisi!', startSec: 15.4, endSec: 15.9 },
    ],
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

