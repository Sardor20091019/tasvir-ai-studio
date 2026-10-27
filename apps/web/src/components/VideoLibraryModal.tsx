'use client';

import React, { useState, useEffect } from 'react';
import {
  Film,
  Download,
  Play,
  Pause,
  ExternalLink,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  Scissors,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { VideoJob, LocaleType } from '../types';
import { api } from '../lib/api';
import { downloadMediaFile } from '../lib/download';

interface VideoLibraryModalProps {
  jobs: VideoJob[];
  locale: LocaleType;
  onClose?: () => void;
  onOpenStudio?: () => void;
  onEditJob?: (job: VideoJob) => void;
  onUpdateJob?: (job: VideoJob) => void;
}

export function VideoLibraryModal({
  jobs,
  locale,
  onClose,
  onOpenStudio,
  onEditJob,
  onUpdateJob,
}: VideoLibraryModalProps) {
  const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null);

  useEffect(() => {
    api.listUserJobs().then((dbJobs) => {
      if (Array.isArray(dbJobs) && dbJobs.length > 0) {
        dbJobs.forEach((job) => onUpdateJob?.(job));
      }
    }).catch(() => {});
  }, [onUpdateJob]);

  // Auto-poll any rendering or queued jobs
  useEffect(() => {
    const activeJobs = jobs.filter((j) => j.status !== 'completed' && j.status !== 'failed');
    if (activeJobs.length === 0) return;

    const interval = setInterval(async () => {
      for (const activeJob of activeJobs) {
        try {
          const statusData = await api.getPromptVideoStatus(activeJob.id);
          if (statusData) {
            const isDone = statusData.status === 'completed';
            const isFailed = statusData.status === 'failed';

            const updated: VideoJob = {
              ...activeJob,
              status: statusData.status || activeJob.status,
              progress_percent: statusData.progress ?? (isDone ? 100 : activeJob.progress_percent),
              step_message: statusData.currentStepMessage || activeJob.step_message,
              output_video_url: statusData.videoUrl || statusData.downloadUrl || activeJob.output_video_url,
              scenes: statusData.scenes || activeJob.scenes,
              completed_at: isDone ? new Date().toISOString() : activeJob.completed_at,
              error_message: isFailed ? (statusData.error || 'Video yaratishda xatolik yuz berdi') : null,
            };

            onUpdateJob?.(updated);
          }
        } catch (pollErr) {
          // ignore transient network errors
        }
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [jobs, onUpdateJob]);

  const t = {
    uz: {
      title: 'Mening Videolarim (Render Tarixi)',
      sub: 'Tayyorlangan va navbatdagi 9:16 video reklamalar arxivi',
      emptyTitle: 'Hozircha videolar yoʻq',
      emptySub: 'AI Studio orqali birinchi kinematografik AI videongizni yarating!',
      createFirst: 'Birinchi videoni yaratish',
      download: 'MP4 Yuklash',
      preview: 'Koʻrish',
      close: 'Yopish',
      statusCompleted: 'Tayyor',
      statusRendering: 'Tayyorlanmoqda',
    },
    en: {
      title: 'My Videos (Render History)',
      sub: 'Archive of generated and in-progress 9:16 video advertisements',
      emptyTitle: 'No videos created yet',
      emptySub: 'Create your first cinematic AI video in AI Studio!',
      createFirst: 'Create your first video',
      download: 'Download MP4',
      preview: 'Preview',
      close: 'Close',
      statusCompleted: 'Ready',
      statusRendering: 'Rendering',
    },
    ru: {
      title: 'Мои видео (История рендеров)',
      sub: 'Архив готовых и обрабатываемых 9:16 видео-роликов',
      emptyTitle: 'Видео пока нет',
      emptySub: 'Создайте свой первый кинематографический AI ролик в AI Studio!',
      createFirst: 'Создать первое видео',
      download: 'Скачать MP4',
      preview: 'Смотреть',
      close: 'Закрыть',
      statusCompleted: 'Готово',
      statusRendering: 'В процессе',
    },
  }[locale] || {
    title: 'My Videos',
    sub: 'Archive of generated 9:16 video advertisements',
    emptyTitle: 'No videos yet',
    emptySub: 'Generate your first AI video with AI Studio!',
    createFirst: 'Create first video',
    download: 'Download MP4',
    preview: 'Preview',
    close: 'Close',
    statusCompleted: 'Ready',
    statusRendering: 'In Progress',
  };

  return (
    <div className="bg-surface rounded-studio border border-border p-6 shadow-tactile space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-border/70">
        <div>
          <h2 className="text-xl font-heading font-extrabold text-ink">
            {t.title}
          </h2>
          <p className="text-xs text-ink-muted">{t.sub}</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full border border-border bg-canvas hover:bg-white flex items-center justify-center text-ink-muted hover:text-ink"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {jobs.length === 0 ? (
        <div className="text-center py-12 bg-canvas rounded-2xl border border-dashed border-border p-6">
          <div className="mx-auto h-12 w-12 rounded-full bg-bento-peach text-coral flex items-center justify-center mb-3">
            <Film className="h-6 w-6" />
          </div>
          <h3 className="font-bold text-sm text-ink mb-1">{t.emptyTitle}</h3>
          <p className="text-xs text-ink-muted max-w-sm mx-auto mb-4">
            {t.emptySub}
          </p>
          {onOpenStudio && (
            <button
              onClick={onOpenStudio}
              className="px-4 py-2 rounded-xl bg-coral hover:bg-coral-hover text-white text-xs font-bold shadow-tactile tactile-btn"
            >
              {t.createFirst}
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {jobs.map((job) => {
            const isCompleted = job.status === 'completed';
            const isFailed = job.status === 'failed';
            const isRendering = !isCompleted && !isFailed;
            const videoSrc = job.output_video_url || '';

            return (
              <div
                key={job.id}
                className="rounded-xl border border-border bg-canvas overflow-hidden flex flex-col justify-between hover:shadow-tactile transition-all"
              >
                <div className="relative aspect-[9/12] w-full bg-black/90 overflow-hidden group">
                  {isCompleted && videoSrc ? (
                    <video
                      src={videoSrc}
                      poster={job.scenes?.[0]?.imageUrl}
                      playsInline
                      loop
                      muted
                      autoPlay
                      className="w-full h-full object-cover"
                    />
                  ) : isFailed ? (
                    <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-red-950/20 text-center">
                      <AlertCircle className="h-8 w-8 text-red-500 mb-2" />
                      <p className="text-xs text-red-400 font-medium line-clamp-3">
                        {job.error_message || (locale === 'en' ? 'Rendering failed' : 'Render jarayonida xatolik')}
                      </p>
                    </div>
                  ) : (
                    /* In-Progress Cinematic Rendering Animation */
                    <div className="w-full h-full flex flex-col items-center justify-between p-4 bg-gradient-to-b from-surface via-obsidian to-surface relative overflow-hidden">
                      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/30 via-transparent to-transparent animate-pulse" />
                      
                      <div className="w-full flex justify-end relative z-10">
                        <span className="px-2 py-0.5 rounded bg-black/60 backdrop-blur-xs text-white text-[10px] font-mono font-bold">
                          9:16 • 360p
                        </span>
                      </div>

                      {/* Center Animated Indicator */}
                      <div className="flex flex-col items-center justify-center space-y-2.5 relative z-10 my-auto">
                        <div className="relative flex items-center justify-center">
                          <div className="w-14 h-14 rounded-full border-2 border-amber-500/20 border-t-amber-500 animate-spin" />
                          <Film className="h-5 w-5 text-amber-500 absolute" />
                        </div>
                        <div className="text-center">
                          <div className="text-xl font-mono font-black text-amber-500 tracking-tight">
                            {job.progress_percent || 15}%
                          </div>
                          <p className="text-[10px] font-mono text-ink-muted line-clamp-2 max-w-[180px] mt-1 leading-snug">
                            {job.step_message || t.statusRendering}
                          </p>
                        </div>
                      </div>

                      {/* Progress bar across bottom of media */}
                      <div className="w-full relative z-10">
                        <div className="w-full h-1.5 rounded-full bg-surface-raised overflow-hidden border border-border/40">
                          <div
                            className="h-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-500 ease-out"
                            style={{ width: `${Math.max(10, Math.min(job.progress_percent || 15, 100))}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Top Status Tag */}
                  <div className="absolute top-2.5 left-2.5 z-20">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        isCompleted
                          ? 'bg-emerald-500 text-white'
                          : isFailed
                          ? 'bg-red-500 text-white'
                          : 'bg-amber-500 text-obsidian shadow-xs animate-pulse'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : isFailed ? (
                        <AlertCircle className="h-3 w-3" />
                      ) : (
                        <Clock className="h-3 w-3" />
                      )}
                      <span>
                        {isCompleted
                          ? t.statusCompleted
                          : isFailed
                          ? (locale === 'en' ? 'Failed' : 'Xatolik')
                          : `${t.statusRendering} (${job.progress_percent || 15}%)`}
                      </span>
                    </span>
                  </div>
                </div>

                <div className="p-3.5 space-y-2">
                  <p className="text-xs text-ink font-medium line-clamp-2 italic">
                    &ldquo;{job.script_text}&rdquo;
                  </p>
                  <div className="flex items-center justify-between text-[11px] font-mono text-ink-muted pt-2 border-t border-border/60">
                    <span>{job.platform_preset}</span>
                    <span>1 kredit</span>
                  </div>
                </div>

                {isRendering && (
                  <div className="p-3 pt-0">
                    <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-mono font-bold text-amber-700 dark:text-amber-300">
                        <span>{locale === 'en' ? 'Processing scenes...' : 'Sahnalar render qilinmoqda...'}</span>
                        <span>{job.progress_percent || 15}%</span>
                      </div>
                      <p className="text-[10px] font-mono text-ink-muted truncate">
                        {job.step_message || 'AI Video Engine'}
                      </p>
                    </div>
                  </div>
                )}

                {isCompleted && job.scenes && job.scenes.some((s) => s.imageUrl) && (
                  <div className="px-3 pb-2 space-y-1">
                    <span className="text-[10px] font-mono text-ink-muted">
                      {locale === 'en' ? 'AI Scene Images:' : 'AI Sahna Kadrlari:'}
                    </span>
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                      {job.scenes.map((sc, scIdx) => {
                        if (!sc.imageUrl) return null;
                        return (
                          <div
                            key={scIdx}
                            title={`${sc.actTitle} - ${locale === 'en' ? 'Download JPG' : 'Tasvirni yuklab olish'}`}
                            onClick={() => downloadMediaFile(sc.imageUrl!, `scene-${sc.sceneIndex}.jpg`)}
                            className="relative h-12 w-8 shrink-0 rounded-md overflow-hidden border border-border/80 group/img cursor-pointer"
                          >
                            <img
                              src={sc.imageUrl}
                              alt={sc.actTitle}
                              className="h-full w-full object-cover group-hover/img:scale-110 transition-transform"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity">
                              <Download className="h-3 w-3 text-white" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {isCompleted && (
                  <div className="p-3 pt-0 space-y-1.5">
                    {onEditJob && (
                      <button
                        type="button"
                        onClick={() => onEditJob(job)}
                        className="w-full py-2 px-3 rounded-xl bg-accent-warm hover:bg-accent-warm-hover text-obsidian text-xs font-bold flex items-center justify-center gap-1.5 tactile-btn shadow-xs"
                      >
                        <Scissors className="h-3.5 w-3.5" />
                        <span>{locale === 'uz' ? 'CapCut da tahrirlash' : locale === 'en' ? 'Edit in CapCut' : 'Редактировать в CapCut'}</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => downloadMediaFile(videoSrc, `tasvir-${job.id}.mp4`)}
                      className="w-full py-2 px-3 rounded-xl bg-surface border border-border hover:bg-surface-raised text-ink text-xs font-bold flex items-center justify-center gap-1.5 tactile-btn shadow-xs cursor-pointer"
                    >
                      <Download className="h-3.5 w-3.5 text-accent-warm" />
                      <span>{t.download}</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

