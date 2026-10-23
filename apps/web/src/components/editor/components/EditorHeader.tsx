'use client';

import React, { useState } from 'react';
import {
  Undo2,
  Redo2,
  Download,
  ChevronLeft,
  Smartphone,
  Monitor,
  Square,
  Shield,
  Sparkles,
  Sliders,
  Check,
  Edit2,
} from 'lucide-react';
import { useEditor } from '../context/EditorContext';
import { AspectRatioType } from '../types';
import { LocaleType } from '../../../types';

interface EditorHeaderProps {
  onBack?: () => void;
  onOpenExport: () => void;
}

export function EditorHeader({ onBack, onOpenExport }: EditorHeaderProps) {
  const {
    title,
    setTitle,
    aspectRatio,
    setAspectRatio,
    undo,
    redo,
    canUndo,
    canRedo,
    showSafeZone,
    setShowSafeZone,
    locale,
  } = useEditor();

  const t = ({
    uz: {
      back: 'Qaytish',
      backTitle: 'Studiyaga qaytish',
      export: 'Eksport',
      undo: 'Bekor qilish',
      redo: 'Qaytarish',
      safeZone: 'Xavfsiz hudud',
    },
    en: {
      back: 'Back',
      backTitle: 'Back to Studio',
      export: 'Export',
      undo: 'Undo',
      redo: 'Redo',
      safeZone: 'Safe Zone',
    },
    ru: {
      back: 'Назад',
      backTitle: 'Вернуться в Студию',
      export: 'Экспорт',
      undo: 'Отменить',
      redo: 'Повторить',
      safeZone: 'Безопасная зона',
    },
  } as Record<LocaleType, any>)[(locale as LocaleType) || 'uz'];

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(title);

  const handleTitleSubmit = () => {
    if (tempTitle.trim()) setTitle(tempTitle.trim());
    setIsEditingTitle(false);
  };

  return (
    <header className="h-12 sm:h-14 bg-obsidian-card border-b border-stroke px-2 sm:px-4 flex items-center justify-between gap-1.5 sm:gap-4 select-none flex-shrink-0 z-20">
      {/* Left: Back & Title */}
      <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
        {onBack && (
          <button
            onClick={onBack}
            className="p-1 sm:p-1.5 rounded-lg border border-stroke bg-canvas hover:bg-surface-raised text-ink-muted hover:text-ink transition-colors flex items-center gap-1 text-xs font-mono shrink-0 cursor-pointer"
            title={t.backTitle}
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden md:inline">{t.back}</span>
          </button>
        )}

        <div className="flex items-center gap-1.5 min-w-0">
          <div className="w-2 h-2 rounded-full bg-accent-warm animate-pulse hidden sm:block shrink-0" />
          {isEditingTitle ? (
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={tempTitle}
                onChange={(e) => setTempTitle(e.target.value)}
                onBlur={handleTitleSubmit}
                onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
                autoFocus
                className="bg-canvas border border-accent-warm text-ink text-xs font-semibold rounded px-1.5 py-0.5 outline-none font-sans max-w-[120px] sm:max-w-[200px]"
              />
              <button
                onClick={handleTitleSubmit}
                className="p-1 text-accent-warm hover:text-ink cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setTempTitle(title);
                setIsEditingTitle(true);
              }}
              className="flex items-center gap-1 group max-w-[100px] xs:max-w-[140px] sm:max-w-[260px] text-left cursor-pointer"
              title="Loyiha nomini oʻzgartirish"
            >
              <span className="text-xs sm:text-sm font-bold text-ink truncate font-heading group-hover:text-accent-warm transition-colors">
                {title}
              </span>
              <Edit2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-ink-dim opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            </button>
          )}
        </div>
      </div>

      {/* Center: Undo/Redo & Aspect Ratio */}
      <div className="flex items-center gap-1 sm:gap-3">
        {/* Undo & Redo */}
        <div className="flex items-center bg-canvas border border-stroke rounded-lg p-0.5">
          <button
            onClick={undo}
            disabled={!canUndo}
            className={`p-1 sm:p-1.5 rounded text-xs transition-colors flex items-center ${
              canUndo
                ? 'text-ink-muted hover:text-ink hover:bg-surface-raised cursor-pointer'
                : 'text-ink-dim/40 cursor-not-allowed'
            }`}
            title={t.undo}
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <div className="w-px h-3 bg-stroke mx-0.5" />
          <button
            onClick={redo}
            disabled={!canRedo}
            className={`p-1 sm:p-1.5 rounded text-xs transition-colors flex items-center ${
              canRedo
                ? 'text-ink-muted hover:text-ink hover:bg-surface-raised cursor-pointer'
                : 'text-ink-dim/40 cursor-not-allowed'
            }`}
            title={t.redo}
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Aspect Ratio Buttons */}
        <div className="flex items-center bg-canvas border border-stroke rounded-lg p-0.5 text-xs font-mono">
          <button
            onClick={() => setAspectRatio('9:16')}
            className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded flex items-center gap-1 transition-all ${
              aspectRatio === '9:16'
                ? 'bg-accent-warm text-canvas font-bold shadow-2xs'
                : 'text-ink-muted hover:text-ink hover:bg-surface-raised'
            }`}
            title="9:16 Vertikal (TikTok / Reels)"
          >
            <Smartphone className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span className="hidden sm:inline">9:16</span>
          </button>
          <button
            onClick={() => setAspectRatio('16:9')}
            className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded flex items-center gap-1 transition-all ${
              aspectRatio === '16:9'
                ? 'bg-accent-warm text-canvas font-bold shadow-2xs'
                : 'text-ink-muted hover:text-ink hover:bg-surface-raised'
            }`}
            title="16:9 Gorizontal"
          >
            <Monitor className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span className="hidden sm:inline">16:9</span>
          </button>
          <button
            onClick={() => setAspectRatio('1:1')}
            className={`hidden xs:flex px-1.5 sm:px-2 py-0.5 sm:py-1 rounded items-center gap-1 transition-all ${
              aspectRatio === '1:1'
                ? 'bg-accent-warm text-canvas font-bold shadow-2xs'
                : 'text-ink-muted hover:text-ink hover:bg-surface-raised'
            }`}
            title="1:1 Kvadrat"
          >
            <Square className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span className="hidden md:inline">1:1</span>
          </button>
        </div>

        {/* Safe-Zone Guide Toggle */}
        <button
          onClick={() => setShowSafeZone((prev) => !prev)}
          className={`p-1 sm:p-1.5 rounded-lg border text-xs font-mono flex items-center gap-1 transition-colors cursor-pointer ${
            showSafeZone
              ? 'bg-accent-warm/15 border-accent-warm text-accent-warm'
              : 'bg-canvas border-stroke text-ink-muted hover:text-ink'
          }`}
          title={t.safeZone}
        >
          <Shield className="w-3.5 h-3.5" />
          <span className="hidden xl:inline text-[11px]">{t.safeZone}</span>
        </button>
      </div>

      {/* Right: Export Button */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={onOpenExport}
          className="px-2.5 sm:px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-accent-warm to-amber-500 hover:brightness-110 text-canvas font-heading font-extrabold text-[11px] sm:text-xs tracking-wide flex items-center gap-1 sm:gap-1.5 shadow-md shadow-accent-warm/20 transition-all active:scale-95 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>{t.export}</span>
        </button>
      </div>
    </header>
  );
}

