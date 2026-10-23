'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  Scissors,
  Trash2,
  ZoomIn,
  ZoomOut,
  Magnet,
  Volume2,
  VolumeX,
  Lock,
  Unlock,
  Film,
  Sparkles,
  Type,
  Music,
  Plus,
  ChevronRight,
} from 'lucide-react';
import { useEditor } from '../../context/EditorContext';
import { TimelineClip, TimelineTrack, TrackType } from '../../types';

export function Timeline() {
  const {
    tracks,
    currentTime,
    duration,
    seek,
    zoomLevel,
    setZoomLevel,
    selectedClipId,
    setSelectedClipId,
    splitClipAtPlayhead,
    removeClip,
    trimClip,
    moveClip,
    toggleTrackMute,
    toggleTrackLock,
  } = useEditor();

  const timelineContainerRef = useRef<HTMLDivElement | null>(null);
  const lanesScrollRef = useRef<HTMLDivElement | null>(null);
  const [isScrubbingRuler, setIsScrubbingRuler] = useState(false);
  const [activeDrag, setActiveDrag] = useState<{
    clipId: string;
    type: 'move' | 'trim-start' | 'trim-end';
    startX: number;
    initialStartSec: number;
    initialDurationSec: number;
  } | null>(null);

  // Pixels per second based on zoomLevel (1x = 30px, 5x = 150px)
  const pxPerSec = Math.round(30 * zoomLevel);
  const totalTimelineWidth = Math.max(1200, Math.ceil(duration * pxPerSec + 300));

  // Convert mouse X position inside lane to seconds
  const getSecondsFromMouseX = useCallback(
    (clientX: number) => {
      if (!lanesScrollRef.current) return 0;
      const rect = lanesScrollRef.current.getBoundingClientRect();
      const scrollLeft = lanesScrollRef.current.scrollLeft;
      const relativeX = clientX - rect.left + scrollLeft;
      const sec = Math.max(0, relativeX / pxPerSec);
      return Math.min(sec, duration + 10);
    },
    [pxPerSec, duration]
  );

  // Ruler scrub mouse & touch handlers
  const handleRulerMouseDown = (e: React.MouseEvent) => {
    setIsScrubbingRuler(true);
    const sec = getSecondsFromMouseX(e.clientX);
    seek(sec);
  };

  const handleRulerTouchStart = (e: React.TouchEvent) => {
    setIsScrubbingRuler(true);
    const touch = e.touches[0];
    const sec = getSecondsFromMouseX(touch.clientX);
    seek(sec);
  };

  useEffect(() => {
    const handleMove = (clientX: number) => {
      if (isScrubbingRuler) {
        const sec = getSecondsFromMouseX(clientX);
        seek(sec);
      } else if (activeDrag) {
        const deltaPx = clientX - activeDrag.startX;
        const deltaSec = deltaPx / pxPerSec;

        if (activeDrag.type === 'move') {
          const newStart = Math.max(0, activeDrag.initialStartSec + deltaSec);
          moveClip(activeDrag.clipId, newStart);
        } else if (activeDrag.type === 'trim-start') {
          const newStart = Math.max(0, activeDrag.initialStartSec + deltaSec);
          trimClip(activeDrag.clipId, 'start', newStart);
        } else if (activeDrag.type === 'trim-end') {
          const newEnd = Math.max(
            activeDrag.initialStartSec + 0.2,
            activeDrag.initialStartSec + activeDrag.initialDurationSec + deltaSec
          );
          trimClip(activeDrag.clipId, 'end', newEnd);
        }
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      handleMove(e.clientX);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        handleMove(e.touches[0].clientX);
      }
    };

    const handleDragEnd = () => {
      if (isScrubbingRuler) setIsScrubbingRuler(false);
      if (activeDrag) setActiveDrag(null);
    };

    if (isScrubbingRuler || activeDrag) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleDragEnd);
      window.addEventListener('touchmove', handleTouchMove, { passive: true });
      window.addEventListener('touchend', handleDragEnd);
      window.addEventListener('touchcancel', handleDragEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleDragEnd);
      window.removeEventListener('touchcancel', handleDragEnd);
    };
  }, [isScrubbingRuler, activeDrag, getSecondsFromMouseX, seek, moveClip, trimClip, pxPerSec]);

  // Track icons helper
  const getTrackIcon = (type: TrackType) => {
    switch (type) {
      case 'video':
        return <Film className="w-3.5 h-3.5 text-blue-400" />;
      case 'effect':
        return <Sparkles className="w-3.5 h-3.5 text-purple-400" />;
      case 'text':
        return <Type className="w-3.5 h-3.5 text-amber-400" />;
      case 'audio':
        return <Music className="w-3.5 h-3.5 text-emerald-400" />;
    }
  };

  return (
    <div
      ref={timelineContainerRef}
      className="h-52 sm:h-64 lg:h-72 bg-obsidian-card border-t border-stroke flex flex-col select-none flex-shrink-0 relative overflow-hidden"
    >
      {/* ── TIMELINE TOOLBAR ── */}
      <div className="h-10 border-b border-stroke px-4 flex items-center justify-between gap-3 bg-canvas/40 flex-shrink-0 z-10">
        {/* Left Editing Tools */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Split (Scissors) */}
          <button
            onClick={() => splitClipAtPlayhead()}
            disabled={!selectedClipId}
            className={`px-2.5 py-1 rounded-lg border text-xs font-mono font-medium flex items-center gap-1.5 transition-colors ${
              selectedClipId
                ? 'bg-canvas hover:bg-surface-raised border-stroke text-ink cursor-pointer'
                : 'bg-canvas/40 border-stroke/40 text-ink-dim/40 cursor-not-allowed'
            }`}
            title="Klipni kesish (C)"
          >
            <Scissors className="w-3.5 h-3.5 text-accent-warm" />
            <span className="hidden sm:inline">Boʻlish (C)</span>
          </button>

          {/* Delete Clip */}
          <button
            onClick={() => selectedClipId && removeClip(selectedClipId)}
            disabled={!selectedClipId}
            className={`px-2 py-1 rounded-lg border text-xs font-mono font-medium flex items-center gap-1 transition-colors ${
              selectedClipId
                ? 'bg-canvas hover:bg-red-500/10 border-stroke hover:border-red-500/40 text-ink-muted hover:text-red-400 cursor-pointer'
                : 'bg-canvas/40 border-stroke/40 text-ink-dim/40 cursor-not-allowed'
            }`}
            title="Klipni oʻchirish (Del)"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Oʻchirish</span>
          </button>
        </div>

        {/* Right Zoom Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-canvas border border-stroke rounded-lg px-2 py-1 text-xs">
            <button
              onClick={() => setZoomLevel(Math.max(1, zoomLevel - 0.5))}
              className="text-ink-muted hover:text-ink transition-colors"
              title="Kichraytirish"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <input
              type="range"
              min="1"
              max="4"
              step="0.25"
              value={zoomLevel}
              onChange={(e) => setZoomLevel(parseFloat(e.target.value))}
              className="w-16 h-1 bg-surface-raised rounded-lg appearance-none cursor-pointer accent-accent-warm"
            />
            <button
              onClick={() => setZoomLevel(Math.min(4, zoomLevel + 0.5))}
              className="text-ink-muted hover:text-ink transition-colors"
              title="Kattalashtirish"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono text-[10px] text-ink-muted ml-1">
              {zoomLevel.toFixed(1)}x
            </span>
          </div>
        </div>
      </div>

      {/* ── TIMELINE BODY: HEADERS + LANES ── */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Track Headers (Fixed Left Column) */}
        <div className="w-20 xs:w-28 sm:w-44 border-r border-stroke bg-canvas/90 flex flex-col flex-shrink-0 z-10 pt-7">
          {tracks.map((track) => (
            <div
              key={track.id}
              className="h-12 border-b border-stroke/60 px-1.5 sm:px-3 flex items-center justify-between text-xs group"
            >
              <div className="flex items-center gap-1 sm:gap-1.5 min-w-0">
                {getTrackIcon(track.type)}
                <span className="font-medium text-ink truncate text-[10px] sm:text-[11px] hidden xs:inline">
                  {track.name}
                </span>
              </div>

              <div className="flex items-center gap-0.5 sm:gap-1">
                {/* Mute Track */}
                <button
                  onClick={() => toggleTrackMute(track.id)}
                  className={`p-1 rounded hover:bg-surface transition-colors cursor-pointer ${
                    track.isMuted ? 'text-red-400' : 'text-ink-dim hover:text-ink'
                  }`}
                  title={track.isMuted ? 'Ovozni yoqish' : 'Trekni oʻchirish'}
                >
                  {track.isMuted ? (
                    <VolumeX className="w-3 h-3" />
                  ) : (
                    <Volume2 className="w-3 h-3 opacity-60 sm:opacity-40 group-hover:opacity-100" />
                  )}
                </button>

                {/* Lock Track */}
                <button
                  onClick={() => toggleTrackLock(track.id)}
                  className={`p-1 rounded hover:bg-surface transition-colors cursor-pointer ${
                    track.isLocked ? 'text-accent-warm' : 'text-ink-dim hover:text-ink'
                  }`}
                  title={track.isLocked ? 'Qulfni ochish' : 'Trekni qulflash'}
                >
                  {track.isLocked ? (
                    <Lock className="w-3 h-3" />
                  ) : (
                    <Unlock className="w-3 h-3 opacity-60 sm:opacity-40 group-hover:opacity-100" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Lanes & Ruler Scroll Area */}
        <div
          ref={lanesScrollRef}
          className="flex-1 overflow-x-auto overflow-y-auto relative custom-scrollbar bg-obsidian touch-pan-x"
        >
          <div
            style={{ width: `${totalTimelineWidth}px` }}
            className="relative min-h-full"
          >
            {/* ── TIME RULER ── */}
            <div
              onMouseDown={handleRulerMouseDown}
              onTouchStart={handleRulerTouchStart}
              className="h-7 border-b border-stroke bg-canvas/80 sticky top-0 cursor-pointer flex items-end select-none z-20 touch-none"
            >
              {Array.from({ length: Math.ceil(duration + 10) }).map((_, sec) => (
                <div
                  key={sec}
                  style={{
                    position: 'absolute',
                    left: `${sec * pxPerSec}px`,
                  }}
                  className="flex flex-col items-start pb-0.5"
                >
                  <span className="text-[9px] font-mono text-ink-muted pl-1">
                    {sec}s
                  </span>
                  <div className="w-px h-2 bg-stroke" />
                </div>
              ))}
            </div>

            {/* ── RED PLAYHEAD LINE ── */}
            <div
              style={{
                left: `${currentTime * pxPerSec}px`,
              }}
              className="absolute top-0 bottom-0 w-0.5 bg-red-500 pointer-events-none z-30 transition-none"
            >
              {/* Playhead needle handle */}
              <div className="w-3.5 h-3.5 bg-red-500 rounded-b -translate-x-1/2 flex items-center justify-center shadow-md">
                <div className="w-1.5 h-1.5 bg-white rounded-full" />
              </div>
            </div>

            {/* ── TRACK LANES ── */}
            <div className="space-y-0">
              {tracks.map((track) => (
                <div
                  key={track.id}
                  className={`h-12 border-b border-stroke/40 relative flex items-center ${
                    track.isLocked ? 'bg-black/40 pointer-events-none' : 'hover:bg-surface/10'
                  }`}
                >
                  {/* Clips inside this lane */}
                  {track.clips.map((clip) => {
                    const isSelected = selectedClipId === clip.id;
                    const clipWidth = Math.max(20, clip.durationSec * pxPerSec);
                    const clipLeft = clip.startSec * pxPerSec;

                    // Color theme per track type
                    let clipTheme =
                      'bg-blue-600/30 border-blue-500/80 text-blue-100 hover:border-blue-400';
                    if (clip.type === 'effect') {
                      clipTheme =
                        'bg-purple-600/30 border-purple-500/80 text-purple-100 hover:border-purple-400';
                    } else if (clip.type === 'text') {
                      clipTheme =
                        'bg-amber-600/30 border-amber-500/80 text-amber-100 hover:border-amber-400';
                    } else if (clip.type === 'audio') {
                      clipTheme =
                        'bg-emerald-600/30 border-emerald-500/80 text-emerald-100 hover:border-emerald-400';
                    }

                    if (isSelected) {
                      clipTheme += ' ring-2 ring-accent-warm shadow-md';
                    }

                    return (
                      <div
                        key={clip.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedClipId(clip.id);
                        }}
                        style={{
                          left: `${clipLeft}px`,
                          width: `${clipWidth}px`,
                        }}
                        className={`absolute h-9 rounded-lg border flex items-center justify-between px-2 cursor-grab active:cursor-grabbing text-xs select-none overflow-hidden transition-shadow group/clip ${clipTheme}`}
                      >
                        {/* Left Trim Handle */}
                        <div
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            setSelectedClipId(clip.id);
                            setActiveDrag({
                              clipId: clip.id,
                              type: 'trim-start',
                              startX: e.clientX,
                              initialStartSec: clip.startSec,
                              initialDurationSec: clip.durationSec,
                            });
                          }}
                          onTouchStart={(e) => {
                            e.stopPropagation();
                            setSelectedClipId(clip.id);
                            const touch = e.touches[0];
                            setActiveDrag({
                              clipId: clip.id,
                              type: 'trim-start',
                              startX: touch.clientX,
                              initialStartSec: clip.startSec,
                              initialDurationSec: clip.durationSec,
                            });
                          }}
                          className={`absolute left-0 top-0 bottom-0 w-3 sm:w-2.5 hover:bg-accent-warm active:bg-accent-warm cursor-ew-resize transition-all z-10 flex items-center justify-center touch-none ${
                            isSelected
                              ? 'bg-accent-warm opacity-100'
                              : 'bg-white/20 opacity-80 sm:opacity-0 sm:group-hover/clip:opacity-100'
                          }`}
                          title="Boshlanishini kesish (Trim In)"
                        >
                          <div className="w-0.5 h-3 bg-white rounded" />
                        </div>

                        {/* Clip Content Thumbnail & Title */}
                        <div
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            setSelectedClipId(clip.id);
                            setActiveDrag({
                              clipId: clip.id,
                              type: 'move',
                              startX: e.clientX,
                              initialStartSec: clip.startSec,
                              initialDurationSec: clip.durationSec,
                            });
                          }}
                          onTouchStart={(e) => {
                            e.stopPropagation();
                            setSelectedClipId(clip.id);
                            const touch = e.touches[0];
                            setActiveDrag({
                              clipId: clip.id,
                              type: 'move',
                              startX: touch.clientX,
                              initialStartSec: clip.startSec,
                              initialDurationSec: clip.durationSec,
                            });
                          }}
                          className="flex items-center gap-1.5 min-w-0 flex-1 truncate pr-2 touch-none"
                        >
                          {clip.thumbnailUrl && (
                            <img
                              src={clip.thumbnailUrl}
                              alt=""
                              className="w-5 h-5 sm:w-6 sm:h-6 object-cover rounded flex-shrink-0"
                            />
                          )}
                          <span className="font-semibold truncate text-[10px] sm:text-[11px]">
                            {clip.title}
                          </span>
                        </div>

                        {/* Duration Badge */}
                        <span className="text-[8px] sm:text-[9px] font-mono opacity-70 flex-shrink-0 pl-1">
                          {clip.durationSec.toFixed(1)}s
                        </span>

                        {/* Right Trim Handle */}
                        <div
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            setSelectedClipId(clip.id);
                            setActiveDrag({
                              clipId: clip.id,
                              type: 'trim-end',
                              startX: e.clientX,
                              initialStartSec: clip.startSec,
                              initialDurationSec: clip.durationSec,
                            });
                          }}
                          onTouchStart={(e) => {
                            e.stopPropagation();
                            setSelectedClipId(clip.id);
                            const touch = e.touches[0];
                            setActiveDrag({
                              clipId: clip.id,
                              type: 'trim-end',
                              startX: touch.clientX,
                              initialStartSec: clip.startSec,
                              initialDurationSec: clip.durationSec,
                            });
                          }}
                          className={`absolute right-0 top-0 bottom-0 w-3 sm:w-2.5 hover:bg-accent-warm active:bg-accent-warm cursor-ew-resize transition-all z-10 flex items-center justify-center touch-none ${
                            isSelected
                              ? 'bg-accent-warm opacity-100'
                              : 'bg-white/20 opacity-80 sm:opacity-0 sm:group-hover/clip:opacity-100'
                          }`}
                          title="Tugashini kesish (Trim Out)"
                        >
                          <div className="w-0.5 h-3 bg-white rounded" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

