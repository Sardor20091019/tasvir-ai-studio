'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Scissors,
  Plus,
  Trash2,
  Download,
  Copy,
  Check,
  ZoomIn,
  ZoomOut,
  Clock,
  Sparkles,
  Type,
  Sliders,
  Layers,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Volume2,
  VolumeX,
  FileText,
  Upload,
  Save,
  CheckCircle2,
  Undo2,
  Redo2,
  Film,
  Music,
  Share2,
  RefreshCw,
  Search,
  Eye,
  SlidersHorizontal,
} from 'lucide-react';
import {
  SubtitleCue,
  SubtitleStyleConfig,
  SubtitlePresetStyle,
  VideoEditorProject,
  KaraokeWord,
  DramaScene,
  LocaleType,
  User,
} from '../types';

/* ──────────────────────────────────────────────────────────
   CAPCUT STYLE PRESETS
   ────────────────────────────────────────────────────────── */

export const SUBTITLE_PRESETS: Record<SubtitlePresetStyle, SubtitleStyleConfig> = {
  capcut_yellow: {
    preset: 'capcut_yellow',
    fontSize: 32,
    position: 'bottom',
    textColor: '#FFFFFF',
    highlightColor: '#FACC15', // Vibrant yellow
    bgColor: 'rgba(0, 0, 0, 0.4)',
    bgOpacity: 0.4,
    fontFamily: 'heading',
    animation: 'karaoke_active',
    textTransform: 'uppercase',
  },
  tiktok_green: {
    preset: 'tiktok_green',
    fontSize: 30,
    position: 'bottom',
    textColor: '#F8FAFC',
    highlightColor: '#4ADE80', // Neon emerald
    bgColor: 'rgba(15, 23, 42, 0.85)',
    bgOpacity: 0.85,
    fontFamily: 'sans',
    animation: 'word_pop',
    textTransform: 'none',
  },
  reels_cyan: {
    preset: 'reels_cyan',
    fontSize: 28,
    position: 'bottom',
    textColor: '#FFFFFF',
    highlightColor: '#38BDF8', // Cyan electric
    bgColor: 'rgba(0, 0, 0, 0.65)',
    bgOpacity: 0.65,
    fontFamily: 'heading',
    animation: 'karaoke_active',
    textTransform: 'uppercase',
  },
  minimal_white: {
    preset: 'minimal_white',
    fontSize: 26,
    position: 'bottom',
    textColor: '#FFFFFF',
    highlightColor: '#F8FAFC',
    bgColor: 'rgba(0, 0, 0, 0.25)',
    bgOpacity: 0.25,
    fontFamily: 'sans',
    animation: 'none',
    textTransform: 'none',
  },
  cinema_gold: {
    preset: 'cinema_gold',
    fontSize: 30,
    position: 'bottom',
    textColor: '#FEF3C7',
    highlightColor: '#E0AC75', // Warm cinematic gold
    bgColor: 'rgba(10, 10, 15, 0.6)',
    bgOpacity: 0.6,
    fontFamily: 'serif',
    animation: 'typewriter',
    textTransform: 'none',
  },
  uzum_coral: {
    preset: 'uzum_coral',
    fontSize: 32,
    position: 'bottom',
    textColor: '#FFFFFF',
    highlightColor: '#FB923C', // Uzum warm orange
    bgColor: 'rgba(20, 20, 28, 0.85)',
    bgOpacity: 0.85,
    fontFamily: 'heading',
    animation: 'word_pop',
    textTransform: 'uppercase',
  },
};

/* ──────────────────────────────────────────────────────────
   EMPTY PROJECT FALLBACK
   ────────────────────────────────────────────────────────── */

const EMPTY_PROJECT: VideoEditorProject = {
  id: 'blank-proj',
  title: 'Yangi Video Loyihasi',
  videoUrl: '',
  duration: 15,
  style: SUBTITLE_PRESETS.capcut_yellow,
  subtitles: [],
  scenes: [],
};

/* ──────────────────────────────────────────────────────────
   TIME FORMATTING UTILS
   ────────────────────────────────────────────────────────── */

function formatTimecode(seconds: number): string {
  const s = Math.max(0, seconds || 0);
  const mins = Math.floor(s / 60);
  const secs = Math.floor(s % 60);
  const tenths = Math.floor((s % 1) * 10);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${tenths}`;
}

function formatSrtTimestamp(seconds: number): string {
  const s = Math.max(0, seconds || 0);
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = Math.floor(s % 60);
  const ms = Math.floor((s % 1) * 1000);
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
}

function formatVttTimestamp(seconds: number): string {
  const s = Math.max(0, seconds || 0);
  const mins = Math.floor(s / 60);
  const secs = Math.floor(s % 60);
  const ms = Math.floor((s % 1) * 1000);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
}

/* ──────────────────────────────────────────────────────────
   CAPCUT VIDEO EDITOR PRO COMPONENT
   ────────────────────────────────────────────────────────── */

interface CapCutEditorProps {
  initialProject?: VideoEditorProject | null;
  locale?: LocaleType;
  user?: User | null;
  onSave?: (project: VideoEditorProject) => void;
  onBackToStudio?: () => void;
}

export function CapCutEditor({
  initialProject,
  locale = 'uz',
  user,
  onSave,
  onBackToStudio,
}: CapCutEditorProps) {
  // Project state
  const [project, setProject] = useState<VideoEditorProject>(() => {
    if (initialProject && initialProject.videoUrl) return initialProject;
    return EMPTY_PROJECT;
  });

  const [availableProjects, setAvailableProjects] = useState<VideoEditorProject[]>(() => {
    if (initialProject && initialProject.videoUrl) return [initialProject];
    return [];
  });

  useEffect(() => {
    if (initialProject && initialProject.videoUrl) {
      setProject(initialProject);
      setAvailableProjects((prev) => {
        const exists = prev.some((p) => p.id === initialProject.id);
        return exists ? prev : [initialProject, ...prev];
      });
      commitCues(initialProject.subtitles || []);
    }
  }, [initialProject]);

  // Playback state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [aspectRatio, setAspectRatio] = useState<'9:16' | '16:9'>('9:16');

  // Timeline & UI state
  const [selectedCueId, setSelectedCueId] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1); // 1x to 3x
  const [activeTab, setActiveTab] = useState<'subtitles' | 'styles' | 'scenes' | 'export'>('subtitles');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [expandedCueId, setExpandedCueId] = useState<string | null>(null);

  // Undo / Redo history
  const [history, setHistory] = useState<SubtitleCue[][]>([project.subtitles]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);
  const [hasCopied, setHasCopied] = useState<boolean>(false);
  const [isSavedFeedback, setIsSavedFeedback] = useState<boolean>(false);

  // Dragging states
  const [isScrubbing, setIsScrubbing] = useState<boolean>(false);
  const [dragHandle, setDragHandle] = useState<{
    cueId: string;
    type: 'start' | 'end' | 'move';
    startX: number;
    origStart: number;
    origEnd: number;
  } | null>(null);

  // Localized UI strings
  const t = {
    uz: {
      editorTitle: 'CAPCUT VIDEO MUHARRIRI',
      editorSub: 'AI yaratgan videolarning subtitrlarini soniyama-soniya tahrirlang',
      tabSubtitles: 'Subtitrlar (0.1s)',
      tabStyles: 'CapCut Stillar',
      tabScenes: 'AI Sahnalar',
      tabExport: 'Eksport & Saqlash',
      play: 'Ijro etish',
      pause: 'Toʻxtatish',
      split: 'Boʻlish (Split)',
      addCue: '+ Subtitr',
      deleteCue: 'Oʻchirish',
      jumpToCue: 'Oʻtish',
      cueDuration: 'Davomiyligi',
      startTime: 'Boshlanish vaqti',
      endTime: 'Tugash vaqti',
      wordsBreakdown: 'Soʻzma-soʻz millisekundlar',
      stylePreset: 'CapCut Subtitr Shablonlari',
      fontSize: 'Hajmi (px)',
      position: 'Joylashuvi',
      posBottom: 'Pastki (Reels xavfsiz zona)',
      posCenter: 'Oʻrtada',
      posTop: 'Yuqori',
      exportSrt: 'SRT Subtitr (.srt) yuklab olish',
      exportVtt: 'VTT Subtitr (.vtt) yuklab olish',
      exportJson: 'Loyiha JSON yuklab olish',
      saveProject: 'Oʻzgarishlarni saqlash',
      savedSuccess: 'Oʻzgarishlar muvaffaqiyatli saqlandi ✓',
      copyAll: 'Matnlarni nusxalash',
      copied: 'Nusxalandi ✓',
      videoSelector: 'Tahrirlash uchun video tanlang:',
      uploadCustom: 'Kompyuterdan MP4 yuklash',
      timelineZoom: 'Xronologiya masshtabi',
      backBtn: '← Studiyaga qaytish',
      undo: 'Bekor qilish (Ctrl+Z)',
      redo: 'Qaytarish (Ctrl+Y)',
      totalScenes: 'Sahna',
    },
    en: {
      editorTitle: 'CAPCUT VIDEO EDITOR',
      editorSub: 'Edit AI-generated subtitles second-by-second with frame-accurate timing',
      tabSubtitles: 'Subtitles (0.1s)',
      tabStyles: 'CapCut Styles',
      tabScenes: 'AI Scenes',
      tabExport: 'Export & Save',
      play: 'Play',
      pause: 'Pause',
      split: 'Split at Playhead',
      addCue: '+ Add Subtitle',
      deleteCue: 'Delete',
      jumpToCue: 'Jump',
      cueDuration: 'Duration',
      startTime: 'Start time',
      endTime: 'End time',
      wordsBreakdown: 'Word-by-word timing',
      stylePreset: 'CapCut Caption Presets',
      fontSize: 'Size (px)',
      position: 'Position',
      posBottom: 'Bottom (Reels safe zone)',
      posCenter: 'Center',
      posTop: 'Top',
      exportSrt: 'Download SRT Subtitles (.srt)',
      exportVtt: 'Download WebVTT (.vtt)',
      exportJson: 'Download Project JSON',
      saveProject: 'Save Changes',
      savedSuccess: 'Changes saved successfully ✓',
      copyAll: 'Copy All Captions',
      copied: 'Copied ✓',
      videoSelector: 'Select video to edit:',
      uploadCustom: 'Upload local MP4',
      timelineZoom: 'Timeline Zoom',
      backBtn: '← Back to Studio',
      undo: 'Undo (Ctrl+Z)',
      redo: 'Redo (Ctrl+Y)',
      totalScenes: 'Scenes',
    },
    ru: {
      editorTitle: 'CAPCUT РЕДАКТОР ВИДЕО',
      editorSub: 'Посекундное редактирование субтитров с точностью до миллисекунд',
      tabSubtitles: 'Субтитры (0.1с)',
      tabStyles: 'Стили CapCut',
      tabScenes: 'AI Сцены',
      tabExport: 'Экспорт & Сохранение',
      play: 'Воспроизведение',
      pause: 'Пауза',
      split: 'Разделить (Split)',
      addCue: '+ Субтитр',
      deleteCue: 'Удалить',
      jumpToCue: 'Перейти',
      cueDuration: 'Длительность',
      startTime: 'Время начала',
      endTime: 'Время окончания',
      wordsBreakdown: 'Пословный тайминг',
      stylePreset: 'Стили субтитров CapCut',
      fontSize: 'Размер (px)',
      position: 'Позиция',
      posBottom: 'Снизу (Зона Reels)',
      posCenter: 'По центру',
      posTop: 'Сверху',
      exportSrt: 'Скачать субтитры SRT (.srt)',
      exportVtt: 'Скачать WebVTT (.vtt)',
      exportJson: 'Скачать проект JSON',
      saveProject: 'Сохранить изменения',
      savedSuccess: 'Изменения сохранены ✓',
      copyAll: 'Скопировать весь текст',
      copied: 'Скопировано ✓',
      videoSelector: 'Выберите видео для монтажа:',
      uploadCustom: 'Загрузить локальное MP4',
      timelineZoom: 'Масштаб таймлайна',
      backBtn: '← Назад в Студию',
      undo: 'Отменить (Ctrl+Z)',
      redo: 'Повторить (Ctrl+Y)',
      totalScenes: 'Сцен',
    },
  }[locale] || {
    editorTitle: 'CAPCUT VIDEO EDITOR',
    editorSub: 'Edit AI-generated subtitles second-by-second with frame-accurate timing',
    tabSubtitles: 'Subtitles (0.1s)',
    tabStyles: 'CapCut Styles',
    tabScenes: 'AI Scenes',
    tabExport: 'Export & Save',
    play: 'Play',
    pause: 'Pause',
    split: 'Split at Playhead',
    addCue: '+ Add Subtitle',
    deleteCue: 'Delete',
    jumpToCue: 'Jump',
    cueDuration: 'Duration',
    startTime: 'Start time',
    endTime: 'End time',
    wordsBreakdown: 'Word-by-word timing',
    stylePreset: 'CapCut Caption Presets',
    fontSize: 'Size (px)',
    position: 'Position',
    posBottom: 'Bottom (Reels safe zone)',
    posCenter: 'Center',
    posTop: 'Top',
    exportSrt: 'Download SRT Subtitles (.srt)',
    exportVtt: 'Download WebVTT (.vtt)',
    exportJson: 'Download Project JSON',
    saveProject: 'Save Changes',
    savedSuccess: 'Changes saved successfully ✓',
    copyAll: 'Copy All Captions',
    copied: 'Copied ✓',
    videoSelector: 'Select video to edit:',
    uploadCustom: 'Upload local MP4',
    timelineZoom: 'Timeline Zoom',
    backBtn: '← Back to Studio',
    undo: 'Undo (Ctrl+Z)',
    redo: 'Redo (Ctrl+Y)',
    totalScenes: 'Scenes',
  };

  // Sync initial project if prop changes
  useEffect(() => {
    if (initialProject) {
      setProject(initialProject);
      setHistory([initialProject.subtitles]);
      setHistoryIndex(0);
    }
  }, [initialProject]);

  // Push new state to history for undo/redo
  const commitCues = useCallback((newCues: SubtitleCue[]) => {
    setProject((prev) => ({ ...prev, subtitles: newCues }));
    setHistory((prev) => {
      const sliced = prev.slice(0, historyIndex + 1);
      return [...sliced, newCues];
    });
    setHistoryIndex((prev) => prev + 1);
  }, [historyIndex]);

  const handleUndo = () => {
    if (historyIndex > 0) {
      const targetIndex = historyIndex - 1;
      setHistoryIndex(targetIndex);
      setProject((prev) => ({ ...prev, subtitles: history[targetIndex] }));
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const targetIndex = historyIndex + 1;
      setHistoryIndex(targetIndex);
      setProject((prev) => ({ ...prev, subtitles: history[targetIndex] }));
    }
  };

  // Video duration fallback
  const totalDuration = useMemo(() => {
    if (project.duration && project.duration > 0) return project.duration;
    if (videoRef.current?.duration && !isNaN(videoRef.current.duration)) {
      return videoRef.current.duration;
    }
    return 16;
  }, [project.duration]);

  // Video controls
  const handleTogglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(() => {});
    }
  };

  const handleSeek = (timeInSeconds: number) => {
    const safeTime = Math.max(0, Math.min(timeInSeconds, totalDuration));
    setCurrentTime(safeTime);
    if (videoRef.current) {
      videoRef.current.currentTime = safeTime;
    }
  };

  const handleStep = (secondsDelta: number) => {
    handleSeek(currentTime + secondsDelta);
  };

  // Sync video timeupdate
  const handleTimeUpdate = () => {
    if (!videoRef.current || isScrubbing) return;
    setCurrentTime(videoRef.current.currentTime);
  };

  const handleVideoLoadedMetadata = () => {
    if (videoRef.current && (!project.duration || project.duration <= 0)) {
      setProject((p) => ({ ...p, duration: videoRef.current!.duration }));
    }
  };

  // Keyboard shortcut listener (Space = play/pause, Left/Right = scrub 1s, Z = Undo, Y = Redo)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      if (e.code === 'Space') {
        e.preventDefault();
        handleTogglePlay();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handleStep(e.shiftKey ? -5 : -1);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        handleStep(e.shiftKey ? 5 : 1);
      } else if ((e.ctrlKey || e.metaKey) && e.code === 'KeyZ') {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && e.code === 'KeyY') {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, currentTime, totalDuration, historyIndex, history]);

  // Find active subtitle cue at current time
  const activeCue = useMemo(() => {
    return project.subtitles.find(
      (cue) => currentTime >= cue.startSec && currentTime <= cue.endSec,
    );
  }, [project.subtitles, currentTime]);

  // Select cue automatically if scrubbing over it
  useEffect(() => {
    if (activeCue && !selectedCueId) {
      setSelectedCueId(activeCue.id);
    }
  }, [activeCue, selectedCueId]);

  /* ──────────────────────────────────────────────────────────
     SUBTITLE MANIPULATION (SECOND BY SECOND)
     ────────────────────────────────────────────────────────── */

  // Edit text of a cue
  const handleUpdateCueText = (cueId: string, newText: string) => {
    const updated = project.subtitles.map((cue) => {
      if (cue.id !== cueId) return cue;

      // Recalculate word timing slots evenly based on new words count
      const wordsArray = newText.trim().split(/\s+/).filter(Boolean);
      const cueDuration = Math.max(0.4, cue.endSec - cue.startSec);
      const wordSpan = cueDuration / Math.max(1, wordsArray.length);

      const newWords: KaraokeWord[] = wordsArray.map((w, idx) => ({
        word: w,
        startSec: +(cue.startSec + idx * wordSpan).toFixed(2),
        endSec: +(cue.startSec + (idx + 1) * wordSpan).toFixed(2),
      }));

      return {
        ...cue,
        text: newText,
        words: newWords,
      };
    });

    commitCues(updated);
  };

  // Adjust timing second-by-second (e.g. +0.1s, -0.1s, +0.5s, -0.5s)
  const handleAdjustTiming = (
    cueId: string,
    field: 'startSec' | 'endSec',
    deltaSeconds: number,
  ) => {
    const updated = project.subtitles.map((cue) => {
      if (cue.id !== cueId) return cue;

      let newStart = cue.startSec;
      let newEnd = cue.endSec;

      if (field === 'startSec') {
        newStart = Math.max(0, +(cue.startSec + deltaSeconds).toFixed(2));
        if (newStart >= newEnd - 0.2) newStart = +(newEnd - 0.2).toFixed(2);
      } else {
        newEnd = Math.min(totalDuration, +(cue.endSec + deltaSeconds).toFixed(2));
        if (newEnd <= newStart + 0.2) newEnd = +(newStart + 0.2).toFixed(2);
      }

      // Re-interpolate words proportionally
      const duration = newEnd - newStart;
      const wordsCount = cue.words?.length || 1;
      const wordSpan = duration / wordsCount;
      const updatedWords = (cue.words || []).map((w, i) => ({
        ...w,
        startSec: +(newStart + i * wordSpan).toFixed(2),
        endSec: +(newStart + (i + 1) * wordSpan).toFixed(2),
      }));

      return {
        ...cue,
        startSec: newStart,
        endSec: newEnd,
        words: updatedWords,
      };
    });

    commitCues(updated);
  };

  // Direct number input for start/end
  const handleDirectTimeInput = (cueId: string, field: 'startSec' | 'endSec', val: number) => {
    if (isNaN(val)) return;
    const updated = project.subtitles.map((cue) => {
      if (cue.id !== cueId) return cue;
      let newStart = cue.startSec;
      let newEnd = cue.endSec;

      if (field === 'startSec') {
        newStart = Math.max(0, Math.min(val, cue.endSec - 0.2));
      } else {
        newEnd = Math.max(cue.startSec + 0.2, Math.min(val, totalDuration));
      }

      return {
        ...cue,
        startSec: +newStart.toFixed(2),
        endSec: +newEnd.toFixed(2),
      };
    });
    commitCues(updated);
  };

  // Split active cue at current playhead position
  const handleSplitCue = () => {
    const cueToSplit = project.subtitles.find(
      (c) => currentTime > c.startSec + 0.3 && currentTime < c.endSec - 0.3,
    );

    if (!cueToSplit) return;

    const words = cueToSplit.text.split(' ');
    const midIndex = Math.max(1, Math.floor(words.length / 2));
    const text1 = words.slice(0, midIndex).join(' ');
    const text2 = words.slice(midIndex).join(' ');

    const cue1: SubtitleCue = {
      id: `${cueToSplit.id}-a`,
      startSec: cueToSplit.startSec,
      endSec: +currentTime.toFixed(2),
      text: text1,
      words: (cueToSplit.words || []).filter((w) => w.startSec < currentTime),
    };

    const cue2: SubtitleCue = {
      id: `cue-${Date.now()}`,
      startSec: +currentTime.toFixed(2),
      endSec: cueToSplit.endSec,
      text: text2 || 'Yangi sahna subtitri',
      words: (cueToSplit.words || []).filter((w) => w.startSec >= currentTime),
    };

    const updated = project.subtitles
      .filter((c) => c.id !== cueToSplit.id)
      .concat([cue1, cue2])
      .sort((a, b) => a.startSec - b.startSec);

    commitCues(updated);
    setSelectedCueId(cue2.id);
  };

  // Add new subtitle cue at current playhead position
  const handleAddCue = () => {
    const newStart = +currentTime.toFixed(2);
    const newEnd = Math.min(totalDuration, +(newStart + 2.5).toFixed(2));
    const newCue: SubtitleCue = {
      id: `cue-${Date.now()}`,
      startSec: newStart,
      endSec: newEnd,
      text: 'Yangi subtitr matni...',
      words: [
        { word: 'Yangi', startSec: newStart, endSec: +(newStart + 0.8).toFixed(2) },
        { word: 'subtitr', startSec: +(newStart + 0.8).toFixed(2), endSec: +(newStart + 1.6).toFixed(2) },
        { word: 'matni...', startSec: +(newStart + 1.6).toFixed(2), endSec: newEnd },
      ],
    };

    const updated = [...project.subtitles, newCue].sort((a, b) => a.startSec - b.startSec);
    commitCues(updated);
    setSelectedCueId(newCue.id);
  };

  // Delete a cue
  const handleDeleteCue = (cueId: string) => {
    const updated = project.subtitles.filter((c) => c.id !== cueId);
    commitCues(updated);
    if (selectedCueId === cueId) {
      setSelectedCueId(updated[0]?.id || null);
    }
  };

  // Update specific word timing in karaoke breakdown
  const handleUpdateWordTiming = (
    cueId: string,
    wordIdx: number,
    field: 'startSec' | 'endSec',
    delta: number,
  ) => {
    const updated = project.subtitles.map((cue) => {
      if (cue.id !== cueId || !cue.words) return cue;
      const words = [...cue.words];
      const targetWord = words[wordIdx];
      if (!targetWord) return cue;

      if (field === 'startSec') {
        targetWord.startSec = Math.max(cue.startSec, +(targetWord.startSec + delta).toFixed(2));
      } else {
        targetWord.endSec = Math.min(cue.endSec, +(targetWord.endSec + delta).toFixed(2));
      }

      return { ...cue, words };
    });
    commitCues(updated);
  };

  /* ──────────────────────────────────────────────────────────
     STYLE & PRESET CONTROLS
     ────────────────────────────────────────────────────────── */

  const handleApplyPreset = (presetKey: SubtitlePresetStyle) => {
    const preset = SUBTITLE_PRESETS[presetKey];
    if (preset) {
      setProject((p) => ({ ...p, style: { ...preset } }));
    }
  };

  const handleUpdateStyle = (changes: Partial<SubtitleStyleConfig>) => {
    setProject((p) => ({
      ...p,
      style: {
        ...p.style,
        ...changes,
      },
    }));
  };

  /* ──────────────────────────────────────────────────────────
     EXPORT FUNCTIONS
     ────────────────────────────────────────────────────────── */

  const handleExportSrt = () => {
    let srtContent = '';
    project.subtitles.forEach((cue, index) => {
      const idx = index + 1;
      const start = formatSrtTimestamp(cue.startSec);
      const end = formatSrtTimestamp(cue.endSec);
      srtContent += `${idx}\n${start} --> ${end}\n${cue.text}\n\n`;
    });

    const blob = new Blob([srtContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_subtitles.srt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportVtt = () => {
    let vttContent = 'WEBVTT\n\n';
    project.subtitles.forEach((cue, index) => {
      const start = formatVttTimestamp(cue.startSec);
      const end = formatVttTimestamp(cue.endSec);
      vttContent += `${index + 1}\n${start} --> ${end}\n${cue.text}\n\n`;
    });

    const blob = new Blob([vttContent], { type: 'text/vtt;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_subtitles.vtt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJson = () => {
    const jsonStr = JSON.stringify(project, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_capcut_project.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyCaptions = () => {
    const textAll = project.subtitles
      .map((c) => `[${formatTimecode(c.startSec)} - ${formatTimecode(c.endSec)}] ${c.text}`)
      .join('\n');
    navigator.clipboard.writeText(textAll).then(() => {
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 2000);
    });
  };

  const handleSaveProject = () => {
    onSave?.(project);
    try {
      localStorage.setItem(`capcut_proj_${project.id}`, JSON.stringify(project));
    } catch {}
    setIsSavedFeedback(true);
    setTimeout(() => setIsSavedFeedback(false), 2500);
  };

  // Upload custom MP4 file
  const handleUploadCustomVideo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    const newProj: VideoEditorProject = {
      id: `proj-custom-${Date.now()}`,
      title: file.name.replace(/\.[^/.]+$/, ''),
      videoUrl: url,
      duration: 15,
      style: SUBTITLE_PRESETS.capcut_yellow,
      subtitles: [
        {
          id: 'cue-custom-1',
          startSec: 0.5,
          endSec: 4.5,
          text: 'Birinchi sahna subtitri — tahrirlash uchun bosing!',
        },
      ],
    };

    setProject(newProj);
    setAvailableProjects((prev) => [newProj, ...prev]);
    commitCues(newProj.subtitles);
  };

  /* ──────────────────────────────────────────────────────────
     TIMELINE DRAG & SCRUBBER LOGIC
     ────────────────────────────────────────────────────────── */

  const handleTimelineMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(clickX / rect.width, 1));
    const newTime = ratio * totalDuration;

    setIsScrubbing(true);
    handleSeek(newTime);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const moveX = moveEvent.clientX - rect.left;
      const moveRatio = Math.max(0, Math.min(moveX / rect.width, 1));
      handleSeek(moveRatio * totalDuration);
    };

    const handleMouseUp = () => {
      setIsScrubbing(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Subtitle cue handle dragging on timeline
  const handleCueHandleMouseDown = (
    e: React.MouseEvent,
    cueId: string,
    type: 'start' | 'end' | 'move',
  ) => {
    e.stopPropagation();
    const targetCue = project.subtitles.find((c) => c.id === cueId);
    if (!targetCue || !timelineRef.current) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const startX = e.clientX;
    const origStart = targetCue.startSec;
    const origEnd = targetCue.endSec;

    setSelectedCueId(cueId);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaPx = moveEvent.clientX - startX;
      const deltaSec = (deltaPx / rect.width) * totalDuration;

      const updated = project.subtitles.map((cue) => {
        if (cue.id !== cueId) return cue;

        let newStart = cue.startSec;
        let newEnd = cue.endSec;

        if (type === 'start') {
          newStart = Math.max(0, Math.min(origStart + deltaSec, origEnd - 0.2));
        } else if (type === 'end') {
          newEnd = Math.max(origStart + 0.2, Math.min(origEnd + deltaSec, totalDuration));
        } else if (type === 'move') {
          const dur = origEnd - origStart;
          newStart = Math.max(0, Math.min(origStart + deltaSec, totalDuration - dur));
          newEnd = newStart + dur;
        }

        return {
          ...cue,
          startSec: +newStart.toFixed(2),
          endSec: +newEnd.toFixed(2),
        };
      });

      setProject((p) => ({ ...p, subtitles: updated }));
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Filtered cues for search
  const filteredCues = useMemo(() => {
    if (!searchFilter.trim()) return project.subtitles;
    const q = searchFilter.toLowerCase();
    return project.subtitles.filter((c) => c.text.toLowerCase().includes(q));
  }, [project.subtitles, searchFilter]);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-h-[1100px] bg-obsidian text-ink select-none font-sans overflow-hidden border border-stroke rounded-2xl shadow-tactile-lg">
      {/* ── TOP HEADER / TOOLBAR ──────────────────────── */}
      <header className="h-14 bg-surface border-b border-stroke px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          {onBackToStudio && (
            <button
              onClick={onBackToStudio}
              className="px-2.5 py-1.5 rounded-lg border border-stroke bg-canvas hover:bg-surface-raised text-ink-muted hover:text-ink text-xs font-mono font-medium flex items-center gap-1.5 transition-colors"
            >
              {t.backBtn}
            </button>
          )}

          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-accent-warm/15 border border-accent-warm/30 text-accent-warm flex items-center justify-center font-bold">
              <Scissors className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-heading font-extrabold text-sm tracking-tight text-ink">
                  {t.editorTitle}
                </span>
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-accent-warm/20 text-accent-warm border border-accent-warm/40">
                  PRO
                </span>
              </div>
              <p className="text-[10px] text-ink-dim hidden sm:block truncate max-w-xs">
                {project.title}
              </p>
            </div>
          </div>
        </div>

        {/* Video selector & undo/redo */}
        <div className="flex items-center gap-2">
          {/* Project Switcher */}
          <div className="hidden md:flex items-center gap-1.5 bg-canvas border border-stroke rounded-lg px-2 py-1 text-xs">
            <Film className="h-3.5 w-3.5 text-accent-warm shrink-0" />
            <select
              value={project.id}
              onChange={(e) => {
                const found = availableProjects.find((p) => p.id === e.target.value);
                if (found) {
                  setProject(found);
                  commitCues(found.subtitles);
                  handleSeek(0);
                }
              }}
              className="bg-transparent text-xs text-ink font-medium focus:outline-none cursor-pointer max-w-[190px] truncate"
            >
              {availableProjects.map((p) => (
                <option key={p.id} value={p.id} className="bg-surface text-ink">
                  {p.title}
                </option>
              ))}
            </select>
          </div>

          {/* Upload Custom MP4 */}
          <label className="p-1.5 rounded-lg border border-stroke bg-canvas hover:bg-surface-raised text-ink-muted hover:text-ink cursor-pointer transition-colors" title={t.uploadCustom}>
            <Upload className="h-4 w-4" />
            <input type="file" accept="video/mp4,video/webm" className="hidden" onChange={handleUploadCustomVideo} />
          </label>

          {/* Undo / Redo */}
          <div className="flex items-center border border-stroke rounded-lg bg-canvas overflow-hidden">
            <button
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              className="p-1.5 text-ink-muted hover:text-ink disabled:opacity-30 transition-colors"
              title={t.undo}
            >
              <Undo2 className="h-4 w-4" />
            </button>
            <div className="w-px h-4 bg-stroke" />
            <button
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              className="p-1.5 text-ink-muted hover:text-ink disabled:opacity-30 transition-colors"
              title={t.redo}
            >
              <Redo2 className="h-4 w-4" />
            </button>
          </div>

          {/* Save / Export buttons */}
          <button
            onClick={handleSaveProject}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-xs ${
              isSavedFeedback
                ? 'bg-signal-green text-obsidian'
                : 'bg-accent-warm text-obsidian hover:bg-accent-warm-hover'
            }`}
          >
            {isSavedFeedback ? <Check className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
            <span>{isSavedFeedback ? t.savedSuccess : t.saveProject}</span>
          </button>
        </div>
      </header>

      {/* ── MAIN WORKSPACE (INSPECTOR + PREVIEW) ───────── */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
        {/* LEFT / SIDE INSPECTOR PANEL */}
        <div className="w-full lg:w-[420px] bg-surface-raised border-r border-stroke flex flex-col shrink-0 min-h-0">
          {/* Tab buttons */}
          <div className="flex items-center border-b border-stroke bg-surface px-2">
            {[
              { id: 'subtitles', label: t.tabSubtitles, icon: Type },
              { id: 'styles', label: t.tabStyles, icon: Sliders },
              { id: 'scenes', label: t.tabScenes, icon: Layers },
              { id: 'export', label: t.tabExport, icon: Download },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 py-2.5 text-[11px] font-mono font-semibold tracking-wider flex items-center justify-center gap-1.5 border-b-2 transition-all ${
                  activeTab === tab.id
                    ? 'border-accent-warm text-accent-warm bg-surface-raised/40'
                    : 'border-transparent text-ink-dim hover:text-ink-muted'
                }`}
              >
                <tab.icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* TAB 1: SUBTITLES (SECOND BY SECOND LIST) */}
          {activeTab === 'subtitles' && (
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              {/* Search & Actions Bar */}
              <div className="p-3 border-b border-stroke bg-surface/50 flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-dim" />
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="Qidirish / Search captions..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-canvas border border-stroke rounded-lg text-ink focus:border-accent-warm focus:outline-none"
                  />
                </div>
                <button
                  onClick={handleAddCue}
                  className="px-2.5 py-1.5 rounded-lg bg-ink text-obsidian text-xs font-mono font-bold hover:bg-accent-warm transition-colors flex items-center gap-1 shrink-0"
                  title="Yangi subtitr qoʻshish"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>{t.addCue}</span>
                </button>
              </div>

              {/* Subtitles Scrollable List */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
                {filteredCues.map((cue, idx) => {
                  const isSelected = selectedCueId === cue.id;
                  const isCurrent = currentTime >= cue.startSec && currentTime <= cue.endSec;
                  const isExpanded = expandedCueId === cue.id;
                  const duration = +(cue.endSec - cue.startSec).toFixed(1);

                  return (
                    <div
                      key={cue.id}
                      onClick={() => {
                        setSelectedCueId(cue.id);
                        handleSeek(cue.startSec);
                      }}
                      className={`p-3 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-surface border-accent-warm shadow-tactile'
                          : isCurrent
                          ? 'bg-surface/80 border-accent-warm/40'
                          : 'bg-canvas border-stroke hover:border-stroke-hover'
                      }`}
                    >
                      {/* Cue Header */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[10px] font-bold text-accent-warm bg-accent-warm/15 px-1.5 py-0.5 rounded">
                            #{idx + 1}
                          </span>
                          <span className="font-mono text-[11px] font-semibold text-ink-muted">
                            {formatTimecode(cue.startSec)} ➔ {formatTimecode(cue.endSec)}
                          </span>
                          <span className="font-mono text-[9px] text-ink-dim bg-surface-raised px-1 py-0.2 rounded">
                            {duration}s
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSeek(cue.startSec);
                            }}
                            className="p-1 text-ink-dim hover:text-accent-warm rounded"
                            title={t.jumpToCue}
                          >
                            <Play className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteCue(cue.id);
                            }}
                            className="p-1 text-ink-dim hover:text-signal-red rounded"
                            title={t.deleteCue}
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>

                      {/* Live Textarea */}
                      <textarea
                        value={cue.text}
                        rows={2}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => handleUpdateCueText(cue.id, e.target.value)}
                        className="w-full p-2 text-xs font-sans bg-surface rounded-lg border border-stroke text-ink focus:border-accent-warm focus:outline-none resize-none leading-relaxed"
                        placeholder="Subtitr matnini yozing..."
                      />

                      {/* Second-by-Second Stepper Controls */}
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-stroke/60 text-[11px] font-mono"
                      >
                        {/* Start Time Stepper */}
                        <div className="flex items-center justify-between bg-surface px-2 py-1 rounded-lg border border-stroke">
                          <span className="text-[9px] text-ink-dim">Boshlanish:</span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleAdjustTiming(cue.id, 'startSec', -0.1)}
                              className="px-1 py-0.5 rounded bg-surface-raised hover:bg-stroke text-ink font-bold text-[10px]"
                              title="-0.1s"
                            >
                              -0.1
                            </button>
                            <input
                              type="number"
                              step="0.1"
                              value={cue.startSec}
                              onChange={(e) =>
                                handleDirectTimeInput(cue.id, 'startSec', parseFloat(e.target.value))
                              }
                              className="w-12 text-center bg-transparent font-bold text-ink focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => handleAdjustTiming(cue.id, 'startSec', 0.1)}
                              className="px-1 py-0.5 rounded bg-surface-raised hover:bg-stroke text-ink font-bold text-[10px]"
                              title="+0.1s"
                            >
                              +0.1
                            </button>
                          </div>
                        </div>

                        {/* End Time Stepper */}
                        <div className="flex items-center justify-between bg-surface px-2 py-1 rounded-lg border border-stroke">
                          <span className="text-[9px] text-ink-dim">Tugash:</span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleAdjustTiming(cue.id, 'endSec', -0.1)}
                              className="px-1 py-0.5 rounded bg-surface-raised hover:bg-stroke text-ink font-bold text-[10px]"
                              title="-0.1s"
                            >
                              -0.1
                            </button>
                            <input
                              type="number"
                              step="0.1"
                              value={cue.endSec}
                              onChange={(e) =>
                                handleDirectTimeInput(cue.id, 'endSec', parseFloat(e.target.value))
                              }
                              className="w-12 text-center bg-transparent font-bold text-ink focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => handleAdjustTiming(cue.id, 'endSec', 0.1)}
                              className="px-1 py-0.5 rounded bg-surface-raised hover:bg-stroke text-ink font-bold text-[10px]"
                              title="+0.1s"
                            >
                              +0.1
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Expandable Karaoke Word-level timings */}
                      {cue.words && cue.words.length > 0 && (
                        <div className="mt-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedCueId(isExpanded ? null : cue.id)
                            }
                            className="text-[10px] font-mono text-accent-warm hover:underline flex items-center gap-1"
                          >
                            <span>{isExpanded ? '▲ Yashirish' : '▼ ' + t.wordsBreakdown}</span>
                            <span className="text-ink-dim">({cue.words.length} ta soʻz)</span>
                          </button>

                          {isExpanded && (
                            <div className="mt-2 p-2 rounded-lg bg-surface border border-stroke space-y-1.5 animate-in fade-in">
                              {cue.words.map((w, wIdx) => (
                                <div
                                  key={wIdx}
                                  className="flex items-center justify-between text-[10px] font-mono p-1 rounded bg-canvas border border-stroke/50"
                                >
                                  <span className="font-sans font-bold text-ink truncate max-w-[90px]">
                                    {w.word}
                                  </span>
                                  <div className="flex items-center gap-1">
                                    <span className="text-ink-dim">{w.startSec}s - {w.endSec}s</span>
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateWordTiming(cue.id, wIdx, 'startSec', -0.1)}
                                      className="px-1 rounded bg-surface hover:bg-stroke text-ink"
                                    >
                                      -
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateWordTiming(cue.id, wIdx, 'startSec', 0.1)}
                                      className="px-1 rounded bg-surface hover:bg-stroke text-ink"
                                    >
                                      +
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: STYLES & CAPCUT PRESETS */}
          {activeTab === 'styles' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              <div>
                <label className="text-xs font-mono font-bold tracking-wider text-ink-muted uppercase block mb-2">
                  {t.stylePreset}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(SUBTITLE_PRESETS) as SubtitlePresetStyle[]).map((key) => {
                    const preset = SUBTITLE_PRESETS[key];
                    const isCurrent = project.style.preset === key;
                    return (
                      <button
                        key={key}
                        onClick={() => handleApplyPreset(key)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          isCurrent
                            ? 'bg-surface border-accent-warm shadow-tactile'
                            : 'bg-canvas border-stroke hover:border-stroke-hover'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-heading font-bold text-xs text-ink">
                            {key.replace('_', ' ').toUpperCase()}
                          </span>
                          <span
                            className="w-3 h-3 rounded-full border border-stroke"
                            style={{ backgroundColor: preset.highlightColor }}
                          />
                        </div>
                        <div
                          className="text-[11px] font-bold p-1 rounded text-center truncate"
                          style={{
                            backgroundColor: preset.bgColor,
                            color: preset.highlightColor,
                          }}
                        >
                          SUBTITR PREVIEW
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Font Size Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-ink-muted">{t.fontSize}</span>
                  <span className="font-bold text-ink">{project.style.fontSize}px</span>
                </div>
                <input
                  type="range"
                  min={18}
                  max={48}
                  step={2}
                  value={project.style.fontSize}
                  onChange={(e) => handleUpdateStyle({ fontSize: parseInt(e.target.value) })}
                  className="w-full accent-accent-warm cursor-pointer"
                />
              </div>

              {/* Subtitle Position */}
              <div className="space-y-2">
                <label className="text-xs font-mono font-bold text-ink-muted uppercase block">
                  {t.position}
                </label>
                <div className="grid grid-cols-3 gap-2 text-xs font-mono font-medium">
                  {(['bottom', 'center', 'top'] as const).map((pos) => (
                    <button
                      key={pos}
                      onClick={() => handleUpdateStyle({ position: pos })}
                      className={`py-2 rounded-lg border text-center transition-all ${
                        project.style.position === pos
                          ? 'bg-accent-warm text-obsidian font-bold border-accent-warm'
                          : 'bg-canvas text-ink-muted border-stroke hover:border-stroke-hover'
                      }`}
                    >
                      {pos === 'bottom' ? 'Pastki' : pos === 'center' ? 'Oʻrtada' : 'Yuqori'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Colors Pickers */}
              <div className="space-y-3 pt-2 border-t border-stroke">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-ink-muted">Matn rangi:</span>
                  <input
                    type="color"
                    value={project.style.textColor}
                    onChange={(e) => handleUpdateStyle({ textColor: e.target.value })}
                    className="w-7 h-7 rounded border border-stroke cursor-pointer bg-transparent"
                  />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-ink-muted">Faol soʻz rangi (Highlight):</span>
                  <input
                    type="color"
                    value={project.style.highlightColor}
                    onChange={(e) => handleUpdateStyle({ highlightColor: e.target.value })}
                    className="w-7 h-7 rounded border border-stroke cursor-pointer bg-transparent"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SCENES */}
          {activeTab === 'scenes' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <span className="text-xs font-mono font-bold text-ink-dim uppercase block mb-1">
                AI Aktyor Sahnalari ({project.scenes?.length || 0} {t.totalScenes})
              </span>
              {(project.scenes || []).map((scene) => (
                <div
                  key={scene.sceneIndex}
                  className="p-3 rounded-xl bg-canvas border border-stroke space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-heading font-bold text-xs text-ink">
                      {scene.actTitle}
                    </span>
                    <span className="font-mono text-[10px] bg-accent-warm/15 text-accent-warm px-1.5 py-0.5 rounded font-bold">
                      {scene.durationSeconds}s
                    </span>
                  </div>
                  <p className="text-[11px] text-ink-muted italic">
                    &ldquo;{scene.dialogueScript}&rdquo;
                  </p>
                  <div className="text-[10px] font-mono text-ink-dim flex items-center gap-2 pt-1 border-t border-stroke/50">
                    <span>Ziddiyat: {scene.tensionLevel}/10</span>
                    <span>•</span>
                    <span className="truncate">{scene.emotion}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 4: EXPORT & SAVE */}
          {activeTab === 'export' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="space-y-2">
                <span className="text-xs font-mono font-bold text-ink-muted uppercase block">
                  Subtitrlarni Eksport Qilish:
                </span>
                <button
                  onClick={handleExportSrt}
                  className="w-full py-2.5 px-3 rounded-xl border border-stroke bg-canvas hover:bg-surface text-ink text-xs font-mono font-bold flex items-center justify-between transition-colors shadow-2xs"
                >
                  <span className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-accent-warm" />
                    <span>{t.exportSrt}</span>
                  </span>
                  <Download className="h-4 w-4" />
                </button>

                <button
                  onClick={handleExportVtt}
                  className="w-full py-2.5 px-3 rounded-xl border border-stroke bg-canvas hover:bg-surface text-ink text-xs font-mono font-bold flex items-center justify-between transition-colors shadow-2xs"
                >
                  <span className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-accent-warm" />
                    <span>{t.exportVtt}</span>
                  </span>
                  <Download className="h-4 w-4" />
                </button>

                <button
                  onClick={handleExportJson}
                  className="w-full py-2.5 px-3 rounded-xl border border-stroke bg-canvas hover:bg-surface text-ink text-xs font-mono font-bold flex items-center justify-between transition-colors shadow-2xs"
                >
                  <span className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-accent-warm" />
                    <span>{t.exportJson}</span>
                  </span>
                  <Download className="h-4 w-4" />
                </button>

                <button
                  onClick={handleCopyCaptions}
                  className="w-full py-2.5 px-3 rounded-xl border border-stroke bg-canvas hover:bg-surface text-ink text-xs font-mono font-bold flex items-center justify-between transition-colors shadow-2xs"
                >
                  <span className="flex items-center gap-2">
                    <Copy className="h-4 w-4 text-accent-warm" />
                    <span>{hasCopied ? t.copied : t.copyAll}</span>
                  </span>
                  {hasCopied ? <Check className="h-4 w-4 text-signal-green" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>

              <div className="pt-3 border-t border-stroke space-y-2">
                <span className="text-xs font-mono font-bold text-ink-muted uppercase block">
                  Asosiy Video Fayl:
                </span>
                <a
                  href={project.videoUrl}
                  download="tasvir-ai-capcut-edited.mp4"
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-3 px-4 rounded-xl bg-accent-warm hover:bg-accent-warm-hover text-obsidian text-xs font-heading font-extrabold flex items-center justify-center gap-2 transition-colors shadow-tactile"
                >
                  <Download className="h-4 w-4" />
                  <span>Videoni yuklab olish (MP4)</span>
                </a>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT / MAIN PREVIEW CANVAS */}
        <div className="flex-1 bg-obsidian flex flex-col justify-between p-4 overflow-hidden relative">
          {/* Aspect ratio & mode switcher */}
          <div className="flex items-center justify-between z-10">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-ink-dim uppercase tracking-wider">
                CANVAS:
              </span>
              <button
                onClick={() => setAspectRatio(aspectRatio === '9:16' ? '16:9' : '9:16')}
                className="px-2 py-0.5 rounded bg-surface border border-stroke text-ink text-[11px] font-mono font-bold hover:border-accent-warm transition-colors"
              >
                {aspectRatio}
              </button>
            </div>

            {/* Current Timecode Readout */}
            <div className="font-mono text-xs bg-surface/90 border border-stroke px-2.5 py-1 rounded-lg text-ink font-bold tabular-nums">
              <span className="text-accent-warm">{formatTimecode(currentTime)}</span> / {formatTimecode(totalDuration)}
            </div>
          </div>

          {/* Center Stage Video Player with Live Animated Subtitles */}
          <div className="flex-1 flex items-center justify-center py-2 min-h-0 relative">
            <div
              className={`relative rounded-2xl overflow-hidden bg-black shadow-2xl border border-stroke/70 max-h-full ${
                aspectRatio === '9:16'
                  ? 'aspect-[9/16] w-[260px] sm:w-[300px]'
                  : 'aspect-[16/9] w-full max-w-xl'
              }`}
            >
              {/* Real HTML5 Video */}
              {project.videoUrl ? (
                <video
                  ref={videoRef}
                  src={project.videoUrl}
                  playsInline
                  loop
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleVideoLoadedMetadata}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-canvas">
                  <div className="w-14 h-14 rounded-2xl bg-accent-warm/10 border border-accent-warm/20 flex items-center justify-center mb-4 text-accent-warm">
                    <Film className="h-7 w-7" />
                  </div>
                  <h3 className="text-base font-bold text-ink mb-1">
                    {locale === 'en' ? 'No Video Loaded' : locale === 'ru' ? 'Видео не загружено' : 'Video yuklanmagan'}
                  </h3>
                  <p className="text-xs text-ink-muted max-w-xs mb-5">
                    {locale === 'en'
                      ? 'Generate a new AI dramatic ad or upload your own MP4 video to start editing subtitles.'
                      : locale === 'ru'
                      ? 'Создайте драматическое AI видео или загрузите собственный MP4 файл для покадрового редактирования.'
                      : 'AI orqali yangi dramatik video yarating yoki kompyuteringizdan MP4 video yuklang.'}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2.5 w-full max-w-xs pointer-events-auto">
                    <button
                      onClick={onBackToStudio}
                      className="flex-1 py-2 px-3 rounded-xl bg-accent-warm hover:bg-accent-warm/90 text-obsidian font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-accent-warm/15 transition-all"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      {locale === 'en' ? 'Create AI Video' : locale === 'ru' ? 'Создать AI видео' : 'AI Video Yaratish'}
                    </button>
                    <label className="flex-1 py-2 px-3 rounded-xl border border-stroke bg-surface hover:bg-surface-raised text-ink text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors">
                      <Upload className="h-3.5 w-3.5 text-ink-muted" />
                      {locale === 'en' ? 'Upload MP4' : locale === 'ru' ? 'Загрузить MP4' : 'MP4 Yuklash'}
                      <input type="file" accept="video/mp4,video/webm" className="hidden" onChange={handleUploadCustomVideo} />
                    </label>
                  </div>
                </div>
              )}

              {/* Live Overlay Subtitles Layer */}
              <div
                className={`absolute inset-x-0 p-4 flex flex-col items-center pointer-events-none transition-all ${
                  project.style.position === 'top'
                    ? 'top-8 justify-start'
                    : project.style.position === 'center'
                    ? 'inset-y-0 justify-center'
                    : 'bottom-12 justify-end'
                }`}
              >
                {activeCue && (
                  <div
                    className="max-w-[90%] text-center px-3 py-1.5 rounded-xl transition-all animate-in fade-in zoom-in-95 duration-100"
                    style={{
                      backgroundColor: project.style.bgColor,
                      fontSize: `${project.style.fontSize}px`,
                      textTransform: project.style.textTransform,
                      fontFamily:
                        project.style.fontFamily === 'serif'
                          ? '"Playfair Display", Georgia, serif'
                          : project.style.fontFamily === 'heading'
                          ? '"Space Grotesk", sans-serif'
                          : '"Space Grotesk", sans-serif',
                      textShadow:
                        project.style.preset === 'capcut_yellow'
                          ? '0 2px 4px rgba(0,0,0,0.95), 0 0 10px rgba(0,0,0,0.8)'
                          : '0 2px 8px rgba(0,0,0,0.8)',
                    }}
                  >
                    {activeCue.words && activeCue.words.length > 0 ? (
                      activeCue.words.map((w, idx) => {
                        const isWordActive =
                          currentTime >= w.startSec && currentTime <= w.endSec;
                        const isPast = currentTime > w.endSec;

                        return (
                          <span
                            key={idx}
                            className={`inline-block mx-1 transition-transform ${
                              isWordActive
                                ? 'scale-110 font-black'
                                : 'opacity-90 font-bold'
                            }`}
                            style={{
                              color: isWordActive
                                ? project.style.highlightColor
                                : project.style.textColor,
                            }}
                          >
                            {w.word}
                          </span>
                        );
                      })
                    ) : (
                      <span
                        className="font-black"
                        style={{ color: project.style.highlightColor }}
                      >
                        {activeCue.text}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Floating Playback Controls Bar */}
          <div className="flex items-center justify-center gap-3 z-10 py-1">
            <button
              onClick={() => handleStep(-1)}
              className="p-2 rounded-lg bg-surface border border-stroke text-ink-muted hover:text-ink transition-colors"
              title="-1 soniya"
            >
              <RotateCcw className="h-4 w-4" />
            </button>

            <button
              onClick={handleTogglePlay}
              className="h-10 w-10 rounded-full bg-accent-warm hover:bg-accent-warm-hover text-obsidian flex items-center justify-center font-bold shadow-tactile transition-transform hover:scale-105"
            >
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5 fill-current" />}
            </button>

            <button
              onClick={() => handleStep(1)}
              className="p-2 rounded-lg bg-surface border border-stroke text-ink-muted hover:text-ink transition-colors"
              title="+1 soniya"
            >
              <ChevronRight className="h-4 w-4" />
            </button>

            {/* Split At Playhead */}
            <button
              onClick={handleSplitCue}
              className="px-3 py-2 rounded-lg bg-surface border border-stroke hover:border-accent-warm text-ink text-xs font-mono font-bold flex items-center gap-1.5 transition-colors"
              title={t.split}
            >
              <Scissors className="h-3.5 w-3.5 text-accent-warm" />
              <span className="hidden sm:inline">{t.split}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── BOTTOM MULTI-TRACK INTERACTIVE TIMELINE ─────── */}
      <div className="h-52 bg-surface-raised border-t border-stroke flex flex-col shrink-0 select-none">
        {/* Timeline Header Ruler Toolbar */}
        <div className="h-9 bg-surface border-b border-stroke px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold text-accent-warm flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>TIMELINE (XRONOLOGIYA)</span>
            </span>
            <span className="text-[10px] font-mono text-ink-dim">
              {project.subtitles.length} ta subtitr bloki
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Timeline Zoom */}
            <div className="flex items-center gap-1 text-ink-muted bg-canvas border border-stroke rounded px-1.5 py-0.5 text-xs">
              <ZoomOut
                className="h-3 w-3 cursor-pointer hover:text-ink"
                onClick={() => setZoomLevel((z) => Math.max(1, z - 0.5))}
              />
              <span className="text-[10px] font-mono">{zoomLevel}x</span>
              <ZoomIn
                className="h-3 w-3 cursor-pointer hover:text-ink"
                onClick={() => setZoomLevel((z) => Math.min(3, z + 0.5))}
              />
            </div>
          </div>
        </div>

        {/* Tracks Area (Ruler + Subtitle Track + Video Track) */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden p-2 relative bg-obsidian/40">
          <div
            ref={timelineRef}
            onMouseDown={handleTimelineMouseDown}
            style={{ width: `${100 * zoomLevel}%` }}
            className="h-full relative cursor-pointer min-w-full"
          >
            {/* Time Ruler (Seconds Ticks) */}
            <div className="h-5 border-b border-stroke/60 relative flex items-end">
              {Array.from({ length: Math.ceil(totalDuration) + 1 }).map((_, sec) => {
                const leftPercent = (sec / totalDuration) * 100;
                return (
                  <div
                    key={sec}
                    className="absolute top-0 bottom-0 border-l border-stroke/40"
                    style={{ left: `${leftPercent}%` }}
                  >
                    <span className="text-[8px] font-mono text-ink-dim ml-1 select-none">
                      {sec}s
                    </span>
                  </div>
                );
              })}
            </div>

            {/* TRACK 1: Subtitles Track */}
            <div className="h-14 relative my-1.5 bg-surface/50 rounded-lg border border-stroke/50 overflow-hidden">
              <div className="absolute left-1 top-1 text-[8px] font-mono font-bold text-accent-warm opacity-80 pointer-events-none z-10">
                SUBTITR TRACK
              </div>

              {project.subtitles.map((cue) => {
                const leftPercent = (cue.startSec / totalDuration) * 100;
                const widthPercent = ((cue.endSec - cue.startSec) / totalDuration) * 100;
                const isSelected = selectedCueId === cue.id;
                const isCurrent = currentTime >= cue.startSec && currentTime <= cue.endSec;

                return (
                  <div
                    key={cue.id}
                    onMouseDown={(e) => handleCueHandleMouseDown(e, cue.id, 'move')}
                    style={{
                      left: `${leftPercent}%`,
                      width: `${Math.max(widthPercent, 1.5)}%`,
                    }}
                    className={`absolute top-1 bottom-1 rounded-md px-2 flex items-center justify-between text-xs cursor-move overflow-hidden transition-colors border group ${
                      isSelected
                        ? 'bg-accent-warm text-obsidian border-accent-warm font-bold shadow-xs'
                        : isCurrent
                        ? 'bg-accent-warm/70 text-obsidian border-accent-warm'
                        : 'bg-surface-overlay text-ink-muted border-stroke hover:border-stroke-hover'
                    }`}
                  >
                    {/* Left Trim Handle */}
                    <div
                      onMouseDown={(e) => handleCueHandleMouseDown(e, cue.id, 'start')}
                      className="absolute left-0 top-0 bottom-0 w-2 bg-ink/20 hover:bg-ink/50 cursor-ew-resize opacity-0 group-hover:opacity-100 transition-opacity"
                    />

                    <span className="truncate text-[10px] font-mono pointer-events-none">
                      {cue.text}
                    </span>

                    {/* Right Trim Handle */}
                    <div
                      onMouseDown={(e) => handleCueHandleMouseDown(e, cue.id, 'end')}
                      className="absolute right-0 top-0 bottom-0 w-2 bg-ink/20 hover:bg-ink/50 cursor-ew-resize opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                  </div>
                );
              })}
            </div>

            {/* TRACK 2: Video Scenes Track */}
            <div className="h-9 relative bg-surface/40 rounded-lg border border-stroke/40 overflow-hidden flex">
              {(project.scenes || []).map((scene, idx) => {
                const widthPercent = ((scene.durationSeconds || 5) / totalDuration) * 100;
                return (
                  <div
                    key={scene.sceneIndex}
                    style={{ width: `${widthPercent}%` }}
                    className={`h-full border-r border-stroke flex items-center px-2 text-[10px] font-mono truncate ${
                      idx % 2 === 0 ? 'bg-surface' : 'bg-surface-raised'
                    }`}
                  >
                    <Film className="h-3 w-3 text-ink-dim mr-1 shrink-0" />
                    <span className="truncate text-ink-muted">
                      {scene.actTitle}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* TRACK 3: Audio Representation Track */}
            <div className="h-6 relative my-1 bg-surface/20 rounded border border-stroke/30 flex items-center px-2">
              <Music className="h-2.5 w-2.5 text-accent-warm mr-2 shrink-0" />
              <div className="flex-1 h-2 flex items-center gap-0.5 opacity-60">
                {Array.from({ length: 48 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-accent-warm/40 rounded-full"
                    style={{ height: `${20 + ((i * 17) % 80)}%` }}
                  />
                ))}
              </div>
            </div>

            {/* PLAYHEAD SCRUBBER NEEDLE */}
            <div
              style={{ left: `${(currentTime / totalDuration) * 100}%` }}
              className="absolute top-0 bottom-0 w-0.5 bg-signal-red z-30 pointer-events-none shadow-sm"
            >
              <div className="w-3 h-3 bg-signal-red rounded-full -translate-x-[5px] -translate-y-1 shadow-md" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

