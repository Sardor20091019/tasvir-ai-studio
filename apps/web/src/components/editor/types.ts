import { LocaleType, SubtitleCue, SubtitlePresetStyle, SubtitleStyleConfig, DramaScene } from '../../types';

export type TrackType = 'video' | 'audio' | 'text' | 'effect';

export type AspectRatioType = '9:16' | '16:9' | '1:1';

export type TransitionType =
  | 'none'
  | 'crossfade'
  | 'dipToBlack'
  | 'slideLeft'
  | 'slideRight'
  | 'zoomIn'
  | 'glitch';

export interface TimelineClip {
  id: string;
  trackId: string;
  type: TrackType;
  title: string;
  startSec: number;        // Start time on global timeline (seconds)
  durationSec: number;     // Active played duration on timeline
  trimStartSec: number;    // In-point offset from media source beginning
  trimEndSec?: number;     // Source media total duration or trim limit
  sourceUrl: string;       // Media source (video url, audio url, or image url)
  thumbnailUrl?: string;
  
  // Video & Image specific
  speed?: number;          // 0.5 to 2.0
  volume?: number;         // 0 to 2.0 (1.0 = 100%)
  muted?: boolean;
  opacity?: number;        // 0 to 1.0
  colorFilter?: string;    // CSS filter or filter preset ID
  transition?: {
    type: TransitionType;
    durationSec: number;
  };

  // Text specific
  textContent?: string;
  textStyle?: SubtitleStyleConfig;
  animation?: 'karaoke_active' | 'word_pop' | 'typewriter' | 'slide_up' | 'fade_in' | 'none';
  words?: { word: string; startSec: number; endSec: number }[];

  // Effect / Sticker specific
  scale?: number;
  positionX?: number;      // -50 to 50 percent
  positionY?: number;      // -50 to 50 percent
}

export interface TimelineTrack {
  id: string;
  type: TrackType;
  name: string;
  isMuted: boolean;
  isLocked: boolean;
  isSolo?: boolean;
  height?: number;         // px
  clips: TimelineClip[];
}

export interface AssetItem {
  id: string;
  type: TrackType | 'image';
  title: string;
  category: string;
  url: string;
  thumbnailUrl?: string;
  durationSec?: number;
  tags?: string[];
}

export interface FilterPreset {
  id: string;
  label: string;
  description: string;
  cssFilter: string;
  previewColor: string;
}

export interface TextPresetItem {
  id: string;
  label: string;
  previewText: string;
  style: SubtitleStyleConfig;
}

export interface TransitionPreset {
  id: TransitionType;
  label: string;
  description: string;
  defaultDurationSec: number;
}

export interface EditorProjectManifest {
  id: string;
  title: string;
  durationSec: number;
  aspectRatio: AspectRatioType;
  fps: number;
  tracks: TimelineTrack[];
  subtitles?: SubtitleCue[];
  scenes?: DramaScene[];
  updatedAt: string;
}

