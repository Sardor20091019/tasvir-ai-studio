'use client';

import React from 'react';
import {
  SlidersHorizontal,
  Volume2,
  Gauge,
  Sparkles,
  Type,
  Layers,
  Trash2,
  Copy,
  Scissors,
  Check,
  Move,
  Eye,
  ChevronDown,
} from 'lucide-react';
import { useEditor } from '../../context/EditorContext';
import { FILTER_PRESETS, TEXT_PRESETS, TRANSITION_PRESETS } from '../../constants/stockAssets';
import { TransitionType } from '../../types';

export function PropertyInspector() {
  const {
    selectedClip,
    updateClip,
    removeClip,
    splitClipAtPlayhead,
    addClip,
    duration,
    tracks,
    aspectRatio,
    activeFilter,
    currentTime,
  } = useEditor();

  if (!selectedClip) {
    return (
      <aside className="w-64 sm:w-72 h-full bg-obsidian border-l border-stroke p-4 flex flex-col select-none overflow-y-auto custom-scrollbar">
        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-stroke">
          <SlidersHorizontal className="w-4 h-4 text-accent-warm" />
          <span className="text-xs font-bold font-heading uppercase tracking-wider text-ink">
            Loyiha Xususiyatlari
          </span>
        </div>

        <div className="space-y-3 text-xs">
          <div className="p-3 rounded-xl bg-canvas border border-stroke space-y-2">
            <div className="flex justify-between">
              <span className="text-ink-muted">Umumiy vaqt:</span>
              <span className="font-mono font-bold text-ink">{duration}s</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-muted">Format:</span>
              <span className="font-mono font-bold text-accent-warm">{aspectRatio}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-muted">Treklar soni:</span>
              <span className="font-mono font-bold text-ink">{tracks.length} ta</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-muted">Aktiv filtr:</span>
              <span className="font-semibold text-ink">{activeFilter.label}</span>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-dashed border-stroke/80 text-center text-ink-muted text-xs">
            <Layers className="w-6 h-6 mx-auto mb-1.5 opacity-40 text-accent-warm" />
            <p className="font-medium text-ink">Klip tanlanmagan</p>
            <p className="text-[11px] text-ink-muted mt-1 leading-relaxed">
              Xususiyatlarini oʻzgartirish uchun xronologiyadan (timeline) istalgan klipni bosing.
            </p>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-64 sm:w-72 h-full bg-obsidian border-l border-stroke flex flex-col select-none overflow-hidden flex-shrink-0">
      {/* Inspector Header */}
      <div className="p-3 border-b border-stroke flex items-center justify-between gap-2 bg-canvas/40">
        <div className="flex items-center gap-2 min-w-0">
          <SlidersHorizontal className="w-4 h-4 text-accent-warm flex-shrink-0" />
          <span className="text-xs font-bold font-heading text-ink truncate">
            {selectedClip.title}
          </span>
        </div>

        {/* Quick Actions: Split & Delete */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => splitClipAtPlayhead(selectedClip.id)}
            className="p-1.5 rounded-md hover:bg-surface-raised text-ink-muted hover:text-accent-warm transition-colors"
            title="Klipni kesish (C)"
          >
            <Scissors className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => removeClip(selectedClip.id)}
            className="p-1.5 rounded-md hover:bg-red-500/10 text-ink-muted hover:text-red-400 transition-colors"
            title="Klipni oʻchirish (Del)"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Properties Form Body */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4 custom-scrollbar text-xs">
        {/* Timing Block (Start & Duration) */}
        <div className="p-3 rounded-xl bg-canvas border border-stroke space-y-2">
          <span className="text-[10px] font-mono font-bold text-ink-dim uppercase tracking-wider block">
            Vaqt Parametrlari
          </span>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-ink-muted block mb-1">Boshlanish</label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={Number(selectedClip.startSec.toFixed(1))}
                onChange={(e) =>
                  updateClip(selectedClip.id, {
                    startSec: Math.max(0, parseFloat(e.target.value) || 0),
                  })
                }
                className="w-full bg-surface border border-stroke rounded-lg px-2 py-1 text-ink font-mono text-xs focus:border-accent-warm outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] text-ink-muted block mb-1">Davomiyligi (s)</label>
              <input
                type="number"
                step="0.1"
                min="0.2"
                value={Number(selectedClip.durationSec.toFixed(1))}
                onChange={(e) =>
                  updateClip(selectedClip.id, {
                    durationSec: Math.max(0.2, parseFloat(e.target.value) || 0.2),
                  })
                }
                className="w-full bg-surface border border-stroke rounded-lg px-2 py-1 text-ink font-mono text-xs focus:border-accent-warm outline-none"
              />
            </div>
          </div>
        </div>

        {/* ── VIDEO PROPERTIES ── */}
        {selectedClip.type === 'video' && (
          <div className="space-y-3">
            {/* Speed Control */}
            <div className="p-3 rounded-xl bg-canvas border border-stroke space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-ink-dim uppercase tracking-wider flex items-center gap-1">
                  <Gauge className="w-3 h-3 text-accent-warm" /> Tezlik (Speed)
                </span>
                <span className="font-mono text-accent-warm font-bold text-xs">
                  {selectedClip.speed || 1.0}x
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1">
                {[0.5, 1.0, 1.5, 2.0].map((spd) => (
                  <button
                    key={spd}
                    onClick={() => updateClip(selectedClip.id, { speed: spd })}
                    className={`py-1 rounded font-mono text-[11px] font-bold border transition-colors ${
                      (selectedClip.speed || 1.0) === spd
                        ? 'bg-accent-warm text-canvas border-accent-warm'
                        : 'bg-surface border-stroke text-ink hover:bg-surface-raised'
                    }`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>
            </div>

            {/* Volume Control */}
            <div className="p-3 rounded-xl bg-canvas border border-stroke space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-ink-dim uppercase tracking-wider flex items-center gap-1">
                  <Volume2 className="w-3 h-3 text-accent-warm" /> Video Ovozi
                </span>
                <span className="font-mono text-ink font-bold text-xs">
                  {Math.round((selectedClip.volume ?? 1.0) * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="2"
                step="0.05"
                value={selectedClip.volume ?? 1.0}
                onChange={(e) =>
                  updateClip(selectedClip.id, {
                    volume: parseFloat(e.target.value),
                  })
                }
                className="w-full h-1 bg-surface-raised rounded-lg appearance-none cursor-pointer accent-accent-warm"
              />
            </div>

            {/* Transitions */}
            <div className="p-3 rounded-xl bg-canvas border border-stroke space-y-2">
              <span className="text-[10px] font-mono font-bold text-ink-dim uppercase tracking-wider block">
                Sahna Oʻtishi (Transition)
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {TRANSITION_PRESETS.map((tr) => {
                  const isCurrent =
                    (selectedClip.transition?.type || 'none') === tr.id;
                  return (
                    <button
                      key={tr.id}
                      onClick={() =>
                        updateClip(selectedClip.id, {
                          transition: {
                            type: tr.id,
                            durationSec: tr.defaultDurationSec,
                          },
                        })
                      }
                      className={`p-2 rounded-lg border text-left transition-all ${
                        isCurrent
                          ? 'bg-accent-warm/15 border-accent-warm text-accent-warm font-bold'
                          : 'bg-surface border-stroke text-ink hover:bg-surface-raised'
                      }`}
                    >
                      <p className="text-[11px] truncate">{tr.label}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── AUDIO PROPERTIES ── */}
        {selectedClip.type === 'audio' && (
          <div className="p-3 rounded-xl bg-canvas border border-stroke space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-ink-dim uppercase tracking-wider flex items-center gap-1">
                <Volume2 className="w-3 h-3 text-accent-warm" /> Audio Balandligi
              </span>
              <span className="font-mono text-accent-warm font-bold text-xs">
                {Math.round((selectedClip.volume ?? 1.0) * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="2"
              step="0.05"
              value={selectedClip.volume ?? 1.0}
              onChange={(e) =>
                updateClip(selectedClip.id, {
                  volume: parseFloat(e.target.value),
                })
              }
              className="w-full h-1 bg-surface-raised rounded-lg appearance-none cursor-pointer accent-accent-warm"
            />
          </div>
        )}

        {/* ── TEXT & SUBTITLE PROPERTIES ── */}
        {selectedClip.type === 'text' && (
          <div className="space-y-3">
            {/* Textarea */}
            <div className="p-3 rounded-xl bg-canvas border border-stroke space-y-2">
              <span className="text-[10px] font-mono font-bold text-ink-dim uppercase tracking-wider block">
                Matn Tahriri
              </span>
              <textarea
                rows={3}
                value={selectedClip.textContent || selectedClip.title}
                onChange={(e) =>
                  updateClip(selectedClip.id, {
                    textContent: e.target.value,
                    title: e.target.value.slice(0, 24),
                  })
                }
                className="w-full bg-surface border border-stroke rounded-lg p-2 text-ink text-xs focus:border-accent-warm outline-none resize-none font-sans"
              />
            </div>

            {/* Position */}
            <div className="p-3 rounded-xl bg-canvas border border-stroke space-y-2">
              <span className="text-[10px] font-mono font-bold text-ink-dim uppercase tracking-wider block">
                Joylashuvi
              </span>
              <div className="grid grid-cols-3 gap-1">
                {(['top', 'center', 'bottom'] as const).map((pos) => {
                  const currentPos = selectedClip.textStyle?.position || 'bottom';
                  const labels = { top: 'Yuqori', center: 'Oʻrtada', bottom: 'Pastki' };
                  return (
                    <button
                      key={pos}
                      onClick={() =>
                        updateClip(selectedClip.id, {
                          textStyle: {
                            ...selectedClip.textStyle!,
                            position: pos,
                          },
                        })
                      }
                      className={`py-1.5 rounded-lg border text-center text-[11px] font-mono transition-colors ${
                        currentPos === pos
                          ? 'bg-accent-warm text-canvas border-accent-warm font-bold'
                          : 'bg-surface border-stroke text-ink hover:bg-surface-raised'
                      }`}
                    >
                      {labels[pos]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Font Size */}
            <div className="p-3 rounded-xl bg-canvas border border-stroke space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-ink-dim uppercase tracking-wider">
                  Shrift Hajmi
                </span>
                <span className="font-mono text-accent-warm font-bold text-xs">
                  {selectedClip.textStyle?.fontSize || 28}px
                </span>
              </div>
              <input
                type="range"
                min="18"
                max="60"
                step="2"
                value={selectedClip.textStyle?.fontSize || 28}
                onChange={(e) =>
                  updateClip(selectedClip.id, {
                    textStyle: {
                      ...selectedClip.textStyle!,
                      fontSize: parseInt(e.target.value),
                    },
                  })
                }
                className="w-full h-1 bg-surface-raised rounded-lg appearance-none cursor-pointer accent-accent-warm"
              />
            </div>
          </div>
        )}

        {/* ── EFFECT / STICKER PROPERTIES ── */}
        {selectedClip.type === 'effect' && (
          <div className="p-3 rounded-xl bg-canvas border border-stroke space-y-3">
            <span className="text-[10px] font-mono font-bold text-ink-dim uppercase tracking-wider block">
              Stiker Masshtabi (Scale)
            </span>
            <div className="flex items-center justify-between">
              <span className="text-xs text-ink-muted">Oʻlchami:</span>
              <span className="font-mono text-accent-warm font-bold text-xs">
                {(selectedClip.scale || 1.0).toFixed(1)}x
              </span>
            </div>
            <input
              type="range"
              min="0.4"
              max="2.5"
              step="0.1"
              value={selectedClip.scale || 1.0}
              onChange={(e) =>
                updateClip(selectedClip.id, {
                  scale: parseFloat(e.target.value),
                })
              }
              className="w-full h-1 bg-surface-raised rounded-lg appearance-none cursor-pointer accent-accent-warm"
            />
          </div>
        )}
      </div>
    </aside>
  );
}

