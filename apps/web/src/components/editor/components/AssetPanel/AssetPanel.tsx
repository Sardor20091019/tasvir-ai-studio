'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  FolderOpen,
  Film,
  Music,
  Type,
  Sparkles,
  Upload,
  Plus,
  Play,
  Pause,
  Trash2,
  Tag,
  Volume2,
  Check,
  Search,
  X,
} from 'lucide-react';
import { useEditor } from '../../context/EditorContext';
import {
  STOCK_VIDEOS,
  STOCK_AUDIO,
  STOCK_STICKERS,
  FILTER_PRESETS,
  TEXT_PRESETS,
  TRANSITION_PRESETS,
} from '../../constants/stockAssets';
import { AssetItem, FilterPreset, TextPresetItem } from '../../types';
import { LocaleType } from '../../../../types';

export type AssetTabType = 'media' | 'stock' | 'audio' | 'text' | 'effects';

export interface AssetPanelProps {
  className?: string;
  isMobileDrawer?: boolean;
  forcedTab?: AssetTabType;
  onCloseMobile?: () => void;
}

interface UploadedLocalMedia {
  id: string;
  name: string;
  type: 'video' | 'audio' | 'image';
  url: string;
  durationSec: number;
  sizeMb: string;
}

export function AssetPanel({
  className = '',
  isMobileDrawer = false,
  forcedTab,
  onCloseMobile,
}: AssetPanelProps = {}) {
  const { addClip, activeFilter, setActiveFilter, currentTime, locale } = useEditor();

  const t = ({
    uz: {
      tabMedia: 'Fayllar',
      tabStock: 'Videolar',
      tabAudio: 'Audio',
      tabText: 'Matn',
      tabEffects: 'Filtrlar',
      uploadTitle: 'Fayl yuklash (MP4, MP3, PNG)',
      uploadSub: 'Kompyuteringizdan tortib tashlang yoki bosing',
      uploadedFiles: 'Yuklangan fayllar',
      noFiles: 'Hali hech qanday fayl yuklanmadi. Yuqoridagi tugma orqali MP4 yoki MP3 qoʻshing.',
      stockTitle: 'Tayyor HD B-Roll Videolari',
      audioTitle: 'Ovoz Effektlari & Musiqa',
      textTitle: 'CapCut & Reels Matn Shablonlari',
      filterTitle: 'Kinematik Rang Filtrlari (LUTs)',
      stickersTitle: 'E-Commerce Stikerlar & Nishonlar',
      add: 'Qoʻshish',
    },
    en: {
      tabMedia: 'Files',
      tabStock: 'Videos',
      tabAudio: 'Audio',
      tabText: 'Text',
      tabEffects: 'Filters',
      uploadTitle: 'Upload file (MP4, MP3, PNG)',
      uploadSub: 'Drag and drop from your computer or click',
      uploadedFiles: 'Uploaded files',
      noFiles: 'No files uploaded yet. Click above to upload MP4 or MP3.',
      stockTitle: 'Stock HD B-Roll Videos',
      audioTitle: 'Sound Effects & Music',
      textTitle: 'CapCut & Reels Caption Presets',
      filterTitle: 'Cinematic Color Filters (LUTs)',
      stickersTitle: 'E-Commerce Stickers & Badges',
      add: 'Add',
    },
    ru: {
      tabMedia: 'Файлы',
      tabStock: 'Видео',
      tabAudio: 'Аудио',
      tabText: 'Текст',
      tabEffects: 'Фильтры',
      uploadTitle: 'Загрузить файл (MP4, MP3, PNG)',
      uploadSub: 'Перетащите с компьютера или нажмите',
      uploadedFiles: 'Загруженные файлы',
      noFiles: 'Файлы еще не загружены. Нажмите выше для загрузки MP4 или MP3.',
      stockTitle: 'Готовые HD B-Roll Видео',
      audioTitle: 'Звуковые эффекты и музыка',
      textTitle: 'Стили субтитров CapCut и Reels',
      filterTitle: 'Кинематографичные фильтры (LUTs)',
      stickersTitle: 'E-Commerce Стикеры и значки',
      add: 'Добавить',
    },
  } as Record<LocaleType, any>)[(locale as LocaleType) || 'uz'];

  const [activeTab, setActiveTab] = useState<AssetTabType>(forcedTab || 'media');
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadedMedia, setUploadedMedia] = useState<UploadedLocalMedia[]>([]);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (forcedTab) {
      setActiveTab(forcedTab);
    }
  }, [forcedTab]);

  // File upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const url = URL.createObjectURL(file);
      const isVideo = file.type.startsWith('video');
      const isAudio = file.type.startsWith('audio');
      const isImage = file.type.startsWith('image');

      let mediaType: 'video' | 'audio' | 'image' = 'video';
      if (isAudio) mediaType = 'audio';
      if (isImage) mediaType = 'image';

      // Estimate duration if possible
      let durationSec = 5;
      if (isVideo) {
        const tempVid = document.createElement('video');
        tempVid.src = url;
        tempVid.onloadedmetadata = () => {
          durationSec = Math.round(tempVid.duration) || 5;
          setUploadedMedia((prev) =>
            prev.map((m) => (m.url === url ? { ...m, durationSec } : m))
          );
        };
      }

      const newMedia: UploadedLocalMedia = {
        id: `upload-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: file.name,
        type: mediaType,
        url,
        durationSec,
        sizeMb: (file.size / (1024 * 1024)).toFixed(1),
      };

      setUploadedMedia((prev) => [newMedia, ...prev]);
    });

    e.target.value = '';
  };

  // Audio preview toggle
  const toggleAudioPreview = (id: string, url: string) => {
    if (playingAudioId === id) {
      if (audioPreviewRef.current) {
        audioPreviewRef.current.pause();
      }
      setPlayingAudioId(null);
    } else {
      if (!audioPreviewRef.current) {
        audioPreviewRef.current = new Audio();
      }
      audioPreviewRef.current.src = url;
      audioPreviewRef.current.play().catch(() => {});
      audioPreviewRef.current.onended = () => setPlayingAudioId(null);
      setPlayingAudioId(id);
    }
  };

  const containerClass = isMobileDrawer
    ? `w-full h-full bg-obsidian-card flex flex-col select-none overflow-hidden ${className}`
    : `hidden lg:flex w-72 sm:w-80 h-full bg-obsidian border-r border-stroke flex-col flex-shrink-0 select-none overflow-hidden ${className}`;

  return (
    <aside className={containerClass}>
      {/* Mobile Drawer Top Bar */}
      {isMobileDrawer && (
        <div className="flex items-center justify-between p-3 border-b border-stroke bg-canvas/80 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold font-heading uppercase text-accent-warm">
              {activeTab === 'media' && t.tabMedia}
              {activeTab === 'stock' && t.tabStock}
              {activeTab === 'audio' && t.tabAudio}
              {activeTab === 'text' && t.tabText}
              {activeTab === 'effects' && t.tabEffects}
            </span>
          </div>
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="p-1 rounded-full hover:bg-surface-raised text-ink-muted hover:text-ink transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Tab Navigation Rail */}
      <div className="flex border-b border-stroke bg-canvas/60 p-1 gap-1 overflow-x-auto scrollbar-none shrink-0">
        <button
          onClick={() => setActiveTab('media')}
          className={`flex-1 py-2 px-1.5 rounded-md text-[11px] font-mono font-medium flex flex-col items-center gap-1 transition-colors ${
            activeTab === 'media'
              ? 'bg-surface-raised text-accent-warm shadow-2xs font-semibold'
              : 'text-ink-muted hover:text-ink hover:bg-surface/50'
          }`}
          title={t.tabMedia}
        >
          <FolderOpen className="w-4 h-4" />
          <span>{t.tabMedia}</span>
        </button>

        <button
          onClick={() => setActiveTab('stock')}
          className={`flex-1 py-2 px-1.5 rounded-md text-[11px] font-mono font-medium flex flex-col items-center gap-1 transition-colors ${
            activeTab === 'stock'
              ? 'bg-surface-raised text-accent-warm shadow-2xs font-semibold'
              : 'text-ink-muted hover:text-ink hover:bg-surface/50'
          }`}
          title={t.tabStock}
        >
          <Film className="w-4 h-4" />
          <span>{t.tabStock}</span>
        </button>

        <button
          onClick={() => setActiveTab('audio')}
          className={`flex-1 py-2 px-1.5 rounded-md text-[11px] font-mono font-medium flex flex-col items-center gap-1 transition-colors ${
            activeTab === 'audio'
              ? 'bg-surface-raised text-accent-warm shadow-2xs font-semibold'
              : 'text-ink-muted hover:text-ink hover:bg-surface/50'
          }`}
          title={t.tabAudio}
        >
          <Music className="w-4 h-4" />
          <span>{t.tabAudio}</span>
        </button>

        <button
          onClick={() => setActiveTab('text')}
          className={`flex-1 py-2 px-1.5 rounded-md text-[11px] font-mono font-medium flex flex-col items-center gap-1 transition-colors ${
            activeTab === 'text'
              ? 'bg-surface-raised text-accent-warm shadow-2xs font-semibold'
              : 'text-ink-muted hover:text-ink hover:bg-surface/50'
          }`}
          title={t.tabText}
        >
          <Type className="w-4 h-4" />
          <span>{t.tabText}</span>
        </button>

        <button
          onClick={() => setActiveTab('effects')}
          className={`flex-1 py-2 px-1.5 rounded-md text-[11px] font-mono font-medium flex flex-col items-center gap-1 transition-colors ${
            activeTab === 'effects'
              ? 'bg-surface-raised text-accent-warm shadow-2xs font-semibold'
              : 'text-ink-muted hover:text-ink hover:bg-surface/50'
          }`}
          title={t.tabEffects}
        >
          <Sparkles className="w-4 h-4" />
          <span>{t.tabEffects}</span>
        </button>
      </div>

      {/* Tab Content Body */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
        {/* ── TAB 1: LOCAL MEDIA UPLOAD ── */}
        {activeTab === 'media' && (
          <div className="space-y-3">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              multiple
              accept="video/mp4,video/webm,audio/mp3,audio/wav,image/png,image/jpeg,image/webp"
              className="hidden"
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-stroke hover:border-accent-warm/70 bg-canvas hover:bg-surface-raised/40 rounded-xl p-4 text-center cursor-pointer transition-all group"
            >
              <div className="w-10 h-10 rounded-full bg-accent-warm/10 group-hover:bg-accent-warm/20 flex items-center justify-center mx-auto mb-2 text-accent-warm transition-colors">
                <Upload className="w-5 h-5" />
              </div>
              <p className="text-xs font-semibold text-ink">
                {t.uploadTitle}
              </p>
              <p className="text-[10px] text-ink-muted mt-0.5">
                {t.uploadSub}
              </p>
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] font-mono font-bold uppercase text-ink-dim tracking-wider">
                {t.uploadedFiles} ({uploadedMedia.length})
              </span>

              {uploadedMedia.length === 0 ? (
                <div className="p-4 text-center text-ink-muted text-xs bg-canvas/40 rounded-lg border border-stroke/50">
                  {t.noFiles}
                </div>
              ) : (
                uploadedMedia.map((media) => (
                  <div
                    key={media.id}
                    className="p-2 rounded-lg bg-canvas border border-stroke hover:border-stroke-hover flex items-center justify-between gap-2 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded bg-surface flex items-center justify-center flex-shrink-0 text-accent-warm">
                        {media.type === 'video' && <Film className="w-4 h-4" />}
                        {media.type === 'audio' && <Music className="w-4 h-4" />}
                        {media.type === 'image' && <Sparkles className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-ink truncate">
                          {media.name}
                        </p>
                        <p className="text-[10px] text-ink-muted font-mono">
                          {media.durationSec}s • {media.sizeMb}MB
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() =>
                        addClip(
                          media.type === 'video'
                            ? 'track-video'
                            : media.type === 'audio'
                            ? 'track-audio-bgm'
                            : 'track-effect',
                          {
                            title: media.name,
                            sourceUrl: media.url,
                            durationSec: media.durationSec || 5,
                            startSec: currentTime,
                          }
                        )
                      }
                      className="p-1.5 rounded-md bg-accent-warm/15 hover:bg-accent-warm text-accent-warm hover:text-canvas transition-colors flex items-center gap-1 text-[11px] font-mono"
                      title="Trekka qoʻshish"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ── TAB 2: STOCK B-ROLL VIDEOS ── */}
        {activeTab === 'stock' && (
          <div className="space-y-2">
            <span className="text-[10px] font-mono font-bold uppercase text-ink-dim tracking-wider">
              {t.stockTitle}
            </span>

            <div className="grid grid-cols-1 gap-2">
              {STOCK_VIDEOS.map((stock) => (
                <div
                  key={stock.id}
                  className="group relative rounded-xl border border-stroke bg-canvas overflow-hidden hover:border-accent-warm transition-all"
                >
                  <div className="relative aspect-video bg-surface overflow-hidden">
                    <img
                      src={stock.thumbnailUrl}
                      alt={stock.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-transparent to-transparent opacity-80" />
                    <span className="absolute bottom-1.5 right-1.5 text-[9px] font-mono font-bold bg-canvas/80 px-1 rounded text-ink">
                      {stock.durationSec}s
                    </span>
                    <span className="absolute top-1.5 left-1.5 text-[9px] font-mono font-bold bg-accent-warm text-canvas px-1 rounded">
                      {stock.category}
                    </span>
                  </div>

                  <div className="p-2 flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-ink truncate">
                      {stock.title}
                    </p>
                    <button
                      onClick={() =>
                        addClip('track-video', {
                          title: stock.title,
                          sourceUrl: stock.url,
                          thumbnailUrl: stock.thumbnailUrl,
                          durationSec: stock.durationSec || 5,
                          startSec: currentTime,
                        })
                      }
                      className="px-2 py-1 rounded bg-accent-warm text-canvas hover:brightness-110 text-[11px] font-bold font-mono flex items-center gap-1 flex-shrink-0 transition-transform active:scale-95"
                    >
                      <Plus className="w-3 h-3" />
                      <span>{t.add}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB 3: AUDIO & SFX ── */}
        {activeTab === 'audio' && (
          <div className="space-y-3">
            <span className="text-[10px] font-mono font-bold uppercase text-ink-dim tracking-wider">
              {t.audioTitle}
            </span>

            <div className="space-y-1.5">
              {STOCK_AUDIO.map((audio) => {
                const isPlayingThis = playingAudioId === audio.id;
                return (
                  <div
                    key={audio.id}
                    className="p-2 rounded-xl bg-canvas border border-stroke hover:border-stroke-hover flex items-center justify-between gap-2 transition-colors"
                  >
                    <button
                      onClick={() => toggleAudioPreview(audio.id, audio.url)}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                        isPlayingThis
                          ? 'bg-accent-warm text-canvas'
                          : 'bg-surface hover:bg-surface-raised text-ink'
                      }`}
                    >
                      {isPlayingThis ? (
                        <Pause className="w-3.5 h-3.5" />
                      ) : (
                        <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                      )}
                    </button>

                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-ink truncate">
                        {audio.title}
                      </p>
                      <p className="text-[10px] font-mono text-ink-muted">
                        {audio.category} • {audio.durationSec}s
                      </p>
                    </div>

                    <button
                      onClick={() =>
                        addClip('track-audio-bgm', {
                          title: audio.title,
                          sourceUrl: audio.url,
                          durationSec: audio.durationSec || 5,
                          startSec: currentTime,
                          volume: 0.8,
                        })
                      }
                      className="p-1.5 rounded-lg bg-surface hover:bg-accent-warm text-ink hover:text-canvas transition-colors"
                      title="Audio trekka qoʻshish"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── TAB 4: TEXT & KINETIC TITLES ── */}
        {activeTab === 'text' && (
          <div className="space-y-2">
            <span className="text-[10px] font-mono font-bold uppercase text-ink-dim tracking-wider">
              {t.textTitle}
            </span>

            <div className="space-y-2">
              {TEXT_PRESETS.map((preset) => (
                <div
                  key={preset.id}
                  onClick={() =>
                    addClip('track-text', {
                      title: preset.label,
                      textContent: preset.previewText,
                      textStyle: preset.style,
                      animation: preset.style.animation,
                      durationSec: 3.5,
                      startSec: currentTime,
                    })
                  }
                  className="p-3 rounded-xl border border-stroke bg-canvas hover:border-accent-warm cursor-pointer transition-all hover:bg-surface-raised/40 group"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-ink-muted group-hover:text-ink">
                      {preset.label}
                    </span>
                    <span className="text-[10px] font-mono text-accent-warm flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Plus className="w-3 h-3" /> Qoʻshish
                    </span>
                  </div>

                  {/* Visual Preview Box */}
                  <div
                    className="p-2.5 rounded-lg text-center font-heading font-extrabold tracking-wide text-xs"
                    style={{
                      backgroundColor: preset.style.bgColor,
                      color: preset.style.textColor,
                    }}
                  >
                    <span style={{ color: preset.style.highlightColor }}>
                      {preset.previewText}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB 5: FILTERS & STICKERS ── */}
        {activeTab === 'effects' && (
          <div className="space-y-4">
            {/* Color Grading LUTs */}
            <div>
              <span className="text-[10px] font-mono font-bold uppercase text-ink-dim tracking-wider block mb-2">
                {t.filterTitle}
              </span>

              <div className="grid grid-cols-2 gap-2">
                {FILTER_PRESETS.map((filter) => {
                  const isActive = activeFilter.id === filter.id;
                  return (
                    <button
                      key={filter.id}
                      onClick={() => setActiveFilter(filter)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        isActive
                          ? 'border-accent-warm bg-accent-warm/10 ring-1 ring-accent-warm'
                          : 'border-stroke bg-canvas hover:border-stroke-hover'
                      }`}
                    >
                      <div
                        className="w-full h-8 rounded-lg mb-1.5 shadow-2xs"
                        style={{ background: filter.previewColor }}
                      />
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-ink">
                          {filter.label}
                        </span>
                        {isActive && <Check className="w-3.5 h-3.5 text-accent-warm" />}
                      </div>
                      <p className="text-[9px] text-ink-muted truncate mt-0.5">
                        {filter.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* E-commerce Badges & Stickers */}
            <div>
              <span className="text-[10px] font-mono font-bold uppercase text-ink-dim tracking-wider block mb-2">
                {t.stickersTitle}
              </span>

              <div className="grid grid-cols-2 gap-2">
                {STOCK_STICKERS.map((stk) => (
                  <div
                    key={stk.id}
                    onClick={() =>
                      addClip('track-effect', {
                        title: stk.title,
                        sourceUrl: stk.url,
                        durationSec: 4,
                        startSec: currentTime,
                        scale: 1.0,
                      })
                    }
                    className="p-2 rounded-xl bg-canvas border border-stroke hover:border-accent-warm cursor-pointer transition-all flex flex-col items-center text-center group"
                  >
                    <img
                      src={stk.url}
                      alt={stk.title}
                      className="w-10 h-10 object-contain my-1 group-hover:scale-110 transition-transform"
                    />
                    <span className="text-[11px] font-semibold text-ink truncate w-full">
                      {stk.title}
                    </span>
                    <span className="text-[9px] font-mono text-accent-warm mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                      <Plus className="w-2.5 h-2.5" /> Qoʻshish
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

