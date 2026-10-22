'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { KaraokeWord, DramaScene } from '../types';

interface KaraokeSubtitlesProps {
  currentTime: number;
  subtitles: KaraokeWord[];
  scenes?: DramaScene[];
  className?: string;
  renderMode?: 'canvas' | 'dom';
}

/**
 * Dynamic Karaoke-Style Subtitle Overlay:
 * - Default font styling: Solid White (#FFFFFF) with high-contrast cinematic drop-shadow
 * - Active word: Vivid Yellow (#FFD700) with a warm glow matching the video playback head
 * - Supports both HTML5 Canvas rendering layer and high-impact Reels/TikTok DOM overlay
 */
export function KaraokeSubtitles({
  currentTime,
  subtitles,
  scenes = [],
  className = '',
  renderMode = 'dom',
}: KaraokeSubtitlesProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Group words into lines/sentences based on punctuation or ~5 words per line
  const wordGroups = useMemo(() => {
    if (!subtitles || subtitles.length === 0) return [];

    const groups: {
      id: number;
      startSec: number;
      endSec: number;
      words: KaraokeWord[];
    }[] = [];

    let currentGroupWords: KaraokeWord[] = [];
    let groupStart = 0;

    subtitles.forEach((wordObj, idx) => {
      if (currentGroupWords.length === 0) {
        groupStart = wordObj.startSec;
      }
      currentGroupWords.push(wordObj);

      const hasPunctuation = /[.!?…,]/.test(wordObj.word);
      const isMaxWords = currentGroupWords.length >= 5;
      const isLast = idx === subtitles.length - 1;

      if ((hasPunctuation || isMaxWords || isLast) && currentGroupWords.length > 0) {
        groups.push({
          id: groups.length,
          startSec: groupStart,
          endSec: wordObj.endSec + 0.35,
          words: currentGroupWords,
        });
        currentGroupWords = [];
      }
    });

    return groups;
  }, [subtitles]);

  // Find the currently active group for this playback timestamp
  const activeGroup = useMemo(() => {
    if (wordGroups.length === 0) return null;

    // Find direct hit
    const directHit = wordGroups.find(
      (g) => currentTime >= g.startSec - 0.1 && currentTime <= g.endSec + 0.3,
    );
    if (directHit) return directHit;

    // If between groups or slightly before/after, find closest
    if (currentTime < wordGroups[0].startSec) {
      return wordGroups[0];
    }
    const pastGroups = wordGroups.filter((g) => currentTime >= g.startSec);
    return pastGroups.length > 0 ? pastGroups[pastGroups.length - 1] : wordGroups[0];
  }, [wordGroups, currentTime]);

  // Identify active drama scene for context badge
  const activeScene = useMemo(() => {
    if (!scenes || scenes.length === 0) return null;
    let accumulated = 0;
    for (const scene of scenes) {
      accumulated += scene.durationSeconds || 5;
      if (currentTime <= accumulated) {
        return scene;
      }
    }
    return scenes[scenes.length - 1];
  }, [scenes, currentTime]);

  // Canvas-based word-by-word timed rendering
  useEffect(() => {
    if (renderMode !== 'canvas' || !canvasRef.current || !activeGroup) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth || 360;
    const height = canvas.clientHeight || 120;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    // Measure and render words horizontally centered
    const fontSize = Math.min(22, Math.max(16, Math.floor(width / 18)));
    ctx.font = `900 ${fontSize}px "Plus Jakarta Sans", system-ui, -apple-system, sans-serif`;
    ctx.textBaseline = 'middle';

    const words = activeGroup.words;
    const wordWidths = words.map((w) => ctx.measureText(w.word).width);
    const spaceWidth = ctx.measureText(' ').width;
    const totalTextWidth =
      wordWidths.reduce((a, b) => a + b, 0) + spaceWidth * Math.max(0, words.length - 1);

    let startX = Math.max(16, (width - totalTextWidth) / 2);
    const centerY = height / 2;

    words.forEach((w, i) => {
      const isWordActive = currentTime >= w.startSec && currentTime <= w.endSec;
      const isWordPast = currentTime > w.endSec;

      // Text stroke for contrast
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.9)';
      ctx.strokeText(w.word, startX, centerY);

      if (isWordActive) {
        // Active word: Vivid Yellow (#FFD700) with golden glow
        ctx.shadowColor = 'rgba(255, 215, 0, 0.9)';
        ctx.shadowBlur = 14;
        ctx.fillStyle = '#FFD700';
      } else if (isWordPast) {
        // Past word: Solid White
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#FFFFFF';
      } else {
        // Upcoming word: Crisp White (subtle opacity)
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      }

      ctx.fillText(w.word, startX, centerY);
      startX += wordWidths[i] + spaceWidth;
    });
  }, [currentTime, activeGroup, renderMode]);

  if (!activeGroup && (!subtitles || subtitles.length === 0)) {
    return null;
  }

  return (
    <div
      className={`pointer-events-none select-none flex flex-col items-center justify-end px-4 pb-14 sm:pb-16 text-center ${className}`}
      aria-live="polite"
    >
      {/* Dynamic Dramatic Emotion / Act Indicator */}
      {activeScene && (
        <div className="mb-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-[10px] font-mono font-bold text-white tracking-wider uppercase animate-in fade-in duration-200">
          <span className="w-1.5 h-1.5 rounded-full bg-[#FFD700] animate-pulse" />
          <span>{activeScene.actTitle || `Act ${activeScene.sceneIndex}`}</span>
        </div>
      )}

      {/* RENDER MODE A: Canvas Layer */}
      {renderMode === 'canvas' ? (
        <canvas
          ref={canvasRef}
          className="w-full max-w-[420px] h-24 mx-auto"
          style={{ width: '100%', height: '96px' }}
        />
      ) : (
        /* RENDER MODE B: High-Impact Reels/TikTok DOM Layer */
        <div className="relative max-w-[92%] px-3 py-2 rounded-2xl bg-black/45 backdrop-blur-sm border border-white/10 shadow-2xl">
          <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
            {activeGroup?.words.map((w, idx) => {
              const isWordActive = currentTime >= w.startSec && currentTime <= w.endSec;
              const isWordPast = currentTime > w.endSec;

              return (
                <span
                  key={`${w.word}-${idx}`}
                  className={`inline-block text-base sm:text-lg font-heading font-black tracking-wide transition-all duration-150 transform ${
                    isWordActive
                      ? 'text-[#FFD700] scale-115 drop-shadow-[0_0_12px_rgba(255,215,0,0.95)] z-10'
                      : isWordPast
                      ? 'text-[#FFFFFF] opacity-95 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]'
                      : 'text-[#FFFFFF] opacity-80 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]'
                  }`}
                  style={{
                    textShadow: isWordActive
                      ? '0 0 14px rgba(255, 215, 0, 0.9), 0 2px 4px rgba(0, 0, 0, 0.95)'
                      : '0 2px 4px rgba(0, 0, 0, 0.95), 0 0 2px rgba(0, 0, 0, 0.8)',
                  }}
                >
                  {w.word}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
