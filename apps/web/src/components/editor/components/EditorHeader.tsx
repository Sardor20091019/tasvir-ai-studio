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
  } = useEditor();

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(title);

  const handleTitleSubmit = () => {
    if (tempTitle.trim()) setTitle(tempTitle.trim());
    setIsEditingTitle(false);
  };

  return (
    <header className="h-14 bg-obsidian-card border-b border-stroke px-4 flex items-center justify-between gap-4 select-none flex-shrink-0 z-20">
      {/* Left: Back & Title */}
      <div className="flex items-center gap-3 min-w-0">
        {onBack && (
          <button
            onClick={onBack}
            className="p-1.5 rounded-lg border border-stroke bg-canvas hover:bg-surface-raised text-ink-muted hover:text-ink transition-colors flex items-center gap-1 text-xs font-mono"
            title="Studiyaga qaytish"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Qaytish</span>
          </button>
        )}

        <div className="flex items-center gap-2 min-w-0">
          <div className="w-2 h-2 rounded-full bg-accent-warm animate-pulse hidden sm:block" />
          {isEditingTitle ? (
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={tempTitle}
                onChange={(e) => setTempTitle(e.target.value)}
                onBlur={handleTitleSubmit}
                onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
                autoFocus
                className="bg-canvas border border-accent-warm text-ink text-xs sm:text-sm font-semibold rounded px-2 py-0.5 outline-none font-sans"
              />
              <button
                onClick={handleTitleSubmit}
                className="p-1 text-accent-warm hover:text-ink"
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
              className="flex items-center gap-1.5 group max-w-[200px] sm:max-w-[320px] text-left"
              title="Loyiha nomini oʻzgartirish"
            >
              <span className="text-xs sm:text-sm font-bold text-ink truncate font-heading group-hover:text-accent-warm transition-colors">
                {title}
              </span>
              <Edit2 className="w-3 h-3 text-ink-dim opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
            </button>
          )}
        </div>
      </div>

      {/* Center: Undo/Redo & Aspect Ratio */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Undo & Redo */}
        <div className="flex items-center bg-canvas border border-stroke rounded-lg p-0.5">
          <button
            onClick={undo}
            disabled={!canUndo}
            className={`p-1.5 rounded text-xs transition-colors flex items-center ${
              canUndo
                ? 'text-ink-muted hover:text-ink hover:bg-surface-raised cursor-pointer'
                : 'text-ink-dim/40 cursor-not-allowed'
            }`}
            title="Bekor qilish (Cmd/Ctrl + Z)"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <div className="w-px h-3.5 bg-stroke mx-0.5" />
          <button
            onClick={redo}
            disabled={!canRedo}
            className={`p-1.5 rounded text-xs transition-colors flex items-center ${
              canRedo
                ? 'text-ink-muted hover:text-ink hover:bg-surface-raised cursor-pointer'
                : 'text-ink-dim/40 cursor-not-allowed'
            }`}
            title="Qaytarish (Cmd/Ctrl + Shift + Z)"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Aspect Ratio Buttons */}
        <div className="flex items-center bg-canvas border border-stroke rounded-lg p-0.5 text-xs font-mono">
          <button
            onClick={() => setAspectRatio('9:16')}
            className={`px-2 py-1 rounded flex items-center gap-1 transition-all ${
              aspectRatio === '9:16'
                ? 'bg-accent-warm text-canvas font-bold shadow-2xs'
                : 'text-ink-muted hover:text-ink hover:bg-surface-raised'
            }`}
            title="9:16 Vertikal (TikTok / Reels / Shorts)"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden md:inline">9:16</span>
          </button>
          <button
            onClick={() => setAspectRatio('16:9')}
            className={`px-2 py-1 rounded flex items-center gap-1 transition-all ${
              aspectRatio === '16:9'
                ? 'bg-accent-warm text-canvas font-bold shadow-2xs'
                : 'text-ink-muted hover:text-ink hover:bg-surface-raised'
            }`}
            title="16:9 Gorizontal (YouTube / Web)"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span className="hidden md:inline">16:9</span>
          </button>
          <button
            onClick={() => setAspectRatio('1:1')}
            className={`px-2 py-1 rounded flex items-center gap-1 transition-all ${
              aspectRatio === '1:1'
                ? 'bg-accent-warm text-canvas font-bold shadow-2xs'
                : 'text-ink-muted hover:text-ink hover:bg-surface-raised'
            }`}
            title="1:1 Kvadrat (Instagram Post)"
          >
            <Square className="w-3.5 h-3.5" />
            <span className="hidden md:inline">1:1</span>
          </button>
        </div>

        {/* Safe-Zone Guide Toggle */}
        <button
          onClick={() => setShowSafeZone((prev) => !prev)}
          className={`p-1.5 rounded-lg border text-xs font-mono flex items-center gap-1.5 transition-colors ${
            showSafeZone
              ? 'bg-accent-warm/15 border-accent-warm text-accent-warm'
              : 'bg-canvas border-stroke text-ink-muted hover:text-ink'
          }`}
          title="Reels / TikTok xavfsiz zona chegarasi"
        >
          <Shield className="w-3.5 h-3.5" />
          <span className="hidden lg:inline text-[11px]">Xavfsiz Zona</span>
        </button>
      </div>

      {/* Right: Export Button */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenExport}
          className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-accent-warm to-amber-500 hover:brightness-110 text-canvas font-heading font-extrabold text-xs tracking-wide flex items-center gap-1.5 shadow-md shadow-accent-warm/20 transition-all active:scale-95"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Eksport</span>
        </button>
      </div>
    </header>
  );
}

