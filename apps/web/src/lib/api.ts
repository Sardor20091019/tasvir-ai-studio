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

  async getMe(): Promise<User | null> {
    const token = this.getToken();
    if (!token) return null;
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
    return null;
  },

  async updateProfile(data: {
    fullName?: string;
    phoneNumber?: string;
    avatarUrl?: string;
    locale?: string;
  }): Promise<User> {
    const res = await fetch(`${API_BASE}/auth/profile`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      return await res.json();
    }

    const err = await res.json().catch(() => null);
    throw new Error(err?.message || 'Profilni yangilashda xatolik yuz berdi');
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

  async googleLogin(payload: {
    credential?: string;
    email?: string;
    name?: string;
    googleId?: string;
    avatarUrl?: string;
    turnstileToken?: string;
  }): Promise<{ user: User; token: string }> {
    if (!payload.turnstileToken) {
      throw new Error('Cloudflare Turnstile tekshiruvidan oʻtish shart');
    }
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
      const errData = await res.json().catch(() => null);
      throw new Error(errData?.message || 'Google orqali kirishda xatolik yuz berdi');
    } catch (e: any) {
      throw e;
    }
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
      output_video_url: 'https://n6ogfqlb21.ufs.sh/f/e4WrEcObdaG3xQRkL5D1FbQuz7SaXsDfAioc3JZvk59ORCG4',
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

  async requestTokens(requestedTokens: number, note?: string): Promise<{ success: boolean; message: string; requestId?: string }> {
    try {
      const res = await fetch(`${API_BASE}/billing/request-tokens`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ requestedTokens, note }),
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('API requestTokens fallback');
    }
    return {
      success: true,
      message: 'Soʻrovingiz adminga yuborildi. Administrator tez orada tokenlarni hisobingizga qoʻshadi.',
      requestId: 'req-' + Date.now(),
    };
  },

  async getMyTokenRequests(): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE}/billing/my-requests`, {
        headers: {
          ...getAuthHeaders(),
        },
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('API getMyTokenRequests fallback');
    }
    return [];
  },

  async adminGrantTokens(dto: {
    targetUserId?: string;
    targetPhoneNumber?: string;
    tokensToAdd: number;
    reason?: string;
    requestId?: string;
  }): Promise<{ success: boolean; message: string; newBalance?: number; user?: any }> {
    try {
      const res = await fetch(`${API_BASE}/admin/grant-tokens`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(dto),
      });
      if (res.ok) return await res.json();
      const err = await res.json();
      throw new Error(err.message || 'Xatolik yuz berdi');
    } catch (e: any) {
      throw e;
    }
  },

  async adminListRequests(): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE}/admin/requests`, {
        headers: {
          ...getAuthHeaders(),
        },
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('API adminListRequests fallback');
    }
    return [];
  },

  async adminRejectRequest(requestId: string): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch(`${API_BASE}/admin/reject-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ requestId }),
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('API adminRejectRequest fallback');
    }
    return { success: true, message: 'Rad etildi' };
  },

  async adminListUsers(): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE}/admin/users`, {
        headers: {
          ...getAuthHeaders(),
        },
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('API adminListUsers fallback');
    }
    return [];
  },

  async createCheckout(body: {
    userId?: string;
    planTier: string;
    phoneNumber?: string;
  }) {
    // Top-up with payments removed: automatically routes to token request to admin
    const tokens = body.planTier === 'agency' ? 100 : body.planTier === 'shop_pro' ? 35 : 10;
    return this.requestTokens(tokens, `${body.planTier} tarifi uchun so'rov`);
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

  // Asynchronous Dramatic Product Video Generation (Google Veo 3.1 & Multi-Scene Concat)
  async generateVideoFromPrompt(params: {
    prompt: string;
    aspectRatio?: '9:16';
    includeBackgroundMusic?: boolean;
    dramaLevel?: string;
  }): Promise<{ jobId: string; status: string; progress: number; message: string; model?: string }> {
    const res = await fetch(`${API_BASE}/generate-video`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({
        ...params,
        aspectRatio: '9:16', // Enforced 9:16 vertical ratio
      }),
    });

    if (res.ok) {
      return await res.json();
    }

    const err = await res.json().catch(() => null);
    if (res.status === 401) {
      throw new Error(err?.message || 'Video yaratish uchun avval tizimga kiring (Google hisobingiz orqali)');
    }
    throw new Error(err?.message || 'Video yaratishda xatolik yuz berdi');
  },

  async getPromptVideoStatus(jobId: string): Promise<any> {
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
      prompt: 'Maxsus AI dramatik video reklama',
      aspectRatio: '9:16',
      modelTier: 'veo-3.1-lite-generate',
      includeBackgroundMusic: true,
      bgMusicTrack: 'EMIN & JONY — «Камин» (Fireplace)',
      status: 'completed',
      progress: 100,
      currentStepMessage: 'Google Veo 3.1 video muvaffaqiyatli tayyorlandi!',
      videoUrl: 'https://n6ogfqlb21.ufs.sh/f/e4WrEcObdaG3xQRkL5D1FbQuz7SaXsDfAioc3JZvk59ORCG4',
      downloadUrl: 'https://n6ogfqlb21.ufs.sh/f/e4WrEcObdaG3xQRkL5D1FbQuz7SaXsDfAioc3JZvk59ORCG4',
      totalDurationSeconds: 16,
      scenes: [
        {
          sceneIndex: 1,
          actTitle: '1-Sahna: Shubhali Koʻz Qarash (Xiyonat Alomati)',
          emotion: 'Shubha, xiyonat alomati va keskin sukunat',
          tensionLevel: 8,
          durationSeconds: 5,
          cinematicPrompt: 'Dramatic vertical 9:16 slow motion close-up, tears in eyes...',
          dialogueScript: 'Sen meni aldayotgan eding... Yolgʻonmidi?',
          caption: 'Har bir soʻzing yolgʻonmidi?',
          karaokeSubtitles: [
            { word: 'Sen', startSec: 0.2, endSec: 0.8 },
            { word: 'meni', startSec: 0.9, endSec: 1.5 },
            { word: 'aldayotgan', startSec: 1.6, endSec: 2.7 },
            { word: 'eding...', startSec: 2.8, endSec: 3.5 },
            { word: 'Yolgʻonmidi?', startSec: 3.6, endSec: 4.8 },
          ],
        },
        {
          sceneIndex: 2,
          actTitle: '2-Sahna: Koʻz Yoshlar & Keskin Kulminatsiya',
          emotion: 'Yurak ezilishi, yuzdagi koʻz yosh va dramatik burilish',
          tensionLevel: 10,
          durationSeconds: 6,
          cinematicPrompt: 'Extreme emotional vertical 9:16 portrait, a single tear falling down a cheek...',
          dialogueScript: 'Endi kech! Qaytish yoʻli yoʻq, kechirmayman!',
          caption: 'Endi kech! Qaytish yoʻli yoʻq...',
          karaokeSubtitles: [
            { word: 'Endi', startSec: 0.2, endSec: 0.9 },
            { word: 'kech!', startSec: 1.0, endSec: 1.7 },
            { word: 'Qaytish', startSec: 1.8, endSec: 2.7 },
            { word: 'yoʻli', startSec: 2.8, endSec: 3.4 },
            { word: 'yoʻq,', startSec: 3.5, endSec: 4.3 },
            { word: 'kechirmayman!', startSec: 4.4, endSec: 5.8 },
          ],
        },
        {
          sceneIndex: 3,
          actTitle: '3-Sahna: Gʻolibona Najot & Mahsulotning Qahramonlik Kadri',
          emotion: 'Gʻalaba, qatʼiyat va oliy darajadagi gʻoliblik',
          tensionLevel: 9,
          durationSeconds: 5,
          cinematicPrompt: 'Cinematic vertical 9:16 golden hour lighting, wiping away the tear, triumphant resolution...',
          dialogueScript: 'Men oʻzimga munosibini tanladim. Endi faqat eng yaxshisi!',
          caption: 'Men oʻzimga munosibini tanladim!',
          karaokeSubtitles: [
            { word: 'Men', startSec: 0.2, endSec: 0.8 },
            { word: 'oʻzimga', startSec: 0.9, endSec: 1.7 },
            { word: 'munosibini', startSec: 1.8, endSec: 2.9 },
            { word: 'tanladim.', startSec: 3.0, endSec: 3.8 },
            { word: 'Eng', startSec: 3.9, endSec: 4.3 },
            { word: 'yaxshisi!', startSec: 4.4, endSec: 4.9 },
          ],
        },
      ],
      karaokeTimeline: [
        { word: 'Sen', startSec: 0.2, endSec: 0.8 },
        { word: 'meni', startSec: 0.9, endSec: 1.5 },
        { word: 'aldayotgan', startSec: 1.6, endSec: 2.7 },
        { word: 'eding...', startSec: 2.8, endSec: 3.5 },
        { word: 'Yolgʻonmidi?', startSec: 3.6, endSec: 4.8 },
        { word: 'Endi', startSec: 5.2, endSec: 5.9 },
        { word: 'kech!', startSec: 6.0, endSec: 6.7 },
        { word: 'Qaytish', startSec: 6.8, endSec: 7.7 },
        { word: 'yoʻli', startSec: 7.8, endSec: 8.4 },
        { word: 'yoʻq,', startSec: 8.5, endSec: 9.3 },
        { word: 'kechirmayman!', startSec: 9.4, endSec: 10.8 },
        { word: 'Men', startSec: 11.2, endSec: 11.8 },
        { word: 'oʻzimga', startSec: 11.9, endSec: 12.7 },
        { word: 'munosibini', startSec: 12.8, endSec: 13.9 },
        { word: 'tanladim.', startSec: 14.0, endSec: 14.8 },
        { word: 'Eng', startSec: 14.9, endSec: 15.3 },
        { word: 'yaxshisi!', startSec: 15.4, endSec: 15.9 },
      ],
    };
  },
};

