import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Logger,
  Inject,
} from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';
import { KyselyService } from '../database/kysely.service';
import { sql } from 'kysely';
import { VideoJob, AiAvatar } from '../database/schema';

const ALLOWED_PRESETS = new Set(['uzum_9_16', 'instagram_reels', 'telegram_ad']);
const ALLOWED_TONES = new Set(['discount_hook', 'quality_review', 'short_reels']);

@Injectable()
export class VideoJobsService {
  private readonly logger = new Logger(VideoJobsService.name);

  constructor(@Inject(KyselyService) private readonly db: KyselyService) {}

  private getGeminiClient(): { client: GoogleGenAI; activeKey: string } | null {
    const rawKey =
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      process.env.GOOGLE_GENAI_API_KEY ||
      process.env.GEMINI_SECRET_KEY;
    const activeKey =
      rawKey && rawKey !== 'YOUR_API_KEY_HERE' ? rawKey.trim() : '';

    if (!activeKey) return null;
    return {
      client: new GoogleGenAI({ apiKey: activeKey }),
      activeKey,
    };
  }

  async getAvatars(): Promise<AiAvatar[]> {
    return await this.db
      .selectFrom('ai_avatars')
      .selectAll()
      .where('is_active', '=', true)
      .orderBy('display_name', 'asc')
      .execute();
  }

  async createRenderJob(dto: {
    userId: string;
    productId: string;
    avatarId: string;
    platformPreset: string;
    scriptTone: string;
    scriptText: string;
  }): Promise<VideoJob> {
    const scriptText = (dto.scriptText || '').trim().slice(0, 2000);
    if (!scriptText) {
      throw new BadRequestException('Ssenariy matni kiritilishi shart');
    }

    const platformPreset = ALLOWED_PRESETS.has(dto.platformPreset) ? dto.platformPreset : 'uzum_9_16';
    const scriptTone = ALLOWED_TONES.has(dto.scriptTone) ? dto.scriptTone : 'discount_hook';

    // Verify avatar exists and is active
    const avatar = await this.db
      .selectFrom('ai_avatars')
      .select(['id', 'is_active'])
      .where('id', '=', dto.avatarId)
      .executeTakeFirst();

    if (!avatar || !avatar.is_active) {
      throw new BadRequestException('Tanlangan AI boshlovchi mavjud emas yoki faol emas');
    }

    const job = await this.db.transaction().execute(async (trx) => {
      // 1. Lock user row and verify available credits (prevents race conditions)
      const user = await trx
        .selectFrom('users')
        .select(['id', 'credits_balance'])
        .where('id', '=', dto.userId)
        .forUpdate()
        .executeTakeFirst();

      if (!user) {
        throw new NotFoundException('Foydalanuvchi hisobi topilmadi');
      }

      if (user.credits_balance <= 0) {
        throw new BadRequestException('Kreditlar yetarli emas. Iltimos, hisobingizni toʻldiring.');
      }

      // 2. Deduct 1 credit atomically
      await trx
        .updateTable('users')
        .set({
          credits_balance: sql`credits_balance - 1`,
          updated_at: sql`now()`,
        })
        .where('id', '=', dto.userId)
        .execute();

      // 3. Insert the video generation job
      const createdJob = await trx
        .insertInto('video_jobs')
        .values({
          user_id: dto.userId,
          product_id: dto.productId,
          avatar_id: dto.avatarId,
          platform_preset: platformPreset,
          script_tone: scriptTone,
          script_text: scriptText,
          status: 'queued',
          progress_percent: 0,
          credits_charged: 1,
          audio_preview_url: `/api/video-jobs/audio-mock/${dto.avatarId}`,
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      return createdJob;
    });

    // Asynchronously kick off rendering state machine simulation
    this.processJobAsync(job.id).catch((err) => {
      this.logger.error(`Error processing job ${job.id}: ${err.message}`);
    });

    return job;
  }

  private async processJobAsync(jobId: string) {
    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    const steps = [
      { status: 'analyzing', progress: 25, delay: 1800 },
      { status: 'synthesizing_voice', progress: 55, delay: 2400 },
      { status: 'lip_syncing', progress: 85, delay: 2800 },
      {
        status: 'completed',
        progress: 100,
        delay: 1500,
        outputUrl: '/videos/tasvir-vertical.mp4',
      },
    ];

    for (const step of steps) {
      await sleep(step.delay);
      await this.db
        .updateTable('video_jobs')
        .set({
          status: step.status,
          progress_percent: step.progress,
          ...(step.outputUrl ? { output_video_url: step.outputUrl, completed_at: sql`now()` } : {}),
        })
        .where('id', '=', jobId)
        .execute();
    }
  }

  async getJobById(jobId: string, currentUserId?: string): Promise<VideoJob> {
    const job = await this.db
      .selectFrom('video_jobs')
      .selectAll()
      .where('id', '=', jobId)
      .executeTakeFirst();

    if (!job) {
      throw new NotFoundException(`Video vazifasi topilmadi: ${jobId}`);
    }

    // Access control: only the job owner may inspect job details
    if (currentUserId && job.user_id !== currentUserId) {
      throw new ForbiddenException('Ushbu video vazifasiga kirish huquqingiz yoʻq');
    }

    return job;
  }

  async listUserJobs(userId: string): Promise<VideoJob[]> {
    return await this.db
      .selectFrom('video_jobs')
      .selectAll()
      .where('user_id', '=', userId)
      .orderBy('created_at', 'desc')
      .execute();
  }

  async generateAiScript(params: {
    productTitle: string;
    category?: string;
    priceUzs?: number;
    tone: 'discount_hook' | 'quality_review' | 'short_reels';
    dialect?: string;
  }): Promise<{ scriptText: string; estimatedDurationSeconds: number; hooks: string[] }> {
    const title = (params.productTitle || 'Mahsulot').trim().slice(0, 160);
    const validPrice = Math.max(0, Math.min(Number(params.priceUzs) || 0, 100_000_000_000));
    const priceFormatted = validPrice > 0
      ? `${validPrice.toLocaleString('uz-UZ')} so'm`
      : 'maxsus narxda';

    const tone = ALLOWED_TONES.has(params.tone) ? params.tone : 'discount_hook';
    const gemini = this.getGeminiClient();

    // Try Google Gemini 2.5 Flash if available
    if (gemini) {
      try {
        const toneDesc =
          tone === 'discount_hook'
            ? 'katta chegirma va shoshilinch taklif'
            : tone === 'quality_review'
            ? 'yuqori sifat, xolis sharh va ishonch'
            : 'yoshlarbop, qisqa dinamik trend reels';

        const prompt = `Siz O'zbekiston e-commerce bozori (Uzum Market, Instagram Reels) uchun eng kuchli reklama mutaxassisisiz.
Mahsulot: "${title}"
Kategoriya: "${params.category || 'Umumiy'}"
Narx: ${priceFormatted}
Uslub (tone): ${toneDesc}
Sheva: ${params.dialect || 'Adabiy oʻzbek'}

Iltimos, ushbu mahsulot uchun 15 soniyalik sotuvchi reklama matni va 3 ta diqqatni tortuvchi hook yarating.
Javobni FAQAT toza JSON formatida bering:
{
  "scriptText": "15 soniyalik video uchun to'liq reklama matni...",
  "hooks": ["1-hook...", "2-hook...", "3-hook..."]
}`;

        const res: any = await gemini.client.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.7,
          },
        });

        if (res && res.text) {
          const parsed = JSON.parse(res.text.replace(/```json|```/g, '').trim());
          if (parsed.scriptText && Array.isArray(parsed.hooks) && parsed.hooks.length > 0) {
            this.logger.log(`Generated AI script via Google Gemini for product: "${title}"`);
            return {
              scriptText: parsed.scriptText,
              estimatedDurationSeconds: 15,
              hooks: parsed.hooks,
            };
          }
        }
      } catch (geminiErr: any) {
        this.logger.warn(`Google Gemini script generation fallback: ${geminiErr.message}`);
      }
    }

    // High fidelity fallback templates
    let script = '';
    let hooks: string[] = [];

    if (tone === 'discount_hook') {
      hooks = [
        `Hozirroq ko'ring! Uzum Marketda ushbu ${title} atigi ${priceFormatted}!`,
        `Qimmat sotib olishga shoshilmang! ${title} endi katta chegirmada!`,
        `Ushbu taklif faqat 24 soat amal qiladi: ${title} — ${priceFormatted}!`,
      ];
      script = `Salom! Uzum Marketda ulgurib qoling! Aynan bugun mashhur "${title}" atigi ${priceFormatted} bo'lib turibdi. Sifati a'lo darajada, yetkazib berish esa 1 kunda bepul! Buyurtma berish uchun quyidagi havolani bosing va 30% chegirmadan foydalaning!`;
    } else if (tone === 'quality_review') {
      hooks = [
        `Haqiqatdan ham shunchalik yaxshimi? ${title} haqida xolis sharh!`,
        `Men bu ${title}ni 1 oydan beri ishlataman va natijasi hayratlanarli!`,
        `Sifatli brend qidiryapsizmi? Mana bu ${title} siz uchun ayni muddao!`,
      ];
      script = `Assalomu alaykum! Ko'pchilik so'ragan "${title}" qo'limizga yetib keldi. Materiali juda pishiq, qo'lda ushlaganda premium seziladi. Narxi ${priceFormatted}. O'zimiz sinovdan o'tkazdik — tavsiya qilamiz! Profilga o'tib, buyurtma qilishingiz mumkin.`;
    } else {
      hooks = [
        `Do'stlaringizga ham yuboring! ${title} yangi trendda! 🔥`,
        `Trenddagi ${title} — endi O'zbekistonda! ⚡`,
        `Buni ko'rmagan bo'lsangiz afsuslanasiz: ${title}! 🚀`,
      ];
      script = `Tezda ko'ring! Trenddagi "${title}" atigi ${priceFormatted}! Qulay, zamonaviy va arzon. Cheklangan miqdorda qoldi! Link bio-da yoki Telegram do'konimizda. Hoziroq ulguring!`;
    }

    return {
      scriptText: script,
      estimatedDurationSeconds: 15,
      hooks,
    };
  }

  async getTtsAudioPreview(avatarId: string, text?: string): Promise<{ audioUrl: string; duration: number; format: string }> {
    const safeText = (text || '').slice(0, 2000);
    return {
      audioUrl: `/api/video-jobs/audio-mock/${avatarId}`,
      duration: Math.min(60, Math.max(3, Math.round(safeText.length * 0.08) || 12)),
      format: 'audio/wav',
    };
  }
}
