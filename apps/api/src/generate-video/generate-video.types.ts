export type AspectRatioType = '9:16';

export interface KaraokeWord {
  word: string;
  startSec: number;
  endSec: number;
}

export interface DramaScene {
  sceneIndex: number;
  actTitle: string; // e.g. "Act 1: The Suspicion / Betrayal Hint"
  emotion: string; // e.g. "heartbreak", "intense confrontation", "crying", "cathartic triumph"
  tensionLevel: number; // 1 - 10
  durationSeconds: number; // Strictly constrained between 4 and 8 seconds
  cinematicPrompt: string; // Google Veo 3.1 tailored vertical 9:16 prompt
  dialogueScript: string; // Spoken line / hook
  caption: string;
  karaokeSubtitles: KaraokeWord[];
  clipVideoUrl?: string;
  localClipPath?: string;
}

export interface DramaVideoGenerationJob {
  jobId: string;
  prompt: string;
  aspectRatio: '9:16';
  modelTier: 'veo-3.1-lite-generate';
  includeBackgroundMusic: boolean;
  bgMusicTrack: string;
  status:
    | 'queued'
    | 'framing_drama_scenes'
    | 'generating_veo_clips'
    | 'concatenating_master_video'
    | 'mixing_soundtrack'
    | 'saving_to_cloud'
    | 'completed'
    | 'failed';
  progress: number;
  currentStepMessage: string;
  scenes: DramaScene[];
  totalDurationSeconds: number;
  karaokeTimeline?: KaraokeWord[];
  videoUrl?: string;
  downloadUrl?: string;
  createdAt: string;
  completedAt?: string;
  error?: string;
}
