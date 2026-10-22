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
  Music,
  Volume2,
  VolumeX,
  Flame,
  Film,
  Type,
  Radio,
} from 'lucide-react';
import { api } from '../lib/api';
import { KaraokeWord, DramaScene, DramaVideoJob } from '../types';
import { KaraokeSubtitles } from './KaraokeSubtitles';

interface PromptVideoGeneratorProps {
  locale?: 'uz' | 'ru';
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
      musicLabel: 'Fon musiqasi (Muxing Audio):',
      musicTrackName: 'EMIN & JONY — «Камин» (Fireplace)',
      musicToggleOn: 'Musiqa yoqilgan (Kamin ovozi balandligi muvozanatlangan)',
      musicToggleOff: 'Musiqa oʻchirilgan (Faqat nutq va dramatik ovoz)',
      musicPreviewBtn: 'Treknı tinglash',
      musicPreviewStop: 'Toʻxtatish',
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
      musicLabel: 'Фоновая музыка (Аудио-микширование):',
      musicTrackName: 'EMIN & JONY — «Камин» (Fireplace)',
      musicToggleOn: 'Музыка включена (Баланс громкости «Камин» и речи)',
      musicToggleOff: 'Музыка выключена (Только чистая речь и окружение)',
      musicPreviewBtn: 'Слушать трек',
      musicPreviewStop: 'Остановить',
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
    },
  }[locale];

  // User input states
  const [prompt, setPrompt] = useState(
    DRAMA_PROMPT_SUGGESTIONS[locale][0].prompt,
  );
  const [includeBackgroundMusic, setIncludeBackgroundMusic] = useState<boolean>(true);
  const [isPlayingAudioPreview, setIsPlayingAudioPreview] = useState(false);
  const [subtitleMode, setSubtitleMode] = useState<'dom' | 'canvas'>('dom');

  // Job progress & playback states
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
    includeBackgroundMusic: boolean;
    bgMusicTrack: string;
    modelTier: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // References
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const rafRef = useRef<number | null>(null);

  // Audio Preview toggle handler
  const handleToggleAudioPreview = () => {
    if (!audioPreviewRef.current) {
      audioPreviewRef.current = new Audio('/audio/kamin-emin-jony.mp3');
      audioPreviewRef.current.volume = 0.5;
      audioPreviewRef.current.onended = () => setIsPlayingAudioPreview(false);
    }

    if (isPlayingAudioPreview) {
      audioPreviewRef.current.pause();
      setIsPlayingAudioPreview(false);
    } else {
      audioPreviewRef.current.play().then(() => {
        setIsPlayingAudioPreview(true);
      }).catch((err) => {
        console.warn('Audio preview error:', err);
      });
    }
  };

  // Video time synchronization loop for high-precision karaoke highlighting
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (audioPreviewRef.current) {
        audioPreviewRef.current.pause();
        audioPreviewRef.current = null;
      }
    };
  }, []);

  const handleStartGeneration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    // Pause audio preview if active
    if (audioPreviewRef.current && isPlayingAudioPreview) {
      audioPreviewRef.current.pause();
      setIsPlayingAudioPreview(false);
    }

    setIsLoading(true);
    setError(null);
    setProgress(10);
    setStatusMessage('Google Veo 3.1 va dramatik ssenariy tizimi ishga tushirilmoqda...');
    setResultVideo(null);
    setCurrentTime(0);

    try {
      const res = await api.generateVideoFromPrompt({
        prompt: prompt.trim(),
        aspectRatio: '9:16', // Enforce 9:16 vertical
        includeBackgroundMusic, // User ON/OFF choice
      });

      setJobId(res.jobId);
      setProgress(res.progress || 15);
      setStatusMessage(res.message || 'Google Veo 3.1 sahnalari tayyorlanmoqda...');

      startPolling(res.jobId);
    } catch (err: any) {
      setError(err?.message || 'Video yaratishda xatolik yuz berdi');
      setIsLoading(false);
    }
  };

  const startPolling = (targetJobId: string) => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

    pollIntervalRef.current = setInterval(async () => {
      try {
        const jobData: DramaVideoJob = await api.getPromptVideoStatus(targetJobId);
        setProgress(jobData.progress || 25);
        setStatusMessage(
          jobData.currentStepMessage || 'Google Veo 3.1 dramatik video qayta ishlanmoqda...',
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
            includeBackgroundMusic: jobData.includeBackgroundMusic ?? true,
            bgMusicTrack: jobData.bgMusicTrack || 'EMIN & JONY — «Камин»',
            modelTier: jobData.modelTier || 'veo-3.1-lite-generate',
          });
          onVideoCreated?.(jobData.videoUrl);
        } else if (jobData.status === 'failed') {
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          setIsLoading(false);
          setError(
            jobData.error ||
              'Video generatsiyasida xatolik yuz berdi. Qayta urinib koʻring.',
          );
        }
      } catch (pollErr) {
        console.warn('Polling check error, retrying...');
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
      {/* Top Banner Header */}
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
        {/* Left Column: Form & Dramatic Settings */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-7 border border-border shadow-sm space-y-6">
          <form onSubmit={handleStartGeneration} className="space-y-6">
            {/* Prompt Textarea */}
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
                className="w-full px-4 py-3 text-sm rounded-2xl border border-border bg-canvas/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral transition-all resize-none leading-relaxed"
              />
            </div>

            {/* Drama Prompt Suggestions */}
            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-ink-muted block">
                {t.suggestionsLabel}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {DRAMA_PROMPT_SUGGESTIONS[locale].map((sug, i) => (
                  <button
                    key={i}
                    type="button"
                    disabled={isLoading}
                    onClick={() => setPrompt(sug.prompt)}
                    className="p-2.5 text-left rounded-xl text-xs bg-canvas/60 hover:bg-neutral-200/80 border border-border text-ink transition-colors tactile-btn line-clamp-2 leading-snug"
                  >
                    {sug.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Veo 3.1 Aspect Ratio Lock: 9:16 Vertical */}
            <div className="space-y-2 p-3.5 rounded-2xl bg-amber-500/5 border border-amber-500/20">
              <div className="flex items-center justify-between">
                <label className="text-xs font-heading font-bold text-ink flex items-center gap-1.5">
                  <Smartphone className="h-4 w-4 text-amber-600" />
                  <span>{t.aspectRatioLabel}</span>
                </label>
                <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-800 text-[10px] font-mono font-bold uppercase">
                  Google Veo 3.1 • 9:16 (1080x1920)
                </span>
              </div>
              <p className="text-[11px] text-ink-muted">
                {t.ratioLockedNote}
              </p>
              <div className="flex items-center gap-2 pt-1">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-amber-300 text-ink text-xs font-bold shadow-2xs">
                  📱 9:16 Vertikal format
                </span>
                <span className="text-xs text-ink-muted">
                  • {t.durationBadge}
                </span>
              </div>
            </div>

            {/* Background Music Toggle & Audio Preview */}
            <div className="space-y-3 p-4 rounded-2xl bg-canvas border border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Music className="h-4 w-4 text-coral" />
                  <div>
                    <span className="text-xs font-heading font-bold text-ink block">
                      {t.musicLabel}
                    </span>
                    <span className="text-[11px] text-ink font-semibold">
                      {t.musicTrackName}
                    </span>
                  </div>
                </div>

                {/* USER ON / OFF SWITCH */}
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => setIncludeBackgroundMusic(!includeBackgroundMusic)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    includeBackgroundMusic ? 'bg-coral' : 'bg-neutral-300'
                  }`}
                  role="switch"
                  aria-checked={includeBackgroundMusic}
                >
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      includeBackgroundMusic ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between pt-1 text-[11px]">
                <span
                  className={
                    includeBackgroundMusic
                      ? 'text-emerald-700 font-semibold flex items-center gap-1'
                      : 'text-neutral-500 font-medium flex items-center gap-1'
                  }
                >
                  {includeBackgroundMusic ? (
                    <>
                      <Volume2 className="h-3.5 w-3.5" />
                      <span>{t.musicToggleOn}</span>
                    </>
                  ) : (
                    <>
                      <VolumeX className="h-3.5 w-3.5" />
                      <span>{t.musicToggleOff}</span>
                    </>
                  )}
                </span>

                {/* Live Preview Button */}
                <button
                  type="button"
                  onClick={handleToggleAudioPreview}
                  className="px-2.5 py-1 rounded-lg border border-border bg-white hover:bg-neutral-100 text-ink text-[11px] font-semibold transition-colors flex items-center gap-1.5 shadow-2xs"
                >
                  {isPlayingAudioPreview ? (
                    <>
                      <Pause className="h-3 w-3 text-coral" />
                      <span>{t.musicPreviewStop}</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-3 w-3 text-coral" />
                      <span>{t.musicPreviewBtn}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !prompt.trim()}
              className="w-full py-4 px-6 rounded-2xl bg-coral hover:bg-coral-dark disabled:opacity-50 text-white font-heading font-extrabold text-sm shadow-md transition-all tactile-btn flex items-center justify-center gap-2"
            >
              <Sparkles className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? t.generatingBtn : t.generateBtn}</span>
            </button>
          </form>
        </div>

        {/* Right Column: Processing State or HTML5 Video Preview */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-border shadow-sm flex flex-col justify-center min-h-[500px]">
          {/* STATE 1: Empty Initial Placeholder */}
          {!isLoading && !resultVideo && (
            <div className="text-center py-14 px-4 space-y-4">
              <div className="h-16 w-16 mx-auto rounded-2xl bg-canvas border border-border flex items-center justify-center text-ink-muted shadow-xs">
                <Video className="h-8 w-8 text-coral" />
              </div>
              <div className="space-y-1">
                <h4 className="font-heading font-bold text-ink text-base">
                  9:16 Dramatik Master Video koʻrinishi
                </h4>
                <p className="text-xs text-ink-muted max-w-xs mx-auto leading-relaxed">
                  Dramatik prompt kiriting va Google Veo 3.1 ssenariysini yaratishni boshlang.
                </p>
              </div>
            </div>
          )}

          {/* STATE 2: Processing Loader State */}
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

              {/* Progress Bar */}
              <div className="space-y-2 max-w-xs mx-auto">
                <div className="w-full h-2.5 rounded-full bg-canvas border border-border overflow-hidden">
                  <div
                    className="h-full bg-coral transition-all duration-300 rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] font-mono text-ink-muted">
                  <span>Jarayon:</span>
                  <span className="font-bold text-coral">{progress}%</span>
                </div>
              </div>

              {/* 3 Drama Acts Pipeline Indicator */}
              <div className="p-3.5 rounded-2xl bg-canvas border border-border text-[11px] text-ink-muted text-left space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-ink flex items-center gap-1.5">
                    <Zap className="h-3 w-3 text-coral" />
                    <span>Veo 3.1 & FFmpeg Pipeline:</span>
                  </span>
                  <span className="font-mono text-[10px] bg-neutral-200 px-1.5 py-0.5 rounded">
                    9:16 Vertikal
                  </span>
                </div>
                <div className="space-y-1 text-[11px] text-ink-muted">
                  <p>• 1-Akt: Shubhali Koʻz Qarash & Xiyonat Alomati (4–8s)</p>
                  <p>• 2-Akt: Koʻz Yoshlar & Keskin Kulminatsiya (4–8s)</p>
                  <p>• 3-Akt: Gʻolibona Qahramonlik Kadri (4–8s)</p>
                  <p>
                    • FFmpeg Concat Demuxer + {includeBackgroundMusic ? 'EMIN & JONY «Камин» audio' : 'Tabiiy nutq'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STATE 3: Completed HTML5 Video Preview Card With Karaoke Subtitles */}
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

              {/* Subtitle Rendering Mode Selector */}
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

              {/* Vertical 9:16 Video Player Card with Dynamic Karaoke Subtitles */}
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

                {/* Subtitle Overlay Layer (White by default, active word Vivid Yellow #FFD700) */}
                <div className="absolute inset-0 pointer-events-none flex flex-col justify-end">
                  <KaraokeSubtitles
                    currentTime={currentTime}
                    subtitles={resultVideo.karaokeTimeline}
                    scenes={resultVideo.scenes}
                    renderMode={subtitleMode}
                  />
                </div>
              </div>

              {/* Audio Track Tag & Duration */}
              <div className="flex items-center justify-between text-[11px] text-ink-muted px-1">
                <span className="flex items-center gap-1 text-ink font-medium">
                  <Music className="h-3.5 w-3.5 text-coral" />
                  <span>
                    {resultVideo.includeBackgroundMusic
                      ? resultVideo.bgMusicTrack
                      : 'Ovoz: Tabiiy nutq (Musiqasiz)'}
                  </span>
                </span>
                <span className="font-mono text-[10px] bg-canvas border border-border px-1.5 py-0.5 rounded">
                  {currentTime.toFixed(1)}s / {resultVideo.totalDurationSeconds}s
                </span>
              </div>

              {/* Action Buttons: Open, Download MP4 & Restart */}
              <div className="space-y-2 pt-1">
                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={resultVideo.videoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="py-2.5 px-3 rounded-xl bg-ink hover:bg-neutral-800 text-white font-heading font-bold text-xs shadow-sm transition-all tactile-btn flex items-center justify-center gap-1.5"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>{locale === 'uz' ? 'Videoni ochish' : 'Открыть видео'}</span>
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

              {/* Drama Acts Storyboard Cards */}
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
                            {scene.durationSeconds}s • Ziddiyat: {scene.tensionLevel}/10
                          </span>
                        </div>
                        <p className="text-[11px] text-ink-muted">
                          <strong className="text-ink">Emotsiya:</strong> {scene.emotion}
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
