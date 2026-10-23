import { User, AiAvatar, Product, VideoJob, PlanConfig, DramaScene } from '../types';

const API_BASE = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://localhost:4000/api'
  : (process.env.NEXT_PUBLIC_API_URL || '/api');

export const fallbackAvatars: AiAvatar[] = [];

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
    features: ['10 ta HD video', 'CapCut professional muharrir', '9:16 formati', 'Subtitrlar bilan'],
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

    // 1. Try primary API_BASE
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: {
          ...getAuthHeaders(),
        },
      });
      if (res.ok) {
        const user = await res.json();
        try {
          localStorage.setItem('tasvir_user', JSON.stringify(user));
        } catch {}
        return user;
      }
    } catch (e) {
      console.warn('API getMe primary fallback');
    }

    // 2. Try Next.js local route fallback (/api/auth/me) which connects to Neon PostgreSQL
    try {
      const res = await fetch('/api/auth/me', {
        headers: {
          ...getAuthHeaders(),
        },
      });
      if (res.ok) {
        const user = await res.json();
        try {
          localStorage.setItem('tasvir_user', JSON.stringify(user));
        } catch {}
        return user;
      }
    } catch (e) {}

    // 3. Last resort from localStorage
    try {
      const saved = localStorage.getItem('tasvir_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed;
      }
    } catch {}

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
    if (!payload?.turnstileToken) {
      throw new Error('Cloudflare Turnstile tekshiruvidan oʻtish shart');
    }

    const saveSession = (user: User, token: string) => {
      this.setToken(token);
      try {
        localStorage.setItem('tasvir_user', JSON.stringify(user));
      } catch {}
    };

    // 1. Try primary API_BASE
    try {
      const res = await fetch(`${API_BASE}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        if (data?.token && data?.user) {
          saveSession(data.user, data.token);
        }
        return data;
      }
      const errData = await res.json().catch(() => null);
      if (res.status === 400 || res.status === 401) {
        throw new Error(errData?.message || 'Google autentifikatsiyasida xatolik');
      }
    } catch (primaryErr: any) {
      if (primaryErr?.message && !primaryErr.message.includes('fetch') && !primaryErr.message.includes('NetworkError')) {
        throw primaryErr;
      }
    }

    // 2. Try Next.js local API route fallback (/api/auth/google)
    try {
      const fallbackRes = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (fallbackRes.ok) {
        const data = await fallbackRes.json();
        if (data?.token && data?.user) {
          saveSession(data.user, data.token);
        }
        return data;
      }
      const fbErr = await fallbackRes.json().catch(() => null);
      if (fallbackRes.status === 400 || fallbackRes.status === 401) {
        throw new Error(fbErr?.message || 'Google autentifikatsiyasida xatolik');
      }
    } catch (fbErr: any) {
      if (fbErr?.message && !fbErr.message.includes('fetch') && !fbErr.message.includes('NetworkError')) {
        throw fbErr;
      }
    }

    throw new Error('Server bilan ulanishda xatolik. Qaytadan urinib koʻring.');
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
        email: 'user@example.com',
        full_name: 'Tasvir Foydalanuvchisi',
        telegram_id: null,
        locale: 'uz',
        plan_tier: 'starter',
        credits_balance: 0,
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
    const res = await fetch(`${API_BASE}/video-jobs/${jobId}`, {
      headers: {
        ...getAuthHeaders(),
      },
    });
    if (res.ok) return await res.json();
    const err = await res.json().catch(() => null);
    throw new Error(err?.message || `Video vazifasini yuklab boʻlmadi (HTTP ${res.status})`);
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
    targetEmail?: string;
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

  async planScenesFromPrompt(params: {
    prompt: string;
    dramaLevel?: string;
  }): Promise<{ prompt: string; scenes: DramaScene[]; totalDurationSeconds: number }> {
    const res = await fetch(`${API_BASE}/generate-video/plan-scenes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(params),
    });

    if (res.ok) {
      return await res.json();
    }

    const err = await res.json().catch(() => null);
    if (res.status === 401) {
      throw new Error(err?.message || 'Ssenariy yaratish uchun avval tizimga kiring (Google hisobingiz orqali)');
    }
    throw new Error(err?.message || 'AI ssenariy yaratishda xatolik yuz berdi');
  },

  async generateVideoFromPrompt(params: {
    prompt: string;
    scenes?: DramaScene[];
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
        aspectRatio: '9:16',
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
    const res = await fetch(`${API_BASE}/generate-video/${jobId}`, {
      headers: {
        ...getAuthHeaders(),
      },
      cache: 'no-store',
    });
    if (res.ok) return await res.json();
    const err = await res.json().catch(() => null);
    throw new Error(err?.message || `Video holatini olishda xatolik yuz berdi (HTTP ${res.status})`);
  },
};
