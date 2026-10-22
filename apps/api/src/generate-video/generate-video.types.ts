export type AspectRatioType = '9:16';

export interface KaraokeWord {
  word: string;
  startSec: number;
  endSec: number;
}

export interface DramaScene {
  sceneIndex: number;
  actTitle: string; 
  emotion: string; 
  tensionLevel: number; 
  durationSeconds: number; 
  cinematicPrompt: string; 
  dialogueScript: string; 
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

