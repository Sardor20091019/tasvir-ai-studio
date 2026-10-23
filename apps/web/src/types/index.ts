export type LocaleType = 'uz' | 'en' | 'ru';

export interface User {
  id: string;
  email?: string | null;
  full_name: string;
  avatar_url?: string | null;
  telegram_id: number | null;
  locale: string;
  role?: string; 
  plan_tier: string;
  credits_balance: number;
  created_at: string;
  updated_at: string;
}

export interface AiAvatar {
  id: string;
  slug: string;
  display_name: string;
  dialect_label: string;
  language_code: string;
  avatar_image_url: string;
  voice_model_id: string;
  is_active: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  user_id: string;
  title: string;
  category: string;
  price_uzs: number | string;
  discount_badge: string | null;
  image_url: string;
  created_at: string;
}

export interface VideoJob {
  id: string;
  user_id: string;
  product_id: string;
  avatar_id?: string;
  platform_preset: string;
  script_tone: string;
  script_text: string;
  status: string;
  progress_percent: number;
  step_message?: string;
  audio_preview_url: string | null;
  output_video_url: string | null;
  scenes?: DramaScene[];
  credits_charged: number;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface PlanConfig {
  id: string;
  nameUz: string;
  priceUzs?: number;
  credits: number;
  description: string;
  badge?: string;
  features: string[];
}

export interface TokenRequest {
  id: string;
  user_id: string;
  phone_number: string;
  requested_tokens: number;
  note: string | null;
  status: 'pending' | 'approved' | 'rejected';
  admin_id: string | null;
  created_at: string;
  resolved_at: string | null;
}

export interface KaraokeWord {
  word: string;
  startSec: number;
  endSec: number;
}

export interface SubtitleCue {
  id: string;
  startSec: number;
  endSec: number;
  text: string;
  words?: KaraokeWord[];
}

export type SubtitlePresetStyle =
  | 'capcut_yellow'
  | 'tiktok_green'
  | 'reels_cyan'
  | 'minimal_white'
  | 'cinema_gold'
  | 'uzum_coral';

export interface SubtitleStyleConfig {
  preset: SubtitlePresetStyle;
  fontSize: number;
  position: 'bottom' | 'center' | 'top';
  textColor: string;
  highlightColor: string;
  bgColor: string;
  bgOpacity: number;
  fontFamily: 'sans' | 'heading' | 'serif' | 'mono';
  animation: 'karaoke_active' | 'word_pop' | 'typewriter' | 'none';
  textTransform: 'none' | 'uppercase';
}

export interface VideoEditorProject {
  id: string;
  title: string;
  videoUrl: string;
  duration: number;
  subtitles: SubtitleCue[];
  scenes?: DramaScene[];
  style: SubtitleStyleConfig;
  updatedAt?: string;
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
  imageUrl?: string;
}

export interface DramaVideoJob {
  jobId: string;
  prompt: string;
  aspectRatio: '9:16';
  resolution?: string;
  modelTier: string;
  includeBackgroundMusic: boolean;
  bgMusicTrack: string;
  status: string;
  progress: number;
  currentStepMessage: string;
  scenes: DramaScene[];
  totalDurationSeconds: number;
  karaokeTimeline?: KaraokeWord[];
  videoUrl?: string;
  downloadUrl?: string;
  createdAt?: string;
  completedAt?: string;
  error?: string;
}
