'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  TimelineTrack,
  TimelineClip,
  TrackType,
  AspectRatioType,
  EditorProjectManifest,
  FilterPreset,
} from '../types';
import { FILTER_PRESETS, TEXT_PRESETS } from '../constants/stockAssets';
import { VideoEditorProject, SubtitleCue, LocaleType } from '../../../types';

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

interface EditorContextType {
  // State
  title: string;
  setTitle: (title: string) => void;
  tracks: TimelineTrack[];
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  zoomLevel: number;
  aspectRatio: AspectRatioType;
  selectedClipId: string | null;
  selectedTrackId: string | null;
  selectedClip: TimelineClip | null;
  activeFilter: FilterPreset;
  canUndo: boolean;
  canRedo: boolean;
  volume: number;
  isMuted: boolean;
  showSafeZone: boolean;
  locale: LocaleType;

  // Actions
  seek: (timeSec: number) => void;
  stepFrame: (frames: number) => void;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  setZoomLevel: (zoom: number) => void;
  setAspectRatio: (ratio: AspectRatioType) => void;
  setSelectedClipId: (clipId: string | null) => void;
  setActiveFilter: (filter: FilterPreset) => void;
  setVolume: (vol: number) => void;
  setIsMuted: (muted: boolean) => void;
  setShowSafeZone: (show: boolean | ((prev: boolean) => boolean)) => void;

  // Clip / Track operations
  addClip: (trackId: string, clipData: Partial<TimelineClip>) => void;
  updateClip: (clipId: string, updates: Partial<TimelineClip>) => void;
  removeClip: (clipId: string) => void;
  splitClipAtPlayhead: (clipId?: string) => void;
  trimClip: (clipId: string, side: 'start' | 'end', newSec: number) => void;
  moveClip: (clipId: string, newStartSec: number) => void;
  toggleTrackMute: (trackId: string) => void;
  toggleTrackLock: (trackId: string) => void;
  reorderTracks: (draggedId: string, targetId: string) => void;

  // History
  undo: () => void;
  redo: () => void;

  // Importers / Exporters
  loadProjectFromGenerated: (proj: VideoEditorProject) => void;
  getManifest: () => EditorProjectManifest;
}

const EditorContext = createContext<EditorContextType | null>(null);

const DEFAULT_TRACKS: TimelineTrack[] = [
  {
    id: 'track-video',
    type: 'video',
    name: 'Video Trek',
    isMuted: false,
    isLocked: false,
    clips: [],
  },
  {
    id: 'track-effect',
    type: 'effect',
    name: 'Overlay & Effektlar',
    isMuted: false,
    isLocked: false,
    clips: [],
  },
  {
    id: 'track-text',
    type: 'text',
    name: 'Titlar & Subtitrlar',
    isMuted: false,
    isLocked: false,
    clips: [],
  },
  {
    id: 'track-audio-vo',
    type: 'audio',
    name: 'Ovoz / Diktant',
    isMuted: false,
    isLocked: false,
    clips: [],
  },
  {
    id: 'track-audio-bgm',
    type: 'audio',
    name: 'Musiqa & SFX',
    isMuted: false,
    isLocked: false,
    clips: [],
  },
];

export function EditorProvider({
  children,
  initialProject,
  locale = 'uz',
}: {
  children: React.ReactNode;
  initialProject?: VideoEditorProject | null;
  locale?: LocaleType;
}) {
  const [title, setTitle] = useState<string>('Yangi Video Loyihasi');
  const [tracks, setTracks] = useState<TimelineTrack[]>(DEFAULT_TRACKS);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1.5); // 1 to 5
  const [aspectRatio, setAspectRatio] = useState<AspectRatioType>('9:16');
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterPreset>(FILTER_PRESETS[0]);
  const [volume, setVolume] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [showSafeZone, setShowSafeZone] = useState<boolean>(false);

  // Undo / Redo history stack
  const [history, setHistory] = useState<TimelineTrack[][]>([DEFAULT_TRACKS]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  const pushHistory = useCallback((newTracks: TimelineTrack[]) => {
    setHistory((prev) => {
      const upToCurrent = prev.slice(0, historyIndex + 1);
      return [...upToCurrent, newTracks];
    });
    setHistoryIndex((prev) => prev + 1);
    setTracks(newTracks);
  }, [historyIndex]);

  // Compute total duration of all tracks
  const duration = useMemo(() => {
    let max = 5; // minimum 5s timeline
    for (const track of tracks) {
      for (const clip of track.clips) {
        const end = clip.startSec + clip.durationSec;
        if (end > max) max = end;
      }
    }
    return Math.ceil(max);
  }, [tracks]);

  // Selected clip object helper
  const selectedClip = useMemo(() => {
    if (!selectedClipId) return null;
    for (const track of tracks) {
      const found = track.clips.find((c) => c.id === selectedClipId);
      if (found) return found;
    }
    return null;
  }, [tracks, selectedClipId]);

  // Playhead transport controls
  const seek = useCallback((timeSec: number) => {
    const clamped = Math.max(0, Math.min(timeSec, duration));
    setCurrentTime(clamped);
  }, [duration]);

  const stepFrame = useCallback((frames: number) => {
    const fps = 30;
    const dt = frames / fps;
    seek(currentTime + dt);
  }, [currentTime, seek]);

  const play = useCallback((): void => {
    if (currentTime >= duration - 0.05) {
      setCurrentTime(0);
    }
    setIsPlaying(true);
  }, [currentTime, duration]);

  const pause = useCallback((): void => {
    setIsPlaying(false);
  }, []);

  const togglePlay = useCallback((): void => {
    setIsPlaying((p) => {
      if (!p && currentTime >= duration - 0.05) {
        setCurrentTime(0);
      }
      return !p;
    });
  }, [currentTime, duration]);

  // Frame ticking loop when playing
  useEffect(() => {
    if (!isPlaying) return;
    let lastTime = performance.now();
    let animationFrameId: number;

    const tick = (now: number) => {
      const deltaSec = (now - lastTime) / 1000;
      lastTime = now;
      setCurrentTime((prev) => {
        const next = prev + deltaSec;
        if (next >= duration) {
          setIsPlaying(false);
          return duration;
        }
        return next;
      });
      animationFrameId = requestAnimationFrame(tick);
    };

    animationFrameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPlaying, duration]);

  // Add clip to track
  const addClip = useCallback(
    (trackId: string, clipData: Partial<TimelineClip>) => {
      const targetTrack = tracks.find((t) => t.id === trackId) || tracks[0];
      const startSec = clipData.startSec ?? currentTime;
      const durationSec = clipData.durationSec ?? 5;

      const newClip: TimelineClip = {
        id: `clip-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        trackId: targetTrack.id,
        type: targetTrack.type,
        title: clipData.title || 'Yangi Klip',
        startSec,
        durationSec,
        trimStartSec: clipData.trimStartSec ?? 0,
        trimEndSec: clipData.trimEndSec ?? durationSec,
        sourceUrl: clipData.sourceUrl || '',
        thumbnailUrl: clipData.thumbnailUrl,
        speed: clipData.speed ?? 1.0,
        volume: clipData.volume ?? 1.0,
        muted: clipData.muted ?? false,
        opacity: clipData.opacity ?? 1.0,
        colorFilter: clipData.colorFilter ?? activeFilter.id,
        textContent: clipData.textContent,
        textStyle: clipData.textStyle,
        animation: clipData.animation ?? 'karaoke_active',
        words: clipData.words,
        scale: clipData.scale ?? 1.0,
        positionX: clipData.positionX ?? 0,
        positionY: clipData.positionY ?? 0,
        ...clipData,
      };

      const newTracks = tracks.map((t) => {
        if (t.id === targetTrack.id) {
          return {
            ...t,
            clips: [...t.clips, newClip].sort((a, b) => a.startSec - b.startSec),
          };
        }
        return t;
      });

      pushHistory(newTracks);
      setSelectedClipId(newClip.id);
      setSelectedTrackId(targetTrack.id);
    },
    [tracks, currentTime, activeFilter.id, pushHistory]
  );

  // Update existing clip
  const updateClip = useCallback(
    (clipId: string, updates: Partial<TimelineClip>) => {
      const newTracks = tracks.map((t) => ({
        ...t,
        clips: t.clips.map((c) => (c.id === clipId ? { ...c, ...updates } : c)),
      }));
      pushHistory(newTracks);
    },
    [tracks, pushHistory]
  );

  // Remove clip
  const removeClip = useCallback(
    (clipId: string) => {
      const newTracks = tracks.map((t) => ({
        ...t,
        clips: t.clips.filter((c) => c.id !== clipId),
      }));
      pushHistory(newTracks);
      if (selectedClipId === clipId) setSelectedClipId(null);
    },
    [tracks, selectedClipId, pushHistory]
  );

  // Split clip at playhead
  const splitClipAtPlayhead = useCallback(
    (targetClipId?: string) => {
      const idToSplit = targetClipId || selectedClipId;
      if (!idToSplit) return;

      let foundClip: TimelineClip | null = null;
      let trackOwner: TimelineTrack | null = null;

      for (const t of tracks) {
        const c = t.clips.find((item) => item.id === idToSplit);
        if (c) {
          foundClip = c;
          trackOwner = t;
          break;
        }
      }

      if (!foundClip || !trackOwner) return;

      const clipStart = foundClip.startSec;
      const clipEnd = foundClip.startSec + foundClip.durationSec;

      // Only split if playhead is strictly inside the clip boundaries
      if (currentTime <= clipStart + 0.1 || currentTime >= clipEnd - 0.1) {
        return;
      }

      const splitOffset = currentTime - clipStart;
      const part1Duration = splitOffset;
      const part2Duration = foundClip.durationSec - splitOffset;

      const part1: TimelineClip = {
        ...foundClip,
        durationSec: part1Duration,
        trimEndSec: (foundClip.trimStartSec || 0) + part1Duration,
      };

      const part2: TimelineClip = {
        ...foundClip,
        id: `clip-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        startSec: currentTime,
        durationSec: part2Duration,
        trimStartSec: (foundClip.trimStartSec || 0) + part1Duration,
      };

      const newTracks = tracks.map((t) => {
        if (t.id === trackOwner!.id) {
          return {
            ...t,
            clips: t.clips
              .filter((c) => c.id !== foundClip!.id)
              .concat([part1, part2])
              .sort((a, b) => a.startSec - b.startSec),
          };
        }
        return t;
      });

      pushHistory(newTracks);
      setSelectedClipId(part2.id);
    },
    [tracks, selectedClipId, currentTime, pushHistory]
  );

  // Trim clip edges
  const trimClip = useCallback(
    (clipId: string, side: 'start' | 'end', newSec: number) => {
      const newTracks = tracks.map((t) => ({
        ...t,
        clips: t.clips.map((c) => {
          if (c.id !== clipId) return c;
          if (side === 'start') {
            const delta = newSec - c.startSec;
            const newDuration = Math.max(0.2, c.durationSec - delta);
            return {
              ...c,
              startSec: Math.max(0, newSec),
              durationSec: newDuration,
              trimStartSec: Math.max(0, (c.trimStartSec || 0) + delta),
            };
          } else {
            const newDuration = Math.max(0.2, newSec - c.startSec);
            return {
              ...c,
              durationSec: newDuration,
            };
          }
        }),
      }));
      pushHistory(newTracks);
    },
    [tracks, pushHistory]
  );

  // Move clip horizontally on timeline
  const moveClip = useCallback(
    (clipId: string, newStartSec: number) => {
      const clampedStart = Math.max(0, newStartSec);
      const newTracks = tracks.map((t) => ({
        ...t,
        clips: t.clips
          .map((c) => (c.id === clipId ? { ...c, startSec: clampedStart } : c))
          .sort((a, b) => a.startSec - b.startSec),
      }));
      pushHistory(newTracks);
    },
    [tracks, pushHistory]
  );

  // Track settings
  const toggleTrackMute = useCallback(
    (trackId: string) => {
      setTracks((prev) =>
        prev.map((t) => (t.id === trackId ? { ...t, isMuted: !t.isMuted } : t))
      );
    },
    []
  );

  const toggleTrackLock = useCallback(
    (trackId: string) => {
      setTracks((prev) =>
        prev.map((t) => (t.id === trackId ? { ...t, isLocked: !t.isLocked } : t))
      );
    },
    []
  );

  const reorderTracks = useCallback(
    (draggedId: string, targetId: string) => {
      setTracks((prev) => {
        const draggedIndex = prev.findIndex((t) => t.id === draggedId);
        const targetIndex = prev.findIndex((t) => t.id === targetId);
        if (draggedIndex === -1 || targetIndex === -1) return prev;
        const reordered = [...prev];
        const [removed] = reordered.splice(draggedIndex, 1);
        reordered.splice(targetIndex, 0, removed);
        return reordered;
      });
    },
    []
  );

  // Undo / Redo
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      setHistoryIndex(prevIndex);
      setTracks(history[prevIndex]);
    }
  }, [historyIndex, history]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      setTracks(history[nextIndex]);
    }
  }, [historyIndex, history]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  // Keyboard shortcuts (Space = play/pause, C = split, Delete = remove clip, Cmd+Z = undo)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        splitClipAtPlayhead();
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        if (selectedClipId) {
          e.preventDefault();
          removeClip(selectedClipId);
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        stepFrame(e.shiftKey ? -10 : -1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        stepFrame(e.shiftKey ? 10 : 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, splitClipAtPlayhead, removeClip, selectedClipId, undo, redo, stepFrame]);

  // Load project from AI-generated video job / existing VideoEditorProject
  const loadProjectFromGenerated = useCallback((proj: VideoEditorProject): void => {
    if (!proj) return;
    setTitle(proj.title || 'AI Yaratgan Video');

    const videoClips: TimelineClip[] = [];
    let currentClipStart = 0;

    if (proj.scenes && proj.scenes.length > 0) {
      proj.scenes.forEach((scene, idx) => {
        const sceneDur = scene.durationSeconds || 5;
        const isIndividual = Boolean(scene.clipVideoUrl);
        const source = scene.clipVideoUrl || proj.videoUrl || scene.imageUrl || '';
        const isMaster = !isIndividual && Boolean(proj.videoUrl);

        videoClips.push({
          id: `clip-scene-${idx}-${Date.now()}`,
          trackId: 'track-video',
          type: 'video',
          title: scene.actTitle || `Sahna ${idx + 1}`,
          startSec: currentClipStart,
          durationSec: sceneDur,
          trimStartSec: isMaster ? currentClipStart : 0,
          trimEndSec: isMaster ? currentClipStart + sceneDur : sceneDur,
          sourceUrl: source,
          thumbnailUrl: scene.imageUrl || (isImageUrl(source) ? source : undefined),
          speed: 1.0,
          volume: 1.0,
          colorFilter: 'none',
        });
        currentClipStart += sceneDur;
      });
    } else if (proj.videoUrl) {
      videoClips.push({
        id: `clip-main-${Date.now()}`,
        trackId: 'track-video',
        type: 'video',
        title: proj.title || 'Asosiy Video',
        startSec: 0,
        durationSec: proj.duration || 15,
        trimStartSec: 0,
        trimEndSec: proj.duration || 15,
        sourceUrl: proj.videoUrl,
        thumbnailUrl: isImageUrl(proj.videoUrl) ? proj.videoUrl : undefined,
        speed: 1.0,
        volume: 1.0,
        colorFilter: 'none',
      });
    }

    // Text track from subtitles
    const textClips: TimelineClip[] = [];
    if (proj.subtitles && proj.subtitles.length > 0) {
      proj.subtitles.forEach((sub, idx) => {
        textClips.push({
          id: `clip-text-${idx}-${Date.now()}`,
          trackId: 'track-text',
          type: 'text',
          title: sub.text.slice(0, 20) || `Titl ${idx + 1}`,
          startSec: sub.startSec,
          durationSec: Math.max(0.5, sub.endSec - sub.startSec),
          trimStartSec: 0,
          sourceUrl: '',
          textContent: sub.text,
          textStyle: proj.style || TEXT_PRESETS[0].style,
          animation: proj.style?.animation || 'karaoke_active',
          words: sub.words,
        });
      });
    }

    const loadedTracks: TimelineTrack[] = [
      {
        id: 'track-video',
        type: 'video',
        name: 'Video Trek',
        isMuted: false,
        isLocked: false,
        clips: videoClips,
      },
      {
        id: 'track-effect',
        type: 'effect',
        name: 'Overlay & Effektlar',
        isMuted: false,
        isLocked: false,
        clips: [],
      },
      {
        id: 'track-text',
        type: 'text',
        name: 'Titlar & Subtitrlar',
        isMuted: false,
        isLocked: false,
        clips: textClips,
      },
      {
        id: 'track-audio-vo',
        type: 'audio',
        name: 'Ovoz / Diktant',
        isMuted: false,
        isLocked: false,
        clips: [],
      },
      {
        id: 'track-audio-bgm',
        type: 'audio',
        name: 'Musiqa & SFX',
        isMuted: false,
        isLocked: false,
        clips: [],
      },
    ];

    setTracks(loadedTracks);
    setHistory([loadedTracks]);
    setHistoryIndex(0);
    setCurrentTime(0);
    if (videoClips[0]) setSelectedClipId(videoClips[0].id);
  }, []);

  // Preload initialProject if provided
  useEffect(() => {
    if (initialProject && (initialProject.videoUrl || (initialProject.scenes && initialProject.scenes.length > 0))) {
      loadProjectFromGenerated(initialProject);
    }
  }, [initialProject, loadProjectFromGenerated]);

  const getManifest = useCallback((): EditorProjectManifest => {
    return {
      id: `proj-${Date.now()}`,
      title,
      durationSec: duration,
      aspectRatio,
      fps: 30,
      tracks,
      updatedAt: new Date().toISOString(),
    };
  }, [title, duration, aspectRatio, tracks]);

  return (
    <EditorContext.Provider
      value={{
        title,
        setTitle,
        tracks,
        currentTime,
        duration,
        isPlaying,
        zoomLevel,
        aspectRatio,
        selectedClipId,
        selectedTrackId,
        selectedClip,
        activeFilter,
        canUndo,
        canRedo,
        volume,
        isMuted,
        showSafeZone,
        locale,
        seek,
        stepFrame,
        play,
        pause,
        togglePlay,
        setZoomLevel,
        setAspectRatio,
        setSelectedClipId,
        setActiveFilter,
        setVolume,
        setIsMuted,
        setShowSafeZone,
        addClip,
        updateClip,
        removeClip,
        splitClipAtPlayhead,
        trimClip,
        moveClip,
        toggleTrackMute,
        toggleTrackLock,
        reorderTracks,
        undo,
        redo,
        loadProjectFromGenerated,
        getManifest,
      }}
    >
      {children}
    </EditorContext.Provider>
  );
}

export function useEditor() {
  const ctx = useContext(EditorContext);
  if (!ctx) throw new Error('useEditor must be used within EditorProvider');
  return ctx;
}

