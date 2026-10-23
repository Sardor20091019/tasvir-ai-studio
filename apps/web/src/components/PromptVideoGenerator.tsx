'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Sparkles,
  Video,
  Download,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Clock,
  Layers,
  Zap,
  ExternalLink,
  Flame,
  Film,
  Type,
  Radio,
  Lock,
  Scissors,
  Edit3,
  Check,
  ArrowRight,
  RefreshCw,
  FileText,
} from 'lucide-react';
import { api } from '../lib/api';
import { KaraokeWord, DramaScene, DramaVideoJob, LocaleType, User, VideoEditorProject } from '../types';
import { KaraokeSubtitles } from './KaraokeSubtitles';
import { SUBTITLE_PRESETS } from './CapCutEditor';

interface PromptVideoGeneratorProps {
  locale?: LocaleType;
  user?: User | null;
  onRequireAuth?: () => void;
  onVideoCreated?: (videoUrl: string) => void;
  onEditInCapCut?: (project: VideoEditorProject) => void;
}

const DRAMA_PROMPT_SUGGESTIONS = {
  uz: [
    {
      label: '💔 Xiyonat va Koʻz Yosh (AirPods Max)',
      prompt:
        "Dramatik xiyonat va koʻz yoshlar: Doʻstim meni arzon soxta naushnik bilan aldadi, lekin asl AirPods Max faqat Uzum Marketda 30% chegirma bilan sotilmoqda! Keskin burilish va qahramonona gʻalaba.",
    },
    {
      label: '😢 Rashk va Oltin Soat (Smart Watch)',
      prompt:
        "Yuqori emotsional ziddiyat: U mening sevgimga ishonmadi va sovgʻani rad etdi. Lekin Smart Watch Ultra soatini koʻrgach, barcha shubhalar koʻz yosh bilan yuvilib ketdi. 1+1 aksiyasi!",
    },
    {
      label: '🔥 Oʻch olish va Krossovka (Nike Pegasus)',
      prompt:
        "Dramatik poyga va ogʻriqli sinov: Yolgʻonlar tufayli yiqilgan qahramon yangi Nike Pegasus 40 krossovkasida oyoqqa turadi va qasoskorona marraga yetib keladi. Uzum Marketda tezkor yetkazish.",
    },
    {
      label: '✨ Samarqand Ipak Libosi (Xonatlas)',
      prompt:
        "Kelinlik koʻz yoshlari va ajdodlar anʼanasi: Toʻydan oldingi keskin dramatik daqiqa, Samarqand ipak xonatlasining goʻzalligi barcha xafagarchiliklarni unutdiradi.",
    },
  ],
  en: [
    {
      label: '💔 Betrayal & Tears (AirPods Max)',
      prompt:
        "Dramatic betrayal and tears: my friend deceived me with cheap fake earphones, but original AirPods Max are 30% off on Uzum Market! Sudden plot twist and triumphant resolution.",
    },
    {
      label: '😢 Jealousy & Gold Watch (Smart Watch)',
      prompt:
        "High emotional stakes: she rejected my gift due to misunderstandings. But unboxing the Smart Watch Ultra brings tears of cathartic joy. 1+1 Special Promotion!",
    },
    {
      label: '🔥 Revenge & Comeback (Nike Pegasus)',
      prompt:
        "Dramatic heartbreak and a relentless comeback: knocked down by rivals, the runner rises in Nike Pegasus 40 sneakers and crosses the finish line in glory.",
    },
    {
      label: '✨ Silk Khan-Atlas (Heritage)',
      prompt:
        "A bride crying before the wedding ceremony: the timeless beauty of handcrafted Samarkand silk khan-atlas dissolves all sorrow in pure celebration.",
    },
  ],
  ru: [
    {
      label: '💔 Предательство и Слёзы (AirPods Max)',
      prompt:
        "Драматическое предательство и слезы: меня обманули с дешевой подделкой, но настоящие AirPods Max только на Uzum Market со скидкой 30%! Неожиданный финал и триумф.",
    },
    {
      label: '😢 Ревность и Золотые Часы (Smart Watch)',
      prompt:
        "Высокое эмоциональное напряжение: она отвергла мой подарок из-за недоверия. Но увидев Smart Watch Ultra, слезы раскаяния изменили всё. Акция 1+1!",
    },
    {
      label: '🔥 Месть и Восхождение (Nike Pegasus)',
      prompt:
        "Драматическое падение и триумфальный подъем: преданный герой встает на ноги в кроссовках Nike Pegasus 40 и первым пересекает финишную черту.",
    },
    {
      label: '✨ Шёлковый Хан-атлас (Традиции)',
      prompt:
        "Слёзы невесты перед свадьбой и прощание с отчим домом: эстетичный шёлковый хан-атлас ручной работы исцеляет все душевные сомнения.",
    },
  ],
};

export function PromptVideoGenerator({
  locale = 'uz',
  user,
  onRequireAuth,
  onVideoCreated,
  onEditInCapCut,
}: PromptVideoGeneratorProps) {
  const t = {
    uz: {
      badge: 'GOOGLE VEO 3.1 & DRAMA ENGINE',
      title: 'Dramatik AI Mahsulot Reklamasi (Veo 3.1)',
      subtitle:
        'Google Veo 3.1 ("veo-3.1-lite-generate") orqali yuqori emotsional ziddiyat, xiyonat motivlari va koʻz yoshlar bilan toʻyingan 9:16 vertikal master video yarating.',
      promptLabel: 'Dramatik reklama gʻoyasi (Prompt)',
      promptPlaceholder:
        'Masalan: Xiyonat tufayli yigʻlayotgan qahramon va uning hayotini oʻzgartirgan kutilmagan sovgʻa...',
      suggestionsLabel: '🎭 Dramatik ssenariy gʻoyalari:',
      aspectRatioLabel: 'Video formati (Majburiy 9:16 Vertikal):',
      ratioLockedNote: 'Google Veo 3.1 vertikal 9:16 (1080x1920) formati Reels/TikTok/Uzum uchun mustahkamlangan.',
      durationBadge: '3 ta drama sahna • 15–18 soniya (har biri 4–8s)',
      planScenarioBtn: '🧠 AI Ssenariy Yaratish (Gemini)',
      planningScenarioBtn: 'Gemini ssenariyni shakllantirmoqda...',
      scenarioReviewTitle: '🎬 AI Ssenariy Tayyorlandi (Tasdiqlang yoki Tahrirlang)',
      scenarioReviewSub:
        'AI har bir sahna uchun kadr va dialoglarni yaratdi. Matnlarni xohishingizga koʻra oʻzgartirishingiz mumkin. Tasdiqlangach, video render boshlanadi.',
      confirmAndRenderBtn: '✅ Ssenariyni Tasdiqlash & Video Yaratish (Veo 3.1)',
      renderingBtn: 'Google Veo 3.1 videoni render qilmoqda...',
      regenerateScenarioBtn: '🔄 Qayta Ssenariy Yozish',
      backToPromptBtn: '✏️ Promptni Oʻzgartirish',
      sceneNumber: 'Sahna',
      dialogueLabel: 'Ovozli dialog (Subtitr):',
      captionLabel: 'Kadr ustidagi sarlavha:',
      durationLabel: 'Davomiyligi:',
      progressTitle: 'Google Veo 3.1 Dramatik Video Ishlab Chiqarilmoqda',
      completedTitle: 'Dramatik Master Video Tayyorlandi!',
      downloadBtn: 'MP4 Master Yuklab Olish',
      createAnother: 'Yangi dramatik video yaratish',
      karaokeTitle: 'Karaoke Subtitr Rejimi:',
      karaokeDomMode: 'Dinamik Reels Matni',
      karaokeCanvasMode: 'Canvas Qatlami',
      actsTitle: 'Dramatik Sahnalar Ketma-ketligi (FFmpeg Concat):',
      errorOccurred: 'Video yaratishda xatolik yuz berdi. Iltimos, qayta urinib koʻring.',
      errorTitle: 'Xatolik yuz berdi',
      tryAgain: 'Qayta urinish',
      openVideo: 'Videoni ochish',
      placeholderTitle: '9:16 Dramatik Master Video koʻrinishi',
      placeholderSub: 'Dramatik prompt kiriting va avval AI ssenariyni shakllantiring.',
    },
    en: {
      badge: 'GOOGLE VEO 3.1 & DRAMA ENGINE',
      title: 'Dramatic AI Product Ads (Veo 3.1)',
      subtitle:
        'Create high-stakes 9:16 vertical master video ads with Google Veo 3.1 ("veo-3.1-lite-generate") featuring betrayal tropes, emotional tears, and victorious redemption.',
      promptLabel: 'Dramatic Ad Idea (Prompt)',
      promptPlaceholder:
        'E.g., A protagonist crying after finding out they were betrayed, but a surprise product turns everything into victory...',
      suggestionsLabel: '🎭 Dramatic storyline concepts:',
      aspectRatioLabel: 'Video Format (Strictly 9:16 Vertical):',
      ratioLockedNote: 'Google Veo 3.1 vertical 9:16 (1080x1920) format locked for Reels, TikTok, and Uzum.',
      durationBadge: '3 drama acts • 15–18 seconds (4–8s each)',
      planScenarioBtn: '🧠 Generate AI Storyline (Gemini)',
      planningScenarioBtn: 'Gemini is framing scenes...',
      scenarioReviewTitle: '🎬 AI Storyline Ready (Review & Confirm)',
      scenarioReviewSub:
        'AI drafted the 3 dramatic scenes and dialogue. You can tweak any script or caption before launching the video render.',
      confirmAndRenderBtn: '✅ Confirm Scenario & Render Video (Veo 3.1)',
      renderingBtn: 'Google Veo 3.1 rendering video...',
      regenerateScenarioBtn: '🔄 Regenerate Storyline',
      backToPromptBtn: '✏️ Edit Prompt',
      sceneNumber: 'Scene',
      dialogueLabel: 'Dialogue / Voiceover Script:',
      captionLabel: 'Screen Caption:',
      durationLabel: 'Duration:',
      progressTitle: 'Creating Dramatic Video with Google Veo 3.1',
      completedTitle: 'Dramatic Master Video Ready!',
      downloadBtn: 'Download Master MP4',
      createAnother: 'Create another dramatic video',
      karaokeTitle: 'Karaoke Subtitle Mode:',
      karaokeDomMode: 'Dynamic Reels Text',
      karaokeCanvasMode: 'Canvas Layer',
      actsTitle: 'Dramatic Scenes Breakdown (FFmpeg Concat):',
      errorOccurred: 'An error occurred while creating the video. Please try again.',
      errorTitle: 'Error occurred',
      tryAgain: 'Try again',
      openVideo: 'Open video',
      placeholderTitle: '9:16 Dramatic Master Video Preview',
      placeholderSub: 'Enter a dramatic prompt and generate the AI scenes first.',
    },
    ru: {
      badge: 'GOOGLE VEO 3.1 & DRAMA ENGINE',
      title: 'Драматическая AI Реклама Товаров (Veo 3.1)',
      subtitle:
        'Создайте вертикальный 9:16 мастер-ролик через Google Veo 3.1 ("veo-3.1-lite-generate") с высоким накалом страстей, слезами и тропом предательства.',
      promptLabel: 'Драматическая идея рекламы (Промпт)',
      promptPlaceholder:
        'Например: Герой плачет из-за предательства партнера, но спасение приходит в виде неожиданного товара...',
      suggestionsLabel: '🎭 Идеи драматических сюжетов:',
      aspectRatioLabel: 'Формат видео (Строго 9:16 Вертикальный):',
      ratioLockedNote: 'Формат Google Veo 3.1 9:16 (1080x1920) закреплен для Reels/TikTok/Uzum.',
      durationBadge: '3 акта драмы • 15–18 сек (каждый от 4 до 8с)',
      planScenarioBtn: '🧠 Сгенерировать AI Сценарий (Gemini)',
      planningScenarioBtn: 'Gemini пишет драматический сценарий...',
      scenarioReviewTitle: '🎬 AI Сценарий Готов (Проверьте и Подтвердите)',
      scenarioReviewSub:
        'AI составил 3 сцены с диалогами. Вы можете отредактировать фразы перед запуском финального рендера.',
      confirmAndRenderBtn: '✅ Подтвердить Сценарий & Рендерить Видео (Veo 3.1)',
      renderingBtn: 'Google Veo 3.1 рендерит сцены...',
      regenerateScenarioBtn: '🔄 Переписать Сценарий',
      backToPromptBtn: '✏️ Изменить Промпт',
      sceneNumber: 'Сцена',
      dialogueLabel: 'Озвучка / Диалог (Субтитры):',
      captionLabel: 'Текст на кадре:',
      durationLabel: 'Длительность:',
      progressTitle: 'Идет создание драматического видео в Google Veo 3.1',
      completedTitle: 'Драматический Мастер-Ролик Готов!',
      downloadBtn: 'Скачать Мастер MP4',
      createAnother: 'Создать новый ролик',
      karaokeTitle: 'Режим Караоке Субтитров:',
      karaokeDomMode: 'Динамичный Reels Текст',
      karaokeCanvasMode: 'Слой Canvas',
      actsTitle: 'Сцены драмы (Объединение через FFmpeg Concat):',
      errorOccurred: 'Произошла ошибка при создании видео. Пожалуйста, попробуйте снова.',
      errorTitle: 'Произошла ошибка',
      tryAgain: 'Попробовать снова',
      openVideo: 'Открыть видео',
      placeholderTitle: 'Предпросмотр драматического 9:16 мастер-видео',
      placeholderSub: 'Введите промпт и сначала сгенерируйте AI сценарий.',
    },
  }[locale] || {
    badge: 'GOOGLE VEO 3.1 & DRAMA ENGINE',
    title: 'Dramatik AI Mahsulot Reklamasi (Veo 3.1)',
    subtitle: 'Google Veo 3.1 orqali 9:16 vertikal video yarating.',
    promptLabel: 'Dramatik reklama gʻoyasi (Prompt)',
    promptPlaceholder: 'Mahsulot haqida maʼlumot kiriting...',
    suggestionsLabel: '🎭 Tavsiya etilgan gʻoyalar:',
    aspectRatioLabel: 'Format: 9:16',
    ratioLockedNote: '9:16 Vertikal format.',
    durationBadge: '3 ta sahna • 15–18 soniya',
    planScenarioBtn: '🧠 AI Ssenariy Yaratish (Gemini)',
    planningScenarioBtn: 'Gemini ssenariyni shakllantirmoqda...',
    scenarioReviewTitle: '🎬 AI Ssenariy Tayyorlandi',
    scenarioReviewSub: 'Matnlarni tahrirlab, tasdiqlang.',
    confirmAndRenderBtn: '✅ Ssenariyni Tasdiqlash & Video Yaratish (Veo 3.1)',
    renderingBtn: 'Video render qilinmoqda...',
    regenerateScenarioBtn: '🔄 Qayta Ssenariy Yozish',
    backToPromptBtn: '✏️ Promptni Oʻzgartirish',
    sceneNumber: 'Sahna',
    dialogueLabel: 'Dialog:',
    captionLabel: 'Sarlavha:',
    durationLabel: 'Vaqt:',
    progressTitle: 'Video yaratilmoqda...',
    completedTitle: 'Video Tayyor!',
    downloadBtn: 'Yuklab Olish',
    createAnother: 'Yangi video yaratish',
    karaokeTitle: 'Karaoke Subtitr Rejimi:',
    karaokeDomMode: 'Reels Matni',
    karaokeCanvasMode: 'Canvas Qatlami',
    actsTitle: 'Sahnalar Ketma-ketligi:',
    errorOccurred: 'Xatolik yuz berdi.',
    errorTitle: 'Xatolik',
    tryAgain: 'Qayta urinish',
    openVideo: 'Videoni ochish',
    placeholderTitle: '9:16 Video koʻrinishi',
    placeholderSub: 'Dramatik prompt kiriting.',
  };

  const suggestions = DRAMA_PROMPT_SUGGESTIONS[locale] || DRAMA_PROMPT_SUGGESTIONS.uz;

  const [prompt, setPrompt] = useState(suggestions[0].prompt);
  const [subtitleMode, setSubtitleMode] = useState<'dom' | 'canvas'>('dom');

  // AI-first generation & confirmation states
  const [plannedScenes, setPlannedScenes] = useState<DramaScene[] | null>(null);
  const [isPlanningScenario, setIsPlanningScenario] = useState<boolean>(false);

  // Video render states
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [resultVideo, setResultVideo] = useState<{
    videoUrl: string;
    downloadUrl: string;
    scenes: DramaScene[];
    karaokeTimeline: KaraokeWord[];
    totalDurationSeconds: number;
    modelTier: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const rafRef = useRef<number | null>(null);

  const syncPlaybackTime = useCallback(() => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      if (!videoRef.current.paused && !videoRef.current.ended) {
        rafRef.current = requestAnimationFrame(syncPlaybackTime);
      }
    }
  }, []);

  const handleVideoPlay = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(syncPlaybackTime);
  };

  const handleVideoPause = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
  };

  const handleVideoTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // STEP 1: AI generates custom drama scenario from user's prompt
  const handlePlanScenario = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim()) return;

    if (!user) {
      const authMsg =
        locale === 'en'
          ? 'You must have an account to generate videos. Please sign in with Google first.'
          : locale === 'ru'
          ? 'Для создания видео необходимо войти в аккаунт. Пожалуйста, авторизуйтесь через Google.'
          : 'Video yaratish uchun avval hisobingizga kiring. Iltimos, Google orqali kiring.';
      setError(authMsg);
      onRequireAuth?.();
      return;
    }

    setIsPlanningScenario(true);
    setError(null);
    setResultVideo(null);

    try {
      const res = await api.planScenesFromPrompt({
        prompt: prompt.trim(),
        dramaLevel: 'high_tension',
      });

      if (!res?.scenes || res.scenes.length === 0) {
        throw new Error('AI ssenariyni shakllantira olmadi. Iltimos qaytadan urinib koʻring.');
      }

      setPlannedScenes(res.scenes);
    } catch (err: any) {
      console.error('Plan scenario error:', err);
      setError(err?.message || t.errorOccurred);
    } finally {
      setIsPlanningScenario(false);
    }
  };

  // Scene editing handler by user
  const handleUpdateScene = (index: number, field: keyof DramaScene, value: any) => {
    setPlannedScenes((prev) => {
      if (!prev) return prev;
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };

      if (field === 'dialogueScript') {
        const words = String(value).split(/\s+/).filter(Boolean);
        const duration = next[index].durationSeconds || 5;
        const step = duration / Math.max(1, words.length);
        next[index].karaokeSubtitles = words.map((w, wIdx) => ({
          word: w,
          startSec: Number((wIdx * step).toFixed(2)),
          endSec: Number(((wIdx + 1) * step).toFixed(2)),
        }));
      }
      return next;
    });
  };

  // STEP 2: User confirms the AI scenario and starts rendering the video
  const handleConfirmAndRender = async () => {
    if (!plannedScenes || plannedScenes.length === 0) return;

    setIsRendering(true);
    setError(null);
    setProgress(10);
    setStatusMessage(
      locale === 'en'
        ? 'Launching Google Veo 3.1 & dramatic storyline framing...'
        : locale === 'ru'
        ? 'Запуск Google Veo 3.1 и драматической раскадровки...'
        : 'Google Veo 3.1 va dramatik sahnalar generatsiyasi boshlanmoqda...',
    );
    setResultVideo(null);
    setCurrentTime(0);

    try {
      const res = await api.generateVideoFromPrompt({
        prompt: prompt.trim(),
        scenes: plannedScenes,
        aspectRatio: '9:16',
        includeBackgroundMusic: false,
      });

      if (!res?.jobId) {
        throw new Error(t.errorOccurred);
      }

      setJobId(res.jobId);
      setProgress(res.progress || 15);
      setStatusMessage(
        res.message ||
          (locale === 'en'
            ? 'Generating Google Veo 3.1 scenes...'
            : 'Google Veo 3.1 sahnalari tayyorlanmoqda...'),
      );

      startPolling(res.jobId);
    } catch (err: any) {
      console.error('Video rendering error:', err);
      setIsRendering(false);
      setError(err?.message || t.errorOccurred);
    }
  };

  const startPolling = (targetJobId: string) => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    let pollFailures = 0;

    pollIntervalRef.current = setInterval(async () => {
      try {
        const jobData: DramaVideoJob = await api.getPromptVideoStatus(targetJobId);
        pollFailures = 0;
        setProgress(jobData.progress || 25);
        setStatusMessage(
          jobData.currentStepMessage ||
            (locale === 'en'
              ? 'Processing Google Veo 3.1 dramatic video...'
              : 'Google Veo 3.1 dramatik video qayta ishlanmoqda...'),
        );

        if (jobData.status === 'completed' && jobData.videoUrl) {
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          setIsRendering(false);
          setResultVideo({
            videoUrl: jobData.videoUrl,
            downloadUrl: jobData.downloadUrl || jobData.videoUrl,
            scenes: jobData.scenes || plannedScenes || [],
            karaokeTimeline: jobData.karaokeTimeline || [],
            totalDurationSeconds: jobData.totalDurationSeconds || 16,
            modelTier: jobData.modelTier || 'veo-3.1-lite-generate',
          });
          onVideoCreated?.(jobData.videoUrl);
        } else if (jobData.status === 'failed') {
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          setIsRendering(false);
          setError(jobData.error || t.errorOccurred);
        }
      } catch (pollErr: any) {
        pollFailures++;
        console.warn('Polling check warning, attempt:', pollFailures);
        if (pollFailures >= 4) {
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          setIsRendering(false);
          setError(pollErr?.message || t.errorOccurred);
        }
      }
    }, 1500);
  };

  const handleReset = () => {
    setResultVideo(null);
    setPlannedScenes(null);
    setJobId(null);
    setProgress(0);
    setIsRendering(false);
    setIsPlanningScenario(false);
    setError(null);
    setCurrentTime(0);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8">
      <div className="text-center space-y-2.5">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-mono font-bold tracking-wide uppercase shadow-xs">
          <Flame className="h-4 w-4 text-amber-600 animate-pulse" />
          <span>{t.badge}</span>
        </div>
        <h2 className="font-heading font-black text-2xl sm:text-3xl text-ink tracking-tight">
          {t.title}
        </h2>
        <p className="text-sm text-ink-muted max-w-2xl mx-auto leading-relaxed">
          {t.subtitle}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Prompt Input OR AI Scenario Review & Confirmation */}
        <div className="lg:col-span-7 bg-surface rounded-3xl p-6 sm:p-7 border border-border shadow-sm space-y-6">
          {!plannedScenes ? (
            /* STEP 1: Enter prompt and generate AI scenario */
            <form onSubmit={handlePlanScenario} className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-heading font-bold text-ink flex items-center gap-1.5">
                    <Film className="h-3.5 w-3.5 text-coral" />
                    <span>{t.promptLabel}</span>
                  </label>
                  <span className="text-[11px] font-mono text-ink-muted">
                    {prompt.length}/2000
                  </span>
                </div>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={4}
                  maxLength={2000}
                  required
                  disabled={isPlanningScenario || isRendering}
                  placeholder={t.promptPlaceholder}
                  className="w-full px-4 py-3 text-sm rounded-2xl border border-border bg-surface-raised focus:bg-surface-overlay text-ink focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral transition-all resize-none leading-relaxed placeholder:text-ink-dim"
                />
              </div>

              <div className="space-y-2">
                <span className="text-[11px] font-semibold text-ink-muted block">
                  {t.suggestionsLabel}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {suggestions.map((sug, i) => (
                    <button
                      key={i}
                      type="button"
                      disabled={isPlanningScenario || isRendering}
                      onClick={() => setPrompt(sug.prompt)}
                      className="p-2.5 text-left rounded-xl text-xs bg-surface-raised hover:bg-surface-overlay border border-border text-ink transition-colors tactile-btn line-clamp-2 leading-snug"
                    >
                      {sug.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-heading font-bold text-ink flex items-center gap-1.5">
                    <Smartphone className="h-4 w-4 text-amber-500" />
                    <span>{t.aspectRatioLabel}</span>
                  </label>
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] font-mono font-bold uppercase">
                    Google Veo 3.1 • 9:16 (1080x1920)
                  </span>
                </div>
                <p className="text-[11px] text-ink-muted">
                  {t.ratioLockedNote}
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface border border-amber-400/40 text-ink text-xs font-bold shadow-2xs">
                    📱 9:16
                  </span>
                  <span className="text-xs text-ink-muted">
                    • {t.durationBadge}
                  </span>
                </div>
              </div>

              {error && (
                <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center justify-between gap-2 shadow-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                    <span className="font-medium truncate">{error}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handlePlanScenario()}
                    className="shrink-0 px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-[11px] transition-colors"
                  >
                    {t.tryAgain}
                  </button>
                </div>
              )}

              {!user ? (
                <button
                  type="button"
                  onClick={() => onRequireAuth?.()}
                  className="w-full py-4 px-6 rounded-2xl bg-coral hover:bg-coral-dark text-white font-heading font-extrabold text-sm shadow-md transition-all tactile-btn flex items-center justify-center gap-2"
                >
                  <Lock className="h-4 w-4" />
                  <span>
                    {locale === 'en'
                      ? '🔒 Sign in with Google to Generate Video'
                      : locale === 'ru'
                      ? '🔒 Войдите через Google для создания видео'
                      : '🔒 Video yaratish uchun avval tizimga kiring (Google)'}
                  </span>
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isPlanningScenario || !prompt.trim()}
                  className="w-full py-4 px-6 rounded-2xl bg-coral hover:bg-coral-dark disabled:opacity-50 text-white font-heading font-extrabold text-sm shadow-md transition-all tactile-btn flex items-center justify-center gap-2"
                >
                  <Sparkles className={`h-4 w-4 ${isPlanningScenario ? 'animate-spin' : ''}`} />
                  <span>
                    {isPlanningScenario ? t.planningScenarioBtn : t.planScenarioBtn}
                  </span>
                </button>
              )}
            </form>
          ) : (
            /* STEP 2: AI Scenario Review & User Confirmation Card */
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-600 flex items-center justify-center shrink-0">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-heading font-bold text-ink text-sm sm:text-base">
                    {t.scenarioReviewTitle}
                  </h3>
                  <p className="text-xs text-ink-muted leading-relaxed">
                    {t.scenarioReviewSub}
                  </p>
                </div>
              </div>

              {/* 3 Dramatic Scenes Cards */}
              <div className="space-y-4">
                {plannedScenes.map((scene, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-surface-raised border border-border space-y-3 transition-all hover:border-coral/40"
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-coral text-white text-xs font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <input
                          type="text"
                          value={scene.actTitle}
                          onChange={(e) => handleUpdateScene(idx, 'actTitle', e.target.value)}
                          disabled={isRendering}
                          className="font-heading font-bold text-xs sm:text-sm text-ink bg-transparent border-b border-transparent hover:border-border focus:border-coral focus:outline-none px-1 py-0.5 rounded transition-all"
                        />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-md bg-coral/10 text-coral text-[10px] font-bold">
                          ⚡ {scene.tensionLevel}/10
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-canvas border border-border text-ink-muted text-[10px] font-mono">
                          ⏱ {scene.durationSeconds}s
                        </span>
                      </div>
                    </div>

                    <p className="text-[11px] text-ink-muted italic pl-1">
                      {scene.emotion}
                    </p>

                    {/* Dialogue Textarea */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-ink flex items-center gap-1">
                        <Type className="h-3 w-3 text-coral" />
                        <span>{t.dialogueLabel}</span>
                      </label>
                      <textarea
                        rows={2}
                        value={scene.dialogueScript}
                        disabled={isRendering}
                        onChange={(e) => handleUpdateScene(idx, 'dialogueScript', e.target.value)}
                        className="w-full text-xs rounded-xl p-2.5 bg-canvas border border-border focus:border-coral focus:outline-none text-ink leading-relaxed resize-none"
                      />
                    </div>

                    {/* On-screen Caption */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-ink-muted">
                        {t.captionLabel}
                      </label>
                      <input
                        type="text"
                        value={scene.caption}
                        disabled={isRendering}
                        onChange={(e) => handleUpdateScene(idx, 'caption', e.target.value)}
                        className="w-full text-xs rounded-xl px-2.5 py-1.5 bg-canvas border border-border focus:border-coral focus:outline-none text-ink"
                      />
                    </div>

                    {/* Word tags preview */}
                    {scene.karaokeSubtitles && scene.karaokeSubtitles.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {scene.karaokeSubtitles.map((kw, kwIdx) => (
                          <span
                            key={kwIdx}
                            className="px-1.5 py-0.5 rounded bg-surface border border-border text-[10px] font-mono text-ink-muted"
                          >
                            {kw.word}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {error && (
                <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center justify-between gap-2 shadow-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                    <span className="font-medium truncate">{error}</span>
                  </div>
                </div>
              )}

              {/* Action Buttons: Confirm & Render OR Regenerate */}
              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  onClick={handleConfirmAndRender}
                  disabled={isRendering}
                  className="w-full py-4 px-6 rounded-2xl bg-coral hover:bg-coral-dark disabled:opacity-50 text-white font-heading font-extrabold text-sm shadow-md transition-all tactile-btn flex items-center justify-center gap-2"
                >
                  <Sparkles className={`h-4 w-4 ${isRendering ? 'animate-spin' : ''}`} />
                  <span>{isRendering ? t.renderingBtn : t.confirmAndRenderBtn}</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handlePlanScenario()}
                    disabled={isRendering}
                    className="py-2.5 px-3 rounded-xl border border-border bg-surface hover:bg-surface-raised text-ink text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <RefreshCw className="h-3.5 w-3.5 text-ink-muted" />
                    <span>{t.regenerateScenarioBtn}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPlannedScenes(null)}
                    disabled={isRendering}
                    className="py-2.5 px-3 rounded-xl border border-border bg-surface hover:bg-surface-raised text-ink-muted hover:text-ink text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    <span>{t.backToPromptBtn}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Video Player / Progress / Empty State */}
        <div className="lg:col-span-5 bg-surface rounded-3xl p-6 border border-border shadow-sm flex flex-col justify-center min-h-[500px]">
          {!isRendering && !resultVideo && !error && (
            <div className="text-center py-14 px-4 space-y-4">
              <div className="h-16 w-16 mx-auto rounded-2xl bg-canvas border border-border flex items-center justify-center text-ink-muted shadow-xs">
                <Video className="h-8 w-8 text-coral" />
              </div>
              <div className="space-y-1">
                <h4 className="font-heading font-bold text-ink text-base">
                  {t.placeholderTitle}
                </h4>
                <p className="text-xs text-ink-muted max-w-xs mx-auto leading-relaxed">
                  {t.placeholderSub}
                </p>
              </div>
            </div>
          )}

          {error && !isRendering && !resultVideo && (
            <div className="text-center py-12 px-4 space-y-4 animate-in fade-in duration-200">
              <div className="h-16 w-16 mx-auto rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center text-red-500 shadow-xs">
                <AlertCircle className="h-8 w-8 text-red-500" />
              </div>
              <div className="space-y-1.5">
                <h4 className="font-heading font-bold text-red-700 text-base">
                  {t.errorTitle}
                </h4>
                <p className="text-xs text-red-600 max-w-sm mx-auto leading-relaxed">
                  {error}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (plannedScenes) {
                    handleConfirmAndRender();
                  } else {
                    handlePlanScenario();
                  }
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors shadow-xs"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>{t.tryAgain}</span>
              </button>
            </div>
          )}

          {isRendering && (
            <div className="py-8 px-4 text-center space-y-6 animate-in fade-in duration-200">
              <div className="relative mx-auto h-20 w-20 flex items-center justify-center">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-coral opacity-25"></span>
                <div className="h-16 w-16 rounded-2xl bg-coral text-white flex items-center justify-center shadow-lg">
                  <Sparkles className="h-8 w-8 animate-spin" />
                </div>
              </div>

              <div className="space-y-1.5">
                <h4 className="font-heading font-bold text-ink text-base">
                  {t.progressTitle}
                </h4>
                <p className="text-xs text-ink-muted font-medium font-mono leading-relaxed">
                  {statusMessage}
                </p>
              </div>

              <div className="space-y-2 max-w-xs mx-auto">
                <div className="w-full h-2.5 rounded-full bg-canvas border border-border overflow-hidden">
                  <div
                    className="h-full bg-coral transition-all duration-300 rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] font-mono text-ink-muted">
                  <span>{locale === 'en' ? 'Progress:' : 'Jarayon:'}</span>
                  <span className="font-bold text-coral">{progress}%</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-canvas border border-border text-[11px] text-ink-muted text-left space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-ink flex items-center gap-1.5">
                    <Zap className="h-3 w-3 text-coral" />
                    <span>Veo 3.1 & FFmpeg Pipeline:</span>
                  </span>
                  <span className="font-mono text-[10px] bg-neutral-200 px-1.5 py-0.5 rounded">
                    9:16
                  </span>
                </div>
                <div className="space-y-1 text-[11px] text-ink-muted">
                  <p>• {locale === 'en' ? 'Act 1: Suspicion & Betrayal Tropes (4–8s)' : '1-Akt: Shubhali Koʻz Qarash & Xiyonat Alomati (4–8s)'}</p>
                  <p>• {locale === 'en' ? 'Act 2: Crying & Climax Confrontation (4–8s)' : '2-Akt: Koʻz Yoshlar & Keskin Kulminatsiya (4–8s)'}</p>
                  <p>• {locale === 'en' ? 'Act 3: Triumphant Resolution & Hero Shot (4–8s)' : '3-Akt: Gʻolibona Qahramonlik Kadri (4–8s)'}</p>
                  <p>
                    • FFmpeg Concat Demuxer + {locale === 'en' ? 'Natural voice dialogue' : 'Tabiiy nutq va ovoz'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {resultVideo && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>{t.completedTitle}</span>
                </div>
                <span className="text-[10px] font-mono uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-bold">
                  9:16 • {resultVideo.totalDurationSeconds}s
                </span>
              </div>

              <div className="flex items-center justify-between px-2 text-xs">
                <span className="text-[11px] font-semibold text-ink-muted flex items-center gap-1">
                  <Type className="h-3 w-3 text-coral" />
                  <span>{t.karaokeTitle}</span>
                </span>
                <div className="flex items-center gap-1 bg-canvas p-0.5 rounded-lg border border-border">
                  <button
                    type="button"
                    onClick={() => setSubtitleMode('dom')}
                    className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                      subtitleMode === 'dom'
                        ? 'bg-white text-ink shadow-2xs'
                        : 'text-ink-muted hover:text-ink'
                    }`}
                  >
                    Reels (HTML)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSubtitleMode('canvas')}
                    className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                      subtitleMode === 'canvas'
                        ? 'bg-white text-ink shadow-2xs'
                        : 'text-ink-muted hover:text-ink'
                    }`}
                  >
                    Canvas
                  </button>
                </div>
              </div>

              <div className="relative mx-auto rounded-3xl overflow-hidden bg-black shadow-xl border border-border/80 w-[240px] sm:w-[260px] aspect-[9/16] flex items-center justify-center group">
                <video
                  ref={videoRef}
                  key={resultVideo.videoUrl}
                  src={resultVideo.videoUrl}
                  controls
                  autoPlay
                  playsInline
                  loop
                  onPlay={handleVideoPlay}
                  onPause={handleVideoPause}
                  onTimeUpdate={handleVideoTimeUpdate}
                  className="w-full h-full object-cover"
                />

                <div className="absolute inset-0 pointer-events-none flex flex-col justify-end">
                  <KaraokeSubtitles
                    currentTime={currentTime}
                    subtitles={resultVideo.karaokeTimeline}
                    scenes={resultVideo.scenes}
                    renderMode={subtitleMode}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-ink-muted px-1">
                <span className="flex items-center gap-1 text-ink font-medium truncate max-w-[200px]">
                  <Film className="h-3.5 w-3.5 shrink-0 text-coral" />
                  <span className="truncate">
                    {locale === 'en' ? 'Veo 3.1 • 9:16 Vertical' : 'Veo 3.1 • 9:16 Vertikal'}
                  </span>
                </span>
                <span className="font-mono text-[10px] bg-canvas border border-border px-1.5 py-0.5 rounded shrink-0">
                  {currentTime.toFixed(1)}s / {resultVideo.totalDurationSeconds}s
                </span>
              </div>

              <div className="space-y-2 pt-1">
                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={resultVideo.videoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="py-2.5 px-3 rounded-xl bg-ink hover:bg-neutral-800 text-white font-heading font-bold text-xs shadow-sm transition-all tactile-btn flex items-center justify-center gap-1.5"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>{t.openVideo}</span>
                  </a>

                  <a
                    href={resultVideo.downloadUrl}
                    download="veo-3.1-dramatic-product-ad.mp4"
                    target="_blank"
                    rel="noreferrer"
                    className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-heading font-bold text-xs shadow-sm transition-all tactile-btn flex items-center justify-center gap-1.5"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>{t.downloadBtn}</span>
                  </a>
                </div>

                {/* Edit in CapCut Studio Button */}
                <button
                  type="button"
                  onClick={() => {
                    if (onEditInCapCut) {
                      onEditInCapCut({
                        id: jobId || `proj-${Date.now()}`,
                        title: prompt || 'Veo 3.1 AI Video',
                        videoUrl: resultVideo.videoUrl || '',
                        duration: resultVideo.totalDurationSeconds || 16,
                        scenes: resultVideo.scenes || [],
                        style: SUBTITLE_PRESETS.capcut_yellow,
                        subtitles: (resultVideo.scenes || []).map((s, idx) => {
                          const startSec = idx * 5;
                          const endSec = startSec + (s.durationSeconds || 5);
                          return {
                            id: `cue-${idx}`,
                            startSec,
                            endSec,
                            text: s.dialogueScript || s.caption || '',
                            words: s.karaokeSubtitles || [],
                          };
                        }),
                      });
                    }
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-accent-warm hover:bg-accent-warm-hover text-obsidian font-heading font-extrabold text-xs shadow-tactile transition-all tactile-btn flex items-center justify-center gap-2"
                >
                  <Scissors className="h-3.5 w-3.5" />
                  <span>
                    {locale === 'en'
                      ? '✂️ Edit Subtitles in CapCut Studio'
                      : locale === 'ru'
                      ? '✂️ Редактировать субтитры в CapCut Студии'
                      : '✂️ CapCut Muharririda subtitrlarni tahrirlash'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  className="w-full py-2 px-3 rounded-xl border border-border bg-surface hover:bg-surface-raised text-ink-muted hover:text-ink text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>{t.createAnother}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
