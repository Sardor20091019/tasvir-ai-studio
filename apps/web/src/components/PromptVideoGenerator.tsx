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
} from 'lucide-react';
import { api } from '../lib/api';
import { KaraokeWord, DramaScene, DramaVideoJob, LocaleType, User } from '../types';
import { KaraokeSubtitles } from './KaraokeSubtitles';

interface PromptVideoGeneratorProps {
  locale?: LocaleType;
  user?: User | null;
  onRequireAuth?: () => void;
  onVideoCreated?: (videoUrl: string) => void;
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
      generateBtn: '🎬 Veo 3.1 Dramatik Video Yaratish',
      generatingBtn: 'Veo 3.1 sahnalari generatsiya qilinmoqda...',
      progressTitle: 'Google Veo 3.1 Dramatik Video Ishlab Chiqarilmoqda',
      completedTitle: 'Dramatik Master Video Tayyorlandi!',
      downloadBtn: 'MP4 Master Yuklab Olish',
      createAnother: 'Yangi dramatik video yaratish',
      karaokeTitle: 'Karaoke Subtitr Rejimi:',
      karaokeDomMode: 'Dinamik Reels Matni',
      karaokeCanvasMode: 'Canvas Qatlami',
      actsTitle: 'Dramatik Sahnalar Ketma-ketligi (FFmpeg Concat):',
      errorOccurred: 'Video yaratishda xatolik yuz berdi. Iltimos, qayta urinib koʻring.',
      errorTitle: 'Video yaratishda xatolik yuz berdi',
      tryAgain: 'Qayta urinish',
      openVideo: 'Videoni ochish',
      placeholderTitle: '9:16 Dramatik Master Video koʻrinishi',
      placeholderSub: 'Dramatik prompt kiriting va Google Veo 3.1 ssenariysini yaratishni boshlang.',
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
      generateBtn: '🎬 Create Veo 3.1 Dramatic Video',
      generatingBtn: 'Generating scenes with Veo 3.1...',
      progressTitle: 'Creating Dramatic Video with Google Veo 3.1',
      completedTitle: 'Dramatic Master Video Ready!',
      downloadBtn: 'Download Master MP4',
      createAnother: 'Create another dramatic video',
      karaokeTitle: 'Karaoke Subtitle Mode:',
      karaokeDomMode: 'Dynamic Reels Text',
      karaokeCanvasMode: 'Canvas Layer',
      actsTitle: 'Dramatic Scenes Breakdown (FFmpeg Concat):',
      errorOccurred: 'An error occurred while creating the video. Please try again.',
      errorTitle: 'Error occurred while creating video',
      tryAgain: 'Try again',
      openVideo: 'Open video',
      placeholderTitle: '9:16 Dramatic Master Video Preview',
      placeholderSub: 'Enter a dramatic prompt and start generating your Google Veo 3.1 storyline.',
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
      generateBtn: '🎬 Создать Veo 3.1 Драматическое Видео',
      generatingBtn: 'Генерация сцен через Veo 3.1...',
      progressTitle: 'Идет создание драматического видео в Google Veo 3.1',
      completedTitle: 'Драматический Мастер-Ролик Готов!',
      downloadBtn: 'Скачать Мастер MP4',
      createAnother: 'Создать новый ролик',
      karaokeTitle: 'Режим Караоке Субтитров:',
      karaokeDomMode: 'Динамичный Reels Текст',
      karaokeCanvasMode: 'Слой Canvas',
      actsTitle: 'Сцены драмы (Объединение через FFmpeg Concat):',
      errorOccurred: 'Произошла ошибка при создании видео. Пожалуйста, попробуйте снова.',
      errorTitle: 'Произошла ошибка при создании видео',
      tryAgain: 'Попробовать снова',
      openVideo: 'Открыть видео',
      placeholderTitle: 'Предпросмотр драматического 9:16 мастер-видео',
      placeholderSub: 'Введите драматический промпт и начните генерацию сюжета в Google Veo 3.1.',
    },
  }[locale] || {
    badge: 'GOOGLE VEO 3.1 & DRAMA ENGINE',
    title: 'Dramatic AI Product Ads (Veo 3.1)',
    subtitle: 'Create high-stakes 9:16 vertical master video ads with Google Veo 3.1.',
    promptLabel: 'Dramatic Ad Idea (Prompt)',
    promptPlaceholder: 'Enter a dramatic prompt...',
    suggestionsLabel: '🎭 Dramatic storyline concepts:',
    aspectRatioLabel: 'Video Format (Strictly 9:16 Vertical):',
    ratioLockedNote: 'Google Veo 3.1 vertical 9:16 format.',
    durationBadge: '3 drama acts • 15–18 seconds',
    generateBtn: '🎬 Create Veo 3.1 Dramatic Video',
    generatingBtn: 'Generating scenes with Veo 3.1...',
    progressTitle: 'Creating Dramatic Video with Google Veo 3.1',
    completedTitle: 'Dramatic Master Video Ready!',
    downloadBtn: 'Download Master MP4',
    createAnother: 'Create another dramatic video',
    karaokeTitle: 'Karaoke Subtitle Mode:',
    karaokeDomMode: 'Dynamic Reels Text',
    karaokeCanvasMode: 'Canvas Layer',
    actsTitle: 'Dramatic Scenes Breakdown:',
    errorOccurred: 'An error occurred while creating the video. Please try again.',
    errorTitle: 'Error occurred while creating video',
    tryAgain: 'Try again',
    openVideo: 'Open video',
    placeholderTitle: '9:16 Dramatic Master Video Preview',
    placeholderSub: 'Enter a prompt to start generating.',
  };

  const suggestions = DRAMA_PROMPT_SUGGESTIONS[locale] || DRAMA_PROMPT_SUGGESTIONS.uz;

  const [prompt, setPrompt] = useState(suggestions[0].prompt);
  const [subtitleMode, setSubtitleMode] = useState<'dom' | 'canvas'>('dom');

  const [isLoading, setIsLoading] = useState(false);
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

  const handleStartGeneration = async (e?: React.FormEvent) => {
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

    setIsLoading(true);
    setError(null);
    setProgress(10);
    setStatusMessage(
      locale === 'en'
        ? 'Launching Google Veo 3.1 & dramatic storyline framing...'
        : locale === 'ru'
        ? 'Запуск Google Veo 3.1 и драматической раскадровки...'
        : 'Google Veo 3.1 va dramatik ssenariy tizimi ishga tushirilmoqda...',
    );
    setResultVideo(null);
    setCurrentTime(0);

    try {
      const res = await api.generateVideoFromPrompt({
        prompt: prompt.trim(),
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
      console.error('Video generation start error:', err);
      setIsLoading(false);
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
          setIsLoading(false);
          setResultVideo({
            videoUrl: jobData.videoUrl,
            downloadUrl: jobData.downloadUrl || jobData.videoUrl,
            scenes: jobData.scenes || [],
            karaokeTimeline: jobData.karaokeTimeline || [],
            totalDurationSeconds: jobData.totalDurationSeconds || 16,
            modelTier: jobData.modelTier || 'veo-3.1-lite-generate',
          });
          onVideoCreated?.(jobData.videoUrl);
        } else if (jobData.status === 'failed') {
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          setIsLoading(false);
          setError(jobData.error || t.errorOccurred);
        }
      } catch (pollErr: any) {
        pollFailures++;
        console.warn('Polling check warning, attempt:', pollFailures);
        if (pollFailures >= 4) {
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          setIsLoading(false);
          setError(pollErr?.message || t.errorOccurred);
        }
      }
    }, 1500);
  };

  const handleReset = () => {
    setResultVideo(null);
    setJobId(null);
    setProgress(0);
    setIsLoading(false);
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
        <div className="lg:col-span-7 bg-surface rounded-3xl p-6 sm:p-7 border border-border shadow-sm space-y-6">
          <form onSubmit={handleStartGeneration} className="space-y-6">
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
                disabled={isLoading}
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
                    disabled={isLoading}
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
                  onClick={() => handleStartGeneration()}
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
                disabled={isLoading || !prompt.trim()}
                className="w-full py-4 px-6 rounded-2xl bg-coral hover:bg-coral-dark disabled:opacity-50 text-white font-heading font-extrabold text-sm shadow-md transition-all tactile-btn flex items-center justify-center gap-2"
              >
                <Sparkles className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span>{isLoading ? t.generatingBtn : t.generateBtn}</span>
              </button>
            )}
          </form>
        </div>

        <div className="lg:col-span-5 bg-surface rounded-3xl p-6 border border-border shadow-sm flex flex-col justify-center min-h-[500px]">
          {!isLoading && !resultVideo && !error && (
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

          {error && !isLoading && !resultVideo && (
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
                onClick={() => handleStartGeneration()}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors shadow-xs"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>{t.tryAgain}</span>
              </button>
            </div>
          )}

          {isLoading && (
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

                <button
                  type="button"
                  onClick={handleReset}
                  className="w-full py-2.5 px-4 rounded-xl border border-border bg-canvas hover:bg-neutral-200 text-ink font-heading font-semibold text-xs transition-colors tactile-btn flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="h-3.5 w-3.5 text-ink-muted" />
                  <span>{t.createAnother}</span>
                </button>
              </div>

              {Array.isArray(resultVideo.scenes) && resultVideo.scenes.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-border/70">
                  <span className="font-heading font-bold text-ink block text-xs">
                    {t.actsTitle}
                  </span>
                  <div className="space-y-2">
                    {resultVideo.scenes.map((scene) => (
                      <div
                        key={scene.sceneIndex}
                        className="p-3 rounded-xl bg-canvas border border-border text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-heading font-bold text-ink text-[11px]">
                            {scene.actTitle}
                          </span>
                          <span className="font-mono text-[10px] bg-amber-500/10 text-amber-800 font-bold px-1.5 py-0.5 rounded">
                            {scene.durationSeconds}s • {locale === 'en' ? 'Tension' : 'Ziddiyat'}: {scene.tensionLevel}/10
                          </span>
                        </div>
                        <p className="text-[11px] text-ink-muted">
                          <strong className="text-ink">{locale === 'en' ? 'Emotion:' : 'Emotsiya:'}</strong> {scene.emotion}
                        </p>
                        <p className="text-[11px] text-ink-muted italic">
                          &quot;{scene.dialogueScript}&quot;
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
