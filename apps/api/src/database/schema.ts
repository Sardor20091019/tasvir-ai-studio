import { Generated, Insertable, Selectable, Updateable } from 'kysely';

export interface UsersTable {
  id: Generated<string>;
  email?: string | null;
  full_name: string;
  avatar_url?: string | null;
  telegram_id: number | null;
  locale: Generated<string>;
  role: Generated<string>; 
  plan_tier: Generated<string>;
  credits_balance: Generated<number>;
  created_at: Generated<string>;
  updated_at: Generated<string>;
}

export type User = Selectable<UsersTable>;
export type NewUser = Insertable<UsersTable>;
export type UserUpdate = Updateable<UsersTable>;

export interface AiAvatarsTable {
  id: Generated<string>;
  slug: string;
  display_name: string;
  dialect_label: string;
  language_code: string;
  avatar_image_url: string;
  voice_model_id: string;
  is_active: Generated<boolean>;
  created_at: Generated<string>;
}

export type AiAvatar = Selectable<AiAvatarsTable>;
export type NewAiAvatar = Insertable<AiAvatarsTable>;
export type AiAvatarUpdate = Updateable<AiAvatarsTable>;

export interface ProductsTable {
  id: Generated<string>;
  user_id: string;
  title: string;
  category: string;
  price_uzs: number | string;
  discount_badge: string | null;
  image_url: string;
  created_at: Generated<string>;
}

export type Product = Selectable<ProductsTable>;
export type NewProduct = Insertable<ProductsTable>;
export type ProductUpdate = Updateable<ProductsTable>;

export interface VideoJobsTable {
  id: Generated<string>;
  user_id: string;
  product_id?: string | null;
  avatar_id?: string | null;
  platform_preset: Generated<string>;
  script_tone: Generated<string>;
  script_text: string;
  status: Generated<string>;
  progress_percent: Generated<number>;
  audio_preview_url: string | null;
  output_video_url: string | null;
  credits_charged: Generated<number>;
  error_message: string | null;
  created_at: Generated<string>;
  completed_at: string | null;
}

export type VideoJob = Selectable<VideoJobsTable>;
export type NewVideoJob = Insertable<VideoJobsTable>;
export type VideoJobUpdate = Updateable<VideoJobsTable>;

export interface PaymentTransactionsTable {
  id: Generated<string>;
  user_id: string;
  provider: string; 
  plan_tier: string;
  amount_uzs: number | string;
  credits_added: number;
  phone_number?: string | null;
  external_tx_id: string | null;
  status: Generated<string>; 
  created_at: Generated<string>;
}

export type PaymentTransaction = Selectable<PaymentTransactionsTable>;
export type NewPaymentTransaction = Insertable<PaymentTransactionsTable>;
export type PaymentTransactionUpdate = Updateable<PaymentTransactionsTable>;

export interface TokenRequestsTable {
  id: Generated<string>;
  user_id: string;
  phone_number?: string | null;
  requested_tokens: number;
  note: string | null;
  status: Generated<string>; 
  admin_id: string | null;
  created_at: Generated<string>;
  resolved_at: string | null;
}

export type TokenRequest = Selectable<TokenRequestsTable>;
export type NewTokenRequest = Insertable<TokenRequestsTable>;
export type TokenRequestUpdate = Updateable<TokenRequestsTable>;

export interface Database {
  users: UsersTable;
  ai_avatars: AiAvatarsTable;
  products: ProductsTable;
  video_jobs: VideoJobsTable;
  payment_transactions: PaymentTransactionsTable;
  token_requests: TokenRequestsTable;
}
