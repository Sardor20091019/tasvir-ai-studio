'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Video,
  Download,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Monitor,
  Square,
  Clock,
  Layers,
  Send,
  Zap,
} from 'lucide-react';
import { api } from '../lib/api';

interface PromptVideoGeneratorProps {
  locale?: 'uz' | 'ru';
  onVideoCreated?: (videoUrl: string) => void;
}

const PROMPT_SUGGESTIONS = {
  uz: [
    { label: '🎧 Naushniklar', prompt: "Uzum Marketda yangi AirPods Max uchun yoshlarbop, 30% chegirmali 9:16 Reels reklamasi." },
    { label: '👟 Krossovka', prompt: "Nike Air Zoom Pegasus 40 krossovkalari haqida tezkor va baquvvat xarid videosi." },
    { label: '👗 Xonatlas', prompt: "Samarqand ipak xonatlas milliy liboslari haqida estetik va nafis video sharh." },
    { label: '⌚ Smart Soat', prompt: "Smart Watch Ultra 8 erkaklar sovg'asi uchun 1+1 aksiyasi haqida video rolik." },
  ],
  ru: [
    { label: '🎧 Наушники', prompt: "Молодежная реклама AirPods Max для Uzum Market со скидкой 30% в формате 9:16 Reels." },
    { label: '👟 Кроссовки', prompt: "Динамичный видеоролик о кроссовках Nike Air Zoom Pegasus 40 с быстрой доставкой." },
    { label: '👗 Хан-атлас', prompt: "Эстетичный обзор традиционных платьев из шелкового хан-атласа ручной работы." },
    { label: '⌚ Смарт-часы', prompt: "Акция 1+1 на умные часы Smart Watch Ultra в подарок мужчине к празднику." },
  ],
};

export function PromptVideoGenerator({
  locale = 'uz',
  onVideoCreated,
}: PromptVideoGeneratorProps) {
  const t = {
    uz: {
      badge: 'GEMINI OMNI 1.1 FLASH & REMOTION',
      title: 'Prompt orqali AI Video Generatsiyasi',
      subtitle: 'Istalgan mahsulot yoki reklama gʻoyasini yozing — sunʼiy intellekt uni toʻliq video rolikka aylantirib beradi.',
      promptLabel: 'Video tavsifi (Prompt)',
      promptPlaceholder: 'Masalan: Uzum Market uchun yangi AirPods Max naushniklari boʻyicha yoshlarbop, trenddagi 15 soniyali Reels video reklama yarating...',
      suggestionsLabel: '⚡ Tezkor gʻoyalar:',
      aspectRatioLabel: 'Video formati (Aspect Ratio):',
      ratio916: '9:16 Vertikal (Reels, TikTok, Uzum)',
      ratio169: '16:9 Gorizontal (YouTube, Web)',
      ratio11: '1:1 Kvadrat (Instagram, Telegram)',
      durationLabel: 'Davomiyligi:',
      sec10: '10 soniya',
      sec15: '15 soniya',
      sec30: '30 soniya',
      generateBtn: '✨ AI Video Yaratish',
      generatingBtn: 'Video tayyorlanmoqda...',
      progressTitle: 'AI Video Generatsiyasi Davom Etmoqda',
      completedTitle: 'Video Muvaffaqiyatli Tayyorlandi!',
      downloadBtn: 'MP4 Yuklab Olish',
      createAnother: 'Yangi video yaratish',
      scriptTitle: 'AI tomonidan yaratilgan ssenariy:',
      storyboardTitle: 'Kadrlar ketma-ketligi (Storyboard):',
    },
    ru: {
      badge: 'GEMINI OMNI 1.1 FLASH & REMOTION',
      title: 'Генерация AI Видео по Промпту',
      subtitle: 'Опишите товар или рекламную идею — искусственный интеллект создаст готовый видеоролик.',
      promptLabel: 'Описание видео (Промпт)',
      promptPlaceholder: 'Например: Создайте динамичный 15-секундный Reels для Uzum Market про наушники AirPods Max со скидкой 30%...',
      suggestionsLabel: '⚡ Быстрые идеи:',
      aspectRatioLabel: 'Формат видео (Aspect Ratio):',
      ratio916: '9:16 Вертикальный (Reels, TikTok, Uzum)',
      ratio169: '16:9 Горизонтальный (YouTube, Web)',
      ratio11: '1:1 Квадратный (Instagram, Telegram)',
      durationLabel: 'Длительность:',
      sec10: '10 секунд',
      sec15: '15 секунд',
      sec30: '30 секунд',
      generateBtn: '✨ Создать AI Видео',
      generatingBtn: 'Идет генерация видео...',
      progressTitle: 'Идет генерация видео с помощью AI',
      completedTitle: 'Видео успешно создано!',
      downloadBtn: 'Скачать MP4',
      createAnother: 'Создать еще видео',
      scriptTitle: 'Сценарий, созданный AI:',
      storyboardTitle: 'Раскадровка (Storyboard):',
    },
  }[locale];

  const [prompt, setPrompt] = useState(
    locale === 'uz'
      ? "Uzum Marketda yangi AirPods Max uchun yoshlarbop, 30% chegirmali 9:16 Reels reklamasi."
      : "Молодежная реклама AirPods Max для Uzum Market со скидкой 30% в формате 9:16 Reels."
  );
  const [aspectRatio, setAspectRatio] = useState<'9:16' | '16:9' | '1:1'>('9:16');
  const [duration, setDuration] = useState<number>(15);

  // Job execution state
  const [isLoading, setIsLoading] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [resultVideo, setResultVideo] = useState<{
    videoUrl: string;
    downloadUrl: string;
    script?: { hook: string; body: string; cta: string };
    storyboard?: Array<{ frameNumber: number; timestampSec: number; sceneDescription: string; caption: string; visualLayerUrl: string }>;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  const handleStartGeneration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsLoading(true);
    setError(null);
    setProgress(5);
    setStatusMessage('AI video vazifasi ishga tushirilmoqda...');
    setResultVideo(null);

    try {
      const res = await api.generateVideoFromPrompt({
        prompt: prompt.trim(),
        aspectRatio,
        durationSeconds: duration,
      });

      setJobId(res.jobId);
      setProgress(res.progress || 15);
      setStatusMessage(res.message || 'gemini-omni-1.1-flash ishga tushdi...');

      // Start background polling
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
        const statusData = await api.getPromptVideoStatus(targetJobId);
        setProgress(statusData.progress || 20);
        setStatusMessage(statusData.currentStepMessage || 'Video qayta ishlanmoqda...');

        if (statusData.status === 'completed' && statusData.videoUrl) {
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          setIsLoading(false);
          setResultVideo({
            videoUrl: statusData.videoUrl,
            downloadUrl: statusData.downloadUrl || statusData.videoUrl,
            script: statusData.script,
            storyboard: statusData.storyboard,
          });
          onVideoCreated?.(statusData.videoUrl);
        } else if (statusData.status === 'failed') {
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          setIsLoading(false);
          setError('Video generatsiyasida xatolik yuz berdi. Qayta urinib koʻring.');
        }
      } catch (pollErr) {
        console.warn('Polling error, retrying...');
      }
    }, 1500);
  };

  const handleReset = () => {
    setResultVideo(null);
    setJobId(null);
    setProgress(0);
    setIsLoading(false);
    setError(null);
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8">
      {/* Header Banner */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-coral/10 border border-coral/20 text-coral text-xs font-mono font-bold tracking-wide uppercase">
          <Sparkles className="h-3.5 w-3.5" />
          <span>{t.badge}</span>
        </div>
        <h2 className="font-heading font-black text-2xl sm:text-3xl text-ink tracking-tight">
          {t.title}
        </h2>
        <p className="text-sm text-ink-muted max-w-2xl mx-auto">
          {t.subtitle}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Prompt Input & Options */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 sm:p-7 border border-border shadow-sm space-y-6">
          <form onSubmit={handleStartGeneration} className="space-y-6">
            {/* Prompt Textarea */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-heading font-bold text-ink">
                  {t.promptLabel}
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
                className="w-full px-4 py-3 text-sm rounded-xl border border-border bg-canvas/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral transition-all resize-none leading-relaxed"
              />
            </div>

            {/* Quick Prompt Suggestion Chips */}
            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-ink-muted block">
                {t.suggestionsLabel}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {PROMPT_SUGGESTIONS[locale].map((sug, i) => (
                  <button
                    key={i}
                    type="button"
                    disabled={isLoading}
                    onClick={() => setPrompt(sug.prompt)}
                    className="px-2.5 py-1 rounded-lg text-xs bg-canvas hover:bg-neutral-200 border border-border text-ink transition-colors tactile-btn"
                  >
                    {sug.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Aspect Ratio Selector */}
            <div className="space-y-2.5">
              <label className="text-xs font-heading font-bold text-ink block">
                {t.aspectRatioLabel}
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { id: '9:16', label: '9:16', sub: 'Vertikal (Reels/Uzum)', icon: Smartphone },
                  { id: '16:9', label: '16:9', sub: 'Gorizontal (YouTube)', icon: Monitor },
                  { id: '1:1', label: '1:1', sub: 'Kvadrat (Post/TG)', icon: Square },
                ].map((ratio) => {
                  const Icon = ratio.icon;
                  const isSelected = aspectRatio === ratio.id;
                  return (
                    <button
                      key={ratio.id}
                      type="button"
                      disabled={isLoading}
                      onClick={() => setAspectRatio(ratio.id as any)}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all text-center gap-1.5 tactile-btn ${
                        isSelected
                          ? 'border-coral bg-coral/5 text-coral ring-2 ring-coral/20 font-bold'
                          : 'border-border bg-canvas/40 hover:bg-canvas text-ink'
                      }`}
                    >
                      <Icon className={`h-5 w-5 ${isSelected ? 'text-coral' : 'text-ink-muted'}`} />
                      <span className="text-xs font-heading">{ratio.label}</span>
                      <span className="text-[10px] text-ink-muted leading-tight hidden sm:block">
                        {ratio.sub}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Duration Selector */}
            <div className="space-y-2">
              <label className="text-xs font-heading font-bold text-ink flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-coral" />
                <span>{t.durationLabel}</span>
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { sec: 10, label: t.sec10 },
                  { sec: 15, label: t.sec15 },
                  { sec: 30, label: t.sec30 },
                ].map((item) => (
                  <button
                    key={item.sec}
                    type="button"
                    disabled={isLoading}
                    onClick={() => setDuration(item.sec)}
                    className={`py-2 rounded-lg border text-xs font-medium transition-colors tactile-btn ${
                      duration === item.sec
                        ? 'border-coral bg-coral text-white font-bold'
                        : 'border-border bg-canvas/40 text-ink hover:bg-canvas'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
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
              className="w-full py-3.5 px-6 rounded-xl bg-coral hover:bg-coral-dark disabled:opacity-50 text-white font-heading font-extrabold text-sm shadow-md transition-all tactile-btn flex items-center justify-center gap-2"
            >
              <Sparkles className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? t.generatingBtn : t.generateBtn}</span>
            </button>
          </form>
        </div>

        {/* Right Column: Processing State or HTML5 Video Preview */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-border shadow-sm flex flex-col justify-center min-h-[460px]">
          {/* STATE 1: Empty Initial Placeholder */}
          {!isLoading && !resultVideo && (
            <div className="text-center py-12 px-4 space-y-4">
              <div className="h-16 w-16 mx-auto rounded-2xl bg-canvas border border-border flex items-center justify-center text-ink-muted shadow-xs">
                <Video className="h-8 w-8 text-coral" />
              </div>
              <div>
                <h4 className="font-heading font-bold text-ink text-base">
                  Video koʻrinishi shu yerda chiqadi
                </h4>
                <p className="text-xs text-ink-muted mt-1 max-w-xs mx-auto">
                  Chap tomondan prompt va formatni tanlang hamda &quot;AI Video Yaratish&quot; tugmasini bosing.
                </p>
              </div>
            </div>
          )}

          {/* STATE 2: Processing Loader State */}
          {isLoading && (
            <div className="py-8 px-4 text-center space-y-6 animate-in fade-in duration-200">
              <div className="relative mx-auto h-20 w-20 flex items-center justify-center">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-coral opacity-20"></span>
                <div className="h-16 w-16 rounded-2xl bg-coral text-white flex items-center justify-center shadow-lg">
                  <Sparkles className="h-8 w-8 animate-spin" />
                </div>
              </div>

              <div className="space-y-1.5">
                <h4 className="font-heading font-bold text-ink text-base">
                  {t.progressTitle}
                </h4>
                <p className="text-xs text-ink-muted font-medium font-mono">
                  {statusMessage}
                </p>
              </div>

              {/* Progress Bar & Percentage */}
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

              <div className="p-3 rounded-xl bg-canvas border border-border text-[11px] text-ink-muted text-left space-y-1">
                <div className="flex items-center gap-1.5">
                  <Zap className="h-3 w-3 text-coral" />
                  <span className="font-semibold text-ink">Pipeline:</span>
                </div>
                <p>• gemini-omni-1.1-flash ssenariy tuzilishi</p>
                <p>• Remotion canvas kadrlar sintezi ({aspectRatio})</p>
                <p>• MP4 video montaj va audio sinxronizatsiya</p>
              </div>
            </div>
          )}

          {/* STATE 3: Completed HTML5 Video Preview Card */}
          {resultVideo && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>{t.completedTitle}</span>
                </div>
                <span className="text-[10px] font-mono uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-bold">
                  {aspectRatio} • {duration}s
                </span>
              </div>

              {/* HTML5 Video Element */}
              <div
                className={`relative mx-auto rounded-2xl overflow-hidden bg-black shadow-lg border border-border flex items-center justify-center ${
                  aspectRatio === '9:16'
                    ? 'w-[230px] aspect-[9/16]'
                    : aspectRatio === '16:9'
                    ? 'w-full aspect-video'
                    : 'w-[280px] aspect-square'
                }`}
              >
                <video
                  ref={videoRef}
                  src={resultVideo.videoUrl}
                  controls
                  autoPlay
                  loop
                  playsInline
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Action Buttons: Download MP4 & Restart */}
              <div className="space-y-2 pt-2">
                <a
                  href={resultVideo.downloadUrl}
                  download="tasvir-ai-generated-video.mp4"
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-heading font-bold text-xs shadow-md transition-all tactile-btn flex items-center justify-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  <span>{t.downloadBtn}</span>
                </a>

                <button
                  type="button"
                  onClick={handleReset}
                  className="w-full py-2.5 px-4 rounded-xl border border-border bg-canvas hover:bg-neutral-200 text-ink font-heading font-semibold text-xs transition-colors tactile-btn flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="h-3.5 w-3.5 text-ink-muted" />
                  <span>{t.createAnother}</span>
                </button>
              </div>

              {/* Generated Script Summary */}
              {resultVideo.script && (
                <div className="p-3.5 rounded-xl bg-canvas border border-border text-xs space-y-1.5">
                  <span className="font-heading font-bold text-ink block text-[11px]">
                    {t.scriptTitle}
                  </span>
                  <p className="text-ink-muted leading-relaxed">
                    <strong className="text-ink">Hook:</strong> {resultVideo.script.hook}
                  </p>
                  <p className="text-ink-muted leading-relaxed">
                    <strong className="text-ink">Matn:</strong> {resultVideo.script.body}
                  </p>
                  <p className="text-ink-muted leading-relaxed">
                    <strong className="text-coral font-bold">CTA:</strong> {resultVideo.script.cta}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

