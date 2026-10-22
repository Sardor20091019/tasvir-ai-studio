'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';
import { VideoJob, LocaleType } from '../types';

interface VideoLibraryModalProps {
  jobs: VideoJob[];
  locale: LocaleType;
  onClose?: () => void;
  onOpenStudio?: () => void;
}

export function VideoLibraryModal({
  jobs,
  locale,
  onClose,
  onOpenStudio,
}: VideoLibraryModalProps) {
  const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null);

  const t = {
    uz: {
      title: 'Mening Videolarim (Render Tarixi)',
      sub: 'Tayyorlangan va navbatdagi 9:16 video reklamalar arxivi',
      emptyTitle: 'Hozircha videolar yoʻq',
      emptySub: 'Studiyada mahsulot tanlab, birinchi AI video reklamangizni yarating!',
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
      emptySub: 'Select a product in Studio and generate your first AI video ad!',
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
      emptySub: 'Выберите товар в студии и создайте свой первый AI ролик!',
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
    emptySub: 'Select a product in Studio to generate your first AI video!',
    createFirst: 'Create first video',
    download: 'Download MP4',
    preview: 'Preview',
    close: 'Close',
    statusCompleted: 'Ready',
    statusRendering: 'In Progress',
  };

  return (
    <div className="bg-white rounded-studio border border-border p-6 shadow-tactile space-y-6">
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
            const videoSrc = job.output_video_url || 'https://n6ogfqlb21.ufs.sh/f/e4WrEcObdaG3xQRkL5D1FbQuz7SaXsDfAioc3JZvk59ORCG4';

            return (
              <div
                key={job.id}
                className="rounded-xl border border-border bg-canvas overflow-hidden flex flex-col justify-between hover:shadow-tactile transition-all"
              >
                <div className="relative aspect-[9/12] w-full bg-black/90 overflow-hidden group">
                  {/* Video or Thumbnail preview */}
                  <video
                    src={videoSrc}
                    playsInline
                    loop
                    muted
                    autoPlay
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2.5 left-2.5">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isCompleted
                          ? 'bg-emerald-500 text-white'
                          : 'bg-amber-500 text-white animate-pulse'
                      }`}
                    >
                      {isCompleted ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                      <span>{isCompleted ? t.statusCompleted : t.statusRendering}</span>
                    </span>
                  </div>
                  <div className="absolute top-2.5 right-2.5 bg-black/60 backdrop-blur-xs text-white text-[10px] font-mono px-2 py-0.5 rounded">
                    9:16
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

                {isCompleted && (
                  <div className="p-3 pt-0">
                    <a
                      href={videoSrc}
                      target="_blank"
                      rel="noreferrer"
                      download={`tasvir-${job.id}.mp4`}
                      className="w-full py-2 px-3 rounded-xl bg-white border border-border hover:bg-canvas text-ink text-xs font-bold flex items-center justify-center gap-1.5 tactile-btn shadow-xs"
                    >
                      <Download className="h-3.5 w-3.5 text-coral" />
                      <span>{t.download}</span>
                    </a>
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

