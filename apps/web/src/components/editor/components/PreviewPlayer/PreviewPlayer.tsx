'use client';

import React, { useRef, useEffect, useState, useMemo } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  Shield,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useEditor } from '../../context/EditorContext';
import { TimelineClip } from '../../types';

function isImageUrl(url?: string): boolean {
  if (!url) return false;
  if (url.startsWith('data:image/')) return true;
  const clean = url.split('?')[0].split('#')[0].toLowerCase();
  return (
    clean.endsWith('.png') ||
    clean.endsWith('.jpg') ||
    clean.endsWith('.jpeg') ||
    clean.endsWith('.webp') ||
    clean.endsWith('.gif') ||
    clean.endsWith('.svg') ||
    clean.endsWith('.avif') ||
    url.includes('images.unsplash.com') ||
    url.includes('cdn.midjourney.com')
  );
}

function normalizeUrl(url: string): string {
  try {
    return new URL(url, window.location.href).href;
  } catch {
    return url;
  }
}

export function PreviewPlayer(): React.ReactElement {
  const {
    tracks,
    currentTime,
    duration,
    isPlaying,
    togglePlay,
    seek,
    stepFrame,
    aspectRatio,
    activeFilter,
    volume,
    setVolume,
    isMuted,
    setIsMuted,
    showSafeZone,
  } = useEditor();

  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Find active video clip at currentTime
  const activeVideoClip = useMemo(() => {
    const videoTrack = tracks.find((t) => t.type === 'video');
    if (!videoTrack || videoTrack.isMuted) return null;
    return (
      videoTrack.clips.find(
        (c) =>
          currentTime >= c.startSec &&
          currentTime < c.startSec + c.durationSec
      ) || null
    );
  }, [tracks, currentTime]);

  // Find active text/subtitle clips at currentTime
  const activeTextClips = useMemo(() => {
    const textTrack = tracks.find((t) => t.type === 'text');
    if (!textTrack || textTrack.isMuted) return [];
    return textTrack.clips.filter(
      (c) =>
        currentTime >= c.startSec &&
        currentTime < c.startSec + c.durationSec
    );
  }, [tracks, currentTime]);

  // Find active effects / stickers at currentTime
  const activeEffectClips = useMemo(() => {
    const effectTrack = tracks.find((t) => t.type === 'effect');
    if (!effectTrack || effectTrack.isMuted) return [];
    return effectTrack.clips.filter(
      (c) =>
        currentTime >= c.startSec &&
        currentTime < c.startSec + c.durationSec
    );
  }, [tracks, currentTime]);

  // Find active audio clips at currentTime
  const activeAudioClips = useMemo(() => {
    const audioTracks = tracks.filter((t) => t.type === 'audio' && !t.isMuted);
    const result: TimelineClip[] = [];
    audioTracks.forEach((t) => {
      const active = t.clips.find(
        (c) =>
          currentTime >= c.startSec &&
          currentTime < c.startSec + c.durationSec
      );
      if (active) result.push(active);
    });
    return result;
  }, [tracks, currentTime]);

  const isImg = activeVideoClip ? isImageUrl(activeVideoClip.sourceUrl) : false;

  useEffect(() => {
    const vid = videoElementRef.current;
    if (!vid) return;

    if (activeVideoClip && activeVideoClip.sourceUrl && !isImg) {
      const normalized = normalizeUrl(activeVideoClip.sourceUrl);
      if (vid.src !== normalized) {
        vid.src = activeVideoClip.sourceUrl;
      }
      const clipOffset =
        currentTime - activeVideoClip.startSec + (activeVideoClip.trimStartSec || 0);
      if (Math.abs(vid.currentTime - clipOffset) > 0.3) {
        vid.currentTime = Math.max(0, clipOffset);
      }
      vid.playbackRate = activeVideoClip.speed || 1.0;
      vid.volume = isMuted ? 0 : (activeVideoClip.volume ?? 1.0) * volume;

      if (isPlaying && vid.paused) {
        vid.play().catch(() => {});
      } else if (!isPlaying && !vid.paused) {
        vid.pause();
      }
    } else {
      if (!vid.paused) vid.pause();
    }
  }, [activeVideoClip, currentTime, isPlaying, volume, isMuted, isImg]);

  useEffect(() => {
    const aud = audioElementRef.current;
    if (!aud) return;

    const bgmClip = activeAudioClips[0];
    if (bgmClip && bgmClip.sourceUrl) {
      const normalized = normalizeUrl(bgmClip.sourceUrl);
      if (aud.src !== normalized) {
        aud.src = bgmClip.sourceUrl;
      }
      const offset =
        currentTime - bgmClip.startSec + (bgmClip.trimStartSec || 0);
      if (Math.abs(aud.currentTime - offset) > 0.3) {
        aud.currentTime = Math.max(0, offset);
      }
      aud.volume = isMuted ? 0 : (bgmClip.volume ?? 1.0) * volume;

      if (isPlaying && aud.paused) {
        aud.play().catch(() => {});
      } else if (!isPlaying && !aud.paused) {
        aud.pause();
      }
    } else {
      if (!aud.paused) aud.pause();
    }
  }, [activeAudioClips, currentTime, isPlaying, volume, isMuted]);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const formatTimecode = (sec: number): string => {
    const s = Math.max(0, sec || 0);
    const m = Math.floor(s / 60);
    const remainingS = Math.floor(s % 60);
    const frames = Math.floor((s % 1) * 30);
    return `${String(m).padStart(2, '0')}:${String(remainingS).padStart(2, '0')}:${String(frames).padStart(2, '0')}`;
  };

  const aspectClass =
    aspectRatio === '9:16'
      ? 'aspect-[9/16] max-h-[36vh] sm:max-h-[46vh] lg:max-h-[500px]'
      : aspectRatio === '16:9'
      ? 'aspect-video max-h-[30vh] sm:max-h-[38vh] lg:max-h-[440px]'
      : 'aspect-square max-h-[32vh] sm:max-h-[40vh] lg:max-h-[460px]';

  return (
    <div
      ref={containerRef}
      className="flex-1 flex flex-col items-center justify-center p-2 sm:p-3 bg-obsidian-card/40 relative select-none overflow-hidden min-h-0"
    >
      <div className="flex-1 min-h-0 w-full flex items-center justify-center p-1">
        <div
          className={`relative ${aspectClass} h-full max-h-full w-auto bg-black rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl border border-stroke/80 flex items-center justify-center group`}
        >
          <video
            ref={videoElementRef}
            className={`w-full h-full object-cover ${activeVideoClip && !isImg ? 'block' : 'hidden'}`}
            style={{
              filter: activeFilter.cssFilter,
              opacity: activeVideoClip?.opacity ?? 1,
            }}
            playsInline
            muted={isMuted}
            onLoadedMetadata={(e) => {
              if (activeVideoClip) {
                const offset = currentTime - activeVideoClip.startSec + (activeVideoClip.trimStartSec || 0);
                e.currentTarget.currentTime = Math.max(0, offset);
              }
            }}
          />

          {activeVideoClip && isImg && (
            <img
              src={activeVideoClip.sourceUrl}
              alt={activeVideoClip.title || 'Preview'}
              className="w-full h-full object-cover select-none"
              style={{
                filter: activeFilter.cssFilter,
                opacity: activeVideoClip.opacity ?? 1,
              }}
            />
          )}

          {!activeVideoClip && (
            <div className="text-center p-6 text-ink-dim">
              <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-30 text-accent-warm" />
              <p className="text-xs font-mono font-medium">Klip mavjud emas</p>
              <p className="text-[10px] text-ink-muted mt-1">
                Chap paneldan video yoki rasm qoʻshing
              </p>
            </div>
          )}

          <audio ref={audioElementRef} />

        {/* Overlay Stickers / Effects */}
        {activeEffectClips.map((eff) => (
          <div
            key={eff.id}
            className="absolute pointer-events-none transition-all duration-200"
            style={{
              top: `${50 + (eff.positionY || 0)}%`,
              left: `${50 + (eff.positionX || 0)}%`,
              transform: `translate(-50%, -50%) scale(${eff.scale || 1})`,
              opacity: eff.opacity ?? 1,
            }}
          >
            {eff.sourceUrl && (
              <img
                src={eff.sourceUrl}
                alt="Sticker"
                className="w-20 h-20 object-contain drop-shadow-lg"
              />
            )}
          </div>
        ))}

        {/* Overlay Kinetic Text / Captions */}
        {activeTextClips.map((txt) => {
          const style = txt.textStyle;
          const posClass =
            style?.position === 'top'
              ? 'top-8'
              : style?.position === 'center'
              ? 'top-1/2 -translate-y-1/2'
              : 'bottom-12';

          return (
            <div
              key={txt.id}
              className={`absolute left-0 right-0 px-4 text-center pointer-events-none z-10 ${posClass}`}
            >
              <div
                className="inline-block px-4 py-2 rounded-xl backdrop-blur-xs transition-all shadow-lg max-w-[90%]"
                style={{
                  backgroundColor: style?.bgColor || 'rgba(0, 0, 0, 0.65)',
                  color: style?.textColor || '#ffffff',
                  fontSize: `${(style?.fontSize || 28) * 0.75}px`,
                  fontFamily:
                    style?.fontFamily === 'heading'
                      ? 'var(--font-heading)'
                      : 'var(--font-sans)',
                  textTransform: style?.textTransform || 'none',
                }}
              >
                {/* Word by word karaoke highlight if available */}
                {txt.words && txt.words.length > 0 ? (
                  <span className="flex flex-wrap items-center justify-center gap-1.5 font-extrabold">
                    {txt.words.map((w, wIdx) => {
                      const isWordActive =
                        currentTime >= w.startSec && currentTime <= w.endSec;
                      return (
                        <span
                          key={wIdx}
                          style={{
                            color: isWordActive
                              ? style?.highlightColor || '#facc15'
                              : style?.textColor || '#ffffff',
                            transform: isWordActive ? 'scale(1.1)' : 'scale(1)',
                            transition: 'all 0.1s ease',
                          }}
                        >
                          {w.word}
                        </span>
                      );
                    })}
                  </span>
                ) : (
                  <span
                    className="font-extrabold tracking-wide"
                    style={{ color: style?.highlightColor || '#ffffff' }}
                  >
                    {txt.textContent || txt.title}
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {/* Safe-Zone Guide Overlay for TikTok / Reels */}
        {showSafeZone && aspectRatio === '9:16' && (
          <div className="absolute inset-0 pointer-events-none border-2 border-dashed border-accent-warm/40 flex flex-col justify-between p-4 z-20">
            <div className="text-[10px] font-mono font-bold text-accent-warm/80 bg-black/60 px-2 py-0.5 rounded self-center">
              Yuqori Xavfsiz Chegara (Header)
            </div>
            <div className="flex justify-between items-center text-[9px] font-mono text-accent-warm/60">
              <span>Chap Chegara</span>
              <span className="text-right">Reels Like & Ulashish</span>
            </div>
            <div className="text-[10px] font-mono font-bold text-accent-warm/80 bg-black/60 px-2 py-0.5 rounded self-center">
              Pastki Xavfsiz Chegara (Sarlavha & Tovush)
            </div>
          </div>
        )}
        </div>
      </div>

      {/* ── TRANSPORT CONTROLS BAR ── */}
      <div className="w-full max-w-xl mt-2 sm:mt-3 flex items-center justify-between gap-1.5 sm:gap-3 bg-canvas/80 border border-stroke rounded-xl px-2 sm:px-4 py-1.5 sm:py-2 shrink-0">
        {/* Timecode display */}
        <div className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs font-mono font-bold text-ink shrink-0">
          <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-accent-warm" />
          <span>{formatTimecode(currentTime)}</span>
          <span className="text-ink-dim">/</span>
          <span className="text-ink-muted">{formatTimecode(duration)}</span>
        </div>

        {/* Center Playback Controls */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Step Back 1 Frame */}
          <button
            onClick={() => stepFrame(-1)}
            className="p-1 sm:p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-surface-raised transition-colors cursor-pointer"
            title="Kadr orqaga (←)"
          >
            <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          {/* Play / Pause Toggle */}
          <button
            onClick={togglePlay}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-accent-warm hover:brightness-110 text-canvas flex items-center justify-center transition-all shadow-md active:scale-95 cursor-pointer shrink-0"
            title="Ijro etish / Toʻxtatish (Space)"
          >
            {isPlaying ? (
              <Pause className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" />
            ) : (
              <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current ml-0.5" />
            )}
          </button>

          {/* Step Forward 1 Frame */}
          <button
            onClick={() => stepFrame(1)}
            className="p-1 sm:p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-surface-raised transition-colors cursor-pointer"
            title="Kadr oldinga (→)"
          >
            <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          {/* Restart Playhead */}
          <button
            onClick={() => seek(0)}
            className="p-1 sm:p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-surface-raised transition-colors ml-0.5 sm:ml-1 cursor-pointer"
            title="Boshiga qaytarish"
          >
            <RotateCcw className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </button>
        </div>

        {/* Right Volume & Fullscreen */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Volume Mute */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-1 sm:p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-surface-raised transition-colors cursor-pointer"
            title={isMuted ? 'Ovozni yoqish' : 'Ovozni oʻchirish'}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-400" />
            ) : (
              <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            )}
          </button>

          {/* Volume Slider */}
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={isMuted ? 0 : volume}
            onChange={(e) => {
              setVolume(parseFloat(e.target.value));
              if (isMuted) setIsMuted(false);
            }}
            className="w-12 sm:w-16 h-1 bg-surface-raised rounded-lg appearance-none cursor-pointer accent-accent-warm hidden md:block"
          />

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="p-1 sm:p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-surface-raised transition-colors cursor-pointer"
            title="Toʻliq ekran"
          >
            <Maximize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

