import { Injectable, BadRequestException, NotFoundException, Logger, Inject } from '@nestjs/common';
import { KyselyService } from '../database/kysely.service';
import { sql } from 'kysely';
import { VideoJob, AiAvatar } from '../database/schema';

@Injectable()
export class VideoJobsService {
  private readonly logger = new Logger(VideoJobsService.name);

  constructor(@Inject(KyselyService) private readonly db: KyselyService) {}

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
    const job = await this.db.transaction().execute(async (trx) => {
      // 1. Lock user row and verify available credits
      const user = await trx
        .selectFrom('users')
        .select(['id', 'credits_balance'])
        .where('id', '=', dto.userId)
        .forUpdate()
        .executeTakeFirst();

      if (!user || user.credits_balance <= 0) {
        throw new BadRequestException('Kreditlar yetarli emas. Hisobni toʻldiring.');
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
          platform_preset: dto.platformPreset || 'uzum_9_16',
          script_tone: dto.scriptTone || 'discount_hook',
          script_text: dto.scriptText,
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
        outputUrl: 'https://assets.mixkit.co/videos/preview/mixkit-vertical-fashion-model-showing-her-shoes-42795-large.mp4',
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

  async getJobById(jobId: string): Promise<VideoJob> {
    const job = await this.db
      .selectFrom('video_jobs')
      .selectAll()
      .where('id', '=', jobId)
      .executeTakeFirst();

    if (!job) {
      throw new NotFoundException(`Video vazifasi topilmadi: ${jobId}`);
    }

    return job;
  }

  async listUserJobs(userId?: string): Promise<VideoJob[]> {
    if (userId) {
      return await this.db
        .selectFrom('video_jobs')
        .selectAll()
        .where('user_id', '=', userId)
        .orderBy('created_at', 'desc')
        .execute();
    }

    return await this.db
      .selectFrom('video_jobs')
      .selectAll()
      .orderBy('created_at', 'desc')
      .limit(20)
      .execute();
  }

  async generateAiScript(params: {
    productTitle: string;
    category?: string;
    priceUzs?: number;
    tone: 'discount_hook' | 'quality_review' | 'short_reels';
    dialect?: string;
  }): Promise<{ scriptText: string; estimatedDurationSeconds: number; hooks: string[] }> {
    const title = params.productTitle || 'Mahsulot';
    const priceFormatted = params.priceUzs
      ? `${Number(params.priceUzs).toLocaleString('uz-UZ')} so'm`
      : 'maxsus narxda';

    let script = '';
    let hooks: string[] = [];

    if (params.tone === 'discount_hook') {
      hooks = [
        `Hozirroq ko'ring! Uzum Marketda ushbu ${title} atigi ${priceFormatted}!`,
        `Qimmat sotib olishga shoshilmang! ${title} endi katta chegirmada!`,
        `Ushbu taklif faqat 24 soat amal qiladi: ${title} — ${priceFormatted}!`,
      ];
      script = `Salom! Uzum Marketda ulgurib qoling! Aynan bugun mashhur "${title}" atigi ${priceFormatted} bo'lib turibdi. Sifati a'lo darajada, yetkazib berish esa 1 kunda bepul! Buyurtma berish uchun quyidagi havolani bosing va 30% chegirmadan foydalaning!`;
    } else if (params.tone === 'quality_review') {
      hooks = [
        `Haqiqatdan ham shunchalik yaxshimi? ${title} haqida xolis sharh!`,
        `Men bu ${title}ni 1 oydan beri ishlataman va natijasi hayratlanarli!`,
        `Sifatli brend qidiryapsizmi? Mana bu ${title} siz uchun ayni muddao!`,
      ];
      script = `Assalomu alaykum! Ko'pchilik so'ragan "${title}" qo'limizga yetib keldi. Materiali juda pishiq, qo'lda ushlaganda premium seziladi. Narxi ${priceFormatted}. O'zimiz sinovdan o'tkazdik — tavsiya qilamiz! Profilga o'tib, buyurtma qilishingiz mumkin.`;
    } else {
      // short_reels
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
    return {
      audioUrl: `/api/video-jobs/audio-mock/${avatarId}`,
      duration: 12.4,
      format: 'audio/mp3',
    };
  }
}
