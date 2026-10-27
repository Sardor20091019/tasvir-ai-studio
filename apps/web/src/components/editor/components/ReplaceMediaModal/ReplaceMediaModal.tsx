'use client';

import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  Film,
  Sparkles,
  Link as LinkIcon,
  Check,
  Clock,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { useEditor } from '../../context/EditorContext';
import { STOCK_VIDEOS } from '../../constants/stockAssets';
import { LocaleType } from '../../../../types';

export function ReplaceMediaModal(): React.ReactElement | null {
  const {
    replaceModalClipId,
    setReplaceModalClipId,
    replaceClipMedia,
    tracks,
    scenesList,
    locale,
  } = useEditor();

  const [activeTab, setActiveTab] = useState<'scenes' | 'stock' | 'upload' | 'url'>('scenes');
  const [customUrl, setCustomUrl] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!replaceModalClipId) return null;

  const targetClip = tracks
    .flatMap((t) => t.clips)
    .find((c) => c.id === replaceModalClipId);

  const t = ({
    uz: {
      title: 'Klipni Almashtirish',
      subtitle: 'Tanlangan sahnaning video yoki rasmini almashtiring',
      tabScenes: 'AI Sahna Kadrlari',
      tabStock: 'B-Roll Videolar',
      tabUpload: 'Fayl Yuklash',
      tabUrl: 'Havola (URL)',
      currentClip: 'Hozirgi klip',
      noScenes: 'Ushbu loyihada AI sahnalar topilmadi. B-Roll yoki fayl yuklashdan foydalaning.',
      uploadTitle: 'Kompyuteringizdan video yoki rasm yuklang',
      uploadSub: 'MP4, WebM, PNG, JPG formatlari qabul qilinadi',
      applyUrl: 'Havolani qoʻllash',
      enterUrl: 'Video yoki rasm havolasini kiriting...',
      close: 'Yopish',
      replace: 'Almashtirish',
    },
    en: {
      title: 'Replace Clip Media',
      subtitle: 'Change the video or image for the selected scene',
      tabScenes: 'AI Story Scenes',
      tabStock: 'Stock B-Roll',
      tabUpload: 'Upload File',
      tabUrl: 'Direct URL',
      currentClip: 'Current clip',
      noScenes: 'No AI scenes found for this project. Use Stock B-Roll or Upload.',
      uploadTitle: 'Upload video or image from your computer',
      uploadSub: 'Supports MP4, WebM, PNG, JPG formats',
      applyUrl: 'Apply URL',
      enterUrl: 'Paste video or image URL...',
      close: 'Close',
      replace: 'Replace',
    },
    ru: {
      title: 'Заменить медиафайлы клипа',
      subtitle: 'Измените видео или изображение выбранной сцены',
      tabScenes: 'Кадры AI Сюжета',
      tabStock: 'B-Roll Видео',
      tabUpload: 'Загрузить файл',
      tabUrl: 'Прямая ссылка',
      currentClip: 'Текущий клип',
      noScenes: 'В проекте нет AI кадров. Используйте B-Roll или загрузку файлов.',
      uploadTitle: 'Загрузите видео или фото с компьютера',
      uploadSub: 'Поддерживаются форматы MP4, WebM, PNG, JPG',
      applyUrl: 'Применить ссылку',
      enterUrl: 'Вставьте ссылку на видео или изображение...',
      close: 'Закрыть',
      replace: 'Заменить',
    },
  } as Record<LocaleType, any>)[(locale as LocaleType) || 'uz'];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    replaceClipMedia(replaceModalClipId, url, file.name);
  };

  const handleApplyUrl = (): void => {
    if (!customUrl.trim()) return;
    replaceClipMedia(replaceModalClipId, customUrl.trim(), 'Web Media');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-obsidian-card border border-stroke rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col overflow-hidden max-h-[85vh]">
        <div className="p-4 border-b border-stroke flex items-center justify-between bg-canvas/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-accent-warm/15 text-accent-warm flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold font-heading text-ink">
                {t.title}
              </h3>
              <p className="text-[11px] text-ink-muted">
                {t.subtitle}
                {targetClip && (
                  <span className="ml-1 text-accent-warm font-mono font-medium">
                    ({targetClip.title} • {targetClip.durationSec.toFixed(1)}s)
                  </span>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={() => setReplaceModalClipId(null)}
            className="p-1.5 rounded-lg hover:bg-surface-raised text-ink-muted hover:text-ink transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex border-b border-stroke bg-canvas/30 px-3 pt-2 gap-1 overflow-x-auto text-xs font-mono font-semibold">
          <button
            onClick={() => setActiveTab('scenes')}
            className={`py-2 px-3 border-b-2 transition-colors flex items-center gap-1.5 shrink-0 ${
              activeTab === 'scenes'
                ? 'border-accent-warm text-accent-warm font-bold'
                : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t.tabScenes}</span>
            {scenesList.length > 0 && (
              <span className="text-[10px] bg-accent-warm/20 text-accent-warm px-1.5 py-0.2 rounded-full">
                {scenesList.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('stock')}
            className={`py-2 px-3 border-b-2 transition-colors flex items-center gap-1.5 shrink-0 ${
              activeTab === 'stock'
                ? 'border-accent-warm text-accent-warm font-bold'
                : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>{t.tabStock}</span>
          </button>

          <button
            onClick={() => setActiveTab('upload')}
            className={`py-2 px-3 border-b-2 transition-colors flex items-center gap-1.5 shrink-0 ${
              activeTab === 'upload'
                ? 'border-accent-warm text-accent-warm font-bold'
                : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{t.tabUpload}</span>
          </button>

          <button
            onClick={() => setActiveTab('url')}
            className={`py-2 px-3 border-b-2 transition-colors flex items-center gap-1.5 shrink-0 ${
              activeTab === 'url'
                ? 'border-accent-warm text-accent-warm font-bold'
                : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span>{t.tabUrl}</span>
          </button>
        </div>

        <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">
          {activeTab === 'scenes' && (
            <div>
              {scenesList.length === 0 ? (
                <div className="p-8 text-center text-ink-muted text-xs bg-canvas/40 rounded-xl border border-stroke">
                  <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-30 text-accent-warm" />
                  <p>{t.noScenes}</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {scenesList.map((scene, idx) => {
                    const imgUrl = scene.imageUrl || scene.clipVideoUrl || '';
                    const isCurrent = targetClip?.thumbnailUrl === imgUrl || targetClip?.sourceUrl === imgUrl;
                    return (
                      <div
                        key={idx}
                        onClick={() => {
                          if (imgUrl) {
                            replaceClipMedia(
                              replaceModalClipId,
                              imgUrl,
                              scene.actTitle || `Sahna ${idx + 1}`,
                              imgUrl
                            );
                          }
                        }}
                        className={`group relative rounded-xl border overflow-hidden cursor-pointer bg-canvas transition-all flex flex-col justify-between ${
                          isCurrent
                            ? 'border-accent-warm ring-2 ring-accent-warm/40'
                            : 'border-stroke hover:border-accent-warm'
                        }`}
                      >
                        <div className="relative aspect-[9/16] bg-black overflow-hidden">
                          {imgUrl ? (
                            <img
                              src={imgUrl}
                              alt={scene.actTitle}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-ink-dim">
                              <Sparkles className="w-6 h-6 opacity-30" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                          <div className="absolute top-2 left-2 z-10">
                            <span className="px-1.5 py-0.5 rounded bg-black/60 text-white text-[9px] font-mono font-bold">
                              #{idx + 1}
                            </span>
                          </div>
                          {isCurrent && (
                            <div className="absolute top-2 right-2 z-10 w-5 h-5 rounded-full bg-accent-warm text-canvas flex items-center justify-center">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </div>
                          )}
                        </div>
                        <div className="p-2">
                          <p className="text-xs font-semibold text-ink truncate">
                            {scene.actTitle || `Sahna ${idx + 1}`}
                          </p>
                          <p className="text-[10px] text-ink-muted truncate">
                            {scene.dialogueScript || scene.caption || `${scene.durationSeconds || 5}s`}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'stock' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {STOCK_VIDEOS.map((stock) => {
                const isCurrent = targetClip?.sourceUrl === stock.url;
                return (
                  <div
                    key={stock.id}
                    onClick={() =>
                      replaceClipMedia(
                        replaceModalClipId,
                        stock.url,
                        stock.title,
                        stock.thumbnailUrl
                      )
                    }
                    className={`group relative rounded-xl border overflow-hidden cursor-pointer bg-canvas transition-all ${
                      isCurrent
                        ? 'border-accent-warm ring-2 ring-accent-warm/40'
                        : 'border-stroke hover:border-accent-warm'
                    }`}
                  >
                    <div className="relative aspect-video bg-surface overflow-hidden">
                      <img
                        src={stock.thumbnailUrl}
                        alt={stock.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80" />
                      <span className="absolute bottom-1.5 right-1.5 text-[9px] font-mono font-bold bg-canvas/80 px-1 rounded text-ink">
                        {stock.durationSec}s
                      </span>
                      <span className="absolute top-1.5 left-1.5 text-[9px] font-mono font-bold bg-accent-warm text-canvas px-1 rounded">
                        {stock.category}
                      </span>
                      {isCurrent && (
                        <div className="absolute top-1.5 right-1.5 z-10 w-5 h-5 rounded-full bg-accent-warm text-canvas flex items-center justify-center">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <div className="p-2.5 flex items-center justify-between">
                      <p className="text-xs font-semibold text-ink truncate">
                        {stock.title}
                      </p>
                      <span className="text-[10px] font-mono font-bold text-accent-warm shrink-0 flex items-center gap-0.5">
                        {t.replace} <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'upload' && (
            <div className="py-6">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="video/mp4,video/webm,image/png,image/jpeg,image/webp"
                className="hidden"
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-stroke hover:border-accent-warm bg-canvas hover:bg-surface-raised/40 rounded-2xl p-8 text-center cursor-pointer transition-all group"
              >
                <div className="w-12 h-12 rounded-full bg-accent-warm/10 group-hover:bg-accent-warm/20 flex items-center justify-center mx-auto mb-3 text-accent-warm transition-colors">
                  <Upload className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-ink mb-1">
                  {t.uploadTitle}
                </h4>
                <p className="text-xs text-ink-muted">
                  {t.uploadSub}
                </p>
              </div>
            </div>
          )}

          {activeTab === 'url' && (
            <div className="py-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-ink block mb-1">
                  {t.tabUrl}
                </label>
                <input
                  type="url"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder={t.enterUrl}
                  className="w-full bg-surface border border-stroke rounded-xl px-3 py-2 text-ink text-xs focus:border-accent-warm outline-none"
                />
              </div>
              <button
                type="button"
                onClick={handleApplyUrl}
                disabled={!customUrl.trim()}
                className="w-full py-2.5 px-4 rounded-xl bg-accent-warm hover:bg-accent-warm-hover disabled:opacity-40 text-canvas font-bold text-xs font-mono transition-colors cursor-pointer"
              >
                {t.applyUrl}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
