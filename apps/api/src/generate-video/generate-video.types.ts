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
  imageUrl?: string;
  localImagePath?: string;
}

export interface DramaVideoGenerationJob {
  jobId: string;
  userId?: string;
  dbJobId?: string;
  prompt: string;
  productImageUrl?: string;
  imageUrl?: string;
  aspectRatio: '9:16';
  resolution?: string;
  modelTier: string;
  includeBackgroundMusic: boolean;
  bgMusicTrack: string;
  status:
    | 'queued'
    | 'framing_drama_scenes'
    | 'generating_veo_clips'
    | 'generating_ai_images'
    | 'rendering_scene_clips'
    | 'concatenating_master_video'
    | 'mixing_soundtrack'
    | 'saving_to_cloud'
    | 'completed'
    | 'failed';
  progress: number;
  currentStepMessage: string;
  scenes: DramaScene[];
  totalDurationSeconds: number;
  locale?: string;
  karaokeTimeline?: KaraokeWord[];
  videoUrl?: string;
  downloadUrl?: string;
  createdAt: string;
  completedAt?: string;
  error?: string;
}

