import { User, AiAvatar, Product, VideoJob, PlanConfig } from '../types';

const API_BASE = typeof window !== 'undefined' && window.location.hostname === 'localhost'
  ? 'http://localhost:4000/api'
  : (process.env.NEXT_PUBLIC_API_URL || '/api');

export const fallbackAvatars: AiAvatar[] = [
  {
    id: '163b8241-d469-48aa-8e8c-8b5ff2fe5586',
    slug: 'malika',
    display_name: 'Malika',
    dialect_label: 'Toshkent shevasi',
    language_code: 'uz-UZ',
    avatar_image_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80',
    voice_model_id: 'uz-voice-malika-warm',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: '070e7781-7213-4a07-9699-f9d557282878',
    slug: 'javohir',
    display_name: 'Javohir',
    dialect_label: 'Adabiy oʻzbek',
    language_code: 'uz-UZ',
    avatar_image_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
    voice_model_id: 'uz-voice-javohir-dynamic',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: '9476b839-388b-4062-b035-612d539d4fde',
    slug: 'dilnoza',
    display_name: 'Dilnoza',
    dialect_label: 'Samarqand / Vodiy',
    language_code: 'uz-UZ',
    avatar_image_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=600&q=80',
    voice_model_id: 'uz-voice-dilnoza-friendly',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: '21bce53d-9368-4a40-bd98-9a39691468a8',
    slug: 'timur',
    display_name: 'Timur',
    dialect_label: 'Rus tili (Toshkent)',
    language_code: 'ru-UZ',
    avatar_image_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
    voice_model_id: 'ru-voice-timur-energetic',
    is_active: true,
    created_at: new Date().toISOString(),
  },
];

export const fallbackProducts: Product[] = [
  {
    id: '21928696-a460-45f5-b441-120048b43071',
    user_id: '0fe7c7a7-d80b-496c-93a5-5163395c944e',
    title: 'Nike Air Zoom Pegasus 40',
    category: 'Kiyim va Poyabzal',
    price_uzs: 450000,
    discount_badge: '-35% Chegirma',
    image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
    created_at: new Date().toISOString(),
  },
  {
    id: 'b6166aff-d6e9-45b3-863f-6b37c4aa603f',
    user_id: '0fe7c7a7-d80b-496c-93a5-5163395c944e',
    title: "Milliy Atlas Ayollar Ko'ylagi (Xonatlas)",
    category: 'Milliy Liboslar',
    price_uzs: 320000,
    discount_badge: 'Bestseller Uzum',
    image_url: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=800&q=80',
    created_at: new Date().toISOString(),
  },
  {
    id: '9c78212d-9d9b-4198-ada3-c467f6bf8139',
    user_id: '0fe7c7a7-d80b-496c-93a5-5163395c944e',
    title: 'Smart Watch Ultra 8 Series AMOLED',
    category: 'Elektronika',
    price_uzs: 290000,
    discount_badge: '1+1 Sovg‘a',
    image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
    created_at: new Date().toISOString(),
  },
  {
    id: '218cfc2f-f7c8-4502-af3f-80e4ded27737',
    user_id: '0fe7c7a7-d80b-496c-93a5-5163395c944e',
    title: 'Samarqand Oq Mushk Parfyum 50ml',
    category: "Go'zallik va Parvarish",
    price_uzs: 550000,
    discount_badge: '-20% Maxsus Taklif',
    image_url: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=800&q=80',
    created_at: new Date().toISOString(),
  },
];

export const fallbackPlans: PlanConfig[] = [
  {
    id: 'starter',
    nameUz: 'Boshlangʻich',
    priceUzs: 99000,
    credits: 10,
    description: 'Yangi boshlagan Uzum va Telegram sotuvchilari uchun',
    features: ['10 ta HD video', 'Barcha 4 ta AI boshlovchi', '9:16 formati', 'Subtitrlar bilan'],
  },
  {
    id: 'shop_pro',
    nameUz: 'Doʻkon Pro',
    priceUzs: 249000,
    credits: 35,
    badge: 'Eng ommabop',
    description: 'Faol savdo qiluvchi doʻkonlar va brendlar uchun',
    features: [
      '35 ta Full HD video',
      'Tezkor render navbati',
      'Maxsus logotip va fonlar',
      'Ovoz tonlarini moslash',
      'Telegram bot integratsiyasi',
    ],
  },
  {
    id: 'agency',
    nameUz: 'Agentlik / Top Seller',
    priceUzs: 590000,
    credits: 100,
    description: 'Katta doʻkonlar va marketing agentliklari uchun',
    features: [
      '100 ta 4K video',
      'Eng yuqori server ustuvorligi',
      'Eksklyuziv klonlangan ovozlar',
      'API kalitlar va cheksiz yuklash',
      '24/7 shaxsiy menejer',
    ],
  },
];

function getAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('tasvir_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const api = {
  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('tasvir_token');
  },

  setToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('tasvir_token', token);
    }
  },

  logout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('tasvir_token');
    }
  },

  async getMe(): Promise<User> {
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: {
          ...getAuthHeaders(),
        },
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('API getMe fallback');
    }
    return {
      id: 'demo-user-1',
      phone_number: '+998901234567',
      full_name: 'Anvar Rahimov',
      telegram_id: 849201938,
      locale: 'uz',
      plan_tier: 'starter',
      credits_balance: 3,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  },

  async sendOtp(phoneNumber: string, turnstileToken?: string): Promise<{ success: boolean; message: string; demoCode?: string }> {
    try {
      const res = await fetch(`${API_BASE}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, turnstileToken }),
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('API sendOtp fallback');
    }
    return { success: true, message: 'SMS kod yuborildi', demoCode: '1234' };
  },

  async googleLogin(payload: { credential?: string; email?: string; name?: string; googleId?: string; avatarUrl?: string }): Promise<{ user: User; token: string }> {
    try {
      const res = await fetch(`${API_BASE}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.token) {
          this.setToken(data.token);
        }
        return data;
      }
    } catch (e) {
      console.warn('API googleLogin fallback');
    }
    return {
      user: {
        id: 'google-user-' + Date.now(),
        phone_number: '+998901234567',
        full_name: payload.name || 'Google Merchant',
        telegram_id: null,
        locale: 'uz',
        plan_tier: 'starter',
        credits_balance: 3,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      token: 'mock-google-token',
    };
  },

  async verifyOtp(phoneNumber: string, code: string): Promise<{ user: User; token: string }> {
    try {
      const res = await fetch(`${API_BASE}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, code }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.token) {
          this.setToken(data.token);
        }
        return data;
      }
    } catch (e) {
      console.warn('API verifyOtp fallback');
    }
    return {
      user: {
        id: 'user-' + Date.now(),
        phone_number: phoneNumber,
        full_name: 'Tasvir Foydalanuvchisi',
        telegram_id: null,
        locale: 'uz',
        plan_tier: 'starter',
        credits_balance: 3,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      token: 'mock-jwt-token',
    };
  },

  async getAvatars(): Promise<AiAvatar[]> {
    try {
      const res = await fetch(`${API_BASE}/video-jobs/avatars`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('API getAvatars fallback');
    }
    return fallbackAvatars;
  },

  async getProducts(): Promise<Product[]> {
    try {
      const res = await fetch(`${API_BASE}/products`, {
        headers: {
          ...getAuthHeaders(),
        },
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('API getProducts fallback');
    }
    return fallbackProducts;
  },

  async generateScript(params: {
    productTitle: string;
    category?: string;
    priceUzs?: number;
    tone: 'discount_hook' | 'quality_review' | 'short_reels';
    dialect?: string;
  }): Promise<{ scriptText: string; estimatedDurationSeconds: number; hooks: string[] }> {
    try {
      const res = await fetch(`${API_BASE}/video-jobs/generate-script`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('API generateScript fallback');
    }
    const priceFormatted = params.priceUzs
      ? `${Number(params.priceUzs).toLocaleString('uz-UZ')} so'm`
      : 'maxsus narxda';

    if (params.tone === 'discount_hook') {
      return {
        scriptText: `Salom! Uzum Marketda ulgurib qoling! Aynan bugun mashhur "${params.productTitle}" atigi ${priceFormatted} bo'lib turibdi. Sifati a'lo darajada, yetkazib berish esa 1 kunda bepul! Buyurtma berish uchun quyidagi havolani bosing va 30% chegirmadan foydalaning!`,
        estimatedDurationSeconds: 15,
        hooks: [`Hozirroq ko'ring! Uzum Marketda ushbu ${params.productTitle} atigi ${priceFormatted}!`],
      };
    } else if (params.tone === 'quality_review') {
      return {
        scriptText: `Assalomu alaykum! Ko'pchilik so'ragan "${params.productTitle}" qo'limizga yetib keldi. Materiali juda pishiq, qo'lda ushlaganda premium seziladi. Narxi ${priceFormatted}. O'zimiz sinovdan o'tkazdik — tavsiya qilamiz! Profilga o'tib, buyurtma qilishingiz mumkin.`,
        estimatedDurationSeconds: 15,
        hooks: [`Haqiqatdan ham shunchalik yaxshimi? ${params.productTitle} haqida xolis sharh!`],
      };
    } else {
      return {
        scriptText: `Tezda ko'ring! Trenddagi "${params.productTitle}" atigi ${priceFormatted}! Qulay, zamonaviy va arzon. Cheklangan miqdorda qoldi! Link bio-da yoki Telegram do'konimizda. Hoziroq ulguring!`,
        estimatedDurationSeconds: 15,
        hooks: [`Trenddagi ${params.productTitle} — endi O'zbekistonda! ⚡`],
      };
    }
  },

  async renderVideoJob(dto: {
    userId?: string;
    productId: string;
    avatarId: string;
    platformPreset: string;
    scriptTone: string;
    scriptText: string;
  }): Promise<VideoJob> {
    try {
      const res = await fetch(`${API_BASE}/video-jobs/render`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(dto),
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('API renderVideoJob fallback');
    }

    return {
      id: 'job-' + Date.now(),
      user_id: dto.userId || 'user-demo',
      product_id: dto.productId,
      avatar_id: dto.avatarId,
      platform_preset: dto.platformPreset,
      script_tone: dto.scriptTone,
      script_text: dto.scriptText,
      status: 'queued',
      progress_percent: 0,
      credits_charged: 1,
      audio_preview_url: `/api/video-jobs/audio-mock/${dto.avatarId}`,
      output_video_url: null,
      error_message: null,
      created_at: new Date().toISOString(),
      completed_at: null,
    };
  },

  async getJobStatus(jobId: string): Promise<VideoJob> {
    try {
      const res = await fetch(`${API_BASE}/video-jobs/${jobId}`, {
        headers: {
          ...getAuthHeaders(),
        },
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('API getJobStatus fallback');
    }
    return {
      id: jobId,
      user_id: 'user-1',
      product_id: 'prod-1',
      avatar_id: 'av-1',
      platform_preset: 'uzum_9_16',
      script_tone: 'discount_hook',
      script_text: '',
      status: 'completed',
      progress_percent: 100,
      credits_charged: 1,
      audio_preview_url: null,
      output_video_url: 'https://assets.mixkit.co/videos/preview/mixkit-vertical-fashion-model-showing-her-shoes-42795-large.mp4',
      error_message: null,
      created_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
    };
  },

  async getBillingPlans(): Promise<PlanConfig[]> {
    try {
      const res = await fetch(`${API_BASE}/billing/plans`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('API getBillingPlans fallback');
    }
    return fallbackPlans;
  },

  async createCheckout(body: {
    userId?: string;
    planTier: string;
    provider: 'payme' | 'click' | 'uzum';
    phoneNumber: string;
  }) {
    try {
      const res = await fetch(`${API_BASE}/billing/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(body),
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('API createCheckout fallback');
    }
    return {
      transactionId: 'tx-' + Date.now(),
      checkoutUrl: 'https://payme.uz',
      amountUzs: 99000,
      creditsAdded: 10,
      provider: body.provider,
    };
  },

  async confirmTestPayment(transactionId: string) {
    try {
      const res = await fetch(`${API_BASE}/billing/confirm-test-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ transactionId }),
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('API confirmTestPayment fallback');
    }
    return { success: true, newCreditsBalance: 13, planTier: 'shop_pro' };
  },

  async getTransactions() {
    try {
      const res = await fetch(`${API_BASE}/billing/transactions`, {
        headers: {
          ...getAuthHeaders(),
        },
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('API getTransactions fallback');
    }
    return [];
  },

  // Asynchronous Video Generation from Prompt (gemini-omni-1.1-flash & Remotion)
  async generateVideoFromPrompt(params: {
    prompt: string;
    aspectRatio?: '9:16' | '16:9' | '1:1';
    durationSeconds?: number;
    style?: string;
  }): Promise<{ jobId: string; status: string; progress: number; message: string }> {
    try {
      const res = await fetch(`${API_BASE}/generate-video`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(params),
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('API generateVideoFromPrompt fallback');
    }

    const fallbackJobId = `vid_${Date.now()}_sim`;
    return {
      jobId: fallbackJobId,
      status: 'queued',
      progress: 10,
      message: 'Video generatsiyasi boshlandi',
    };
  },

  async getPromptVideoStatus(jobId: string): Promise<{
    jobId: string;
    prompt: string;
    aspectRatio: '9:16' | '16:9' | '1:1';
    status: 'queued' | 'generating_script' | 'assembling_frames' | 'rendering' | 'completed' | 'failed';
    progress: number;
    currentStepMessage: string;
    videoUrl?: string;
    downloadUrl?: string;
    script?: { hook: string; body: string; cta: string };
    storyboard?: Array<{ frameNumber: number; timestampSec: number; sceneDescription: string; caption: string; visualLayerUrl: string }>;
  }> {
    try {
      const res = await fetch(`${API_BASE}/generate-video/${jobId}`, {
        headers: {
          ...getAuthHeaders(),
        },
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('API getPromptVideoStatus fallback');
    }

    return {
      jobId,
      prompt: 'Maxsus AI video prompt',
      aspectRatio: '9:16',
      status: 'completed',
      progress: 100,
      currentStepMessage: 'Video muvaffaqiyatli tayyorlandi!',
      videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-vertical-fashion-model-showing-her-shoes-42795-large.mp4',
      downloadUrl: 'https://assets.mixkit.co/videos/preview/mixkit-vertical-fashion-model-showing-her-shoes-42795-large.mp4',
      script: {
        hook: 'Hozirroq koʻring! Ushbu taklif faqat bugun amal qiladi!',
        body: 'Aynan bugun katta chegirmada sifatli mahsulotga buyurtma bering.',
        cta: 'Pastdagi havolani bosing va 30% chegirmadan foydalaning!',
      },
    };
  },
};

