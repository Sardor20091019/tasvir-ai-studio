import { Injectable, Logger, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';
import { sql } from 'kysely';
import * as crypto from 'crypto';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { KyselyService } from '../database/kysely.service';
import { UploadThingService } from '../storage/uploadthing.service';
import { FfmpegConcatService } from './ffmpeg-concat.service';
import {
  AspectRatioType,
  DramaScene,
  DramaVideoGenerationJob,
  KaraokeWord,
} from './generate-video.types';
import { AI_STORY_CINEMATIC_DIRECTOR_SYSTEM_PROMPT } from './ai-story-director.prompt';

export {
  AspectRatioType,
  DramaScene,
  DramaVideoGenerationJob,
  KaraokeWord,
};

@Injectable()
export class GenerateVideoService {
  private readonly logger = new Logger(GenerateVideoService.name);
  private jobs = new Map<string, DramaVideoGenerationJob>();

  constructor(
    @Inject(UploadThingService) private readonly uploadThingService: UploadThingService,
    @Inject(FfmpegConcatService) private readonly ffmpegConcatService: FfmpegConcatService,
    @Inject(KyselyService) private readonly kyselyService: KyselyService,
  ) {}

  private getGeminiClient(): { client: GoogleGenAI; activeKey: string } {
    const rawKey =
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      process.env.GOOGLE_GENAI_API_KEY ||
      process.env.GEMINI_SECRET_KEY;
    const activeKey =
      rawKey && rawKey !== 'YOUR_API_KEY_HERE' ? rawKey.trim() : '';

    return {
      client: new GoogleGenAI({ apiKey: activeKey }),
      activeKey,
    };
  }

  private getOpenAIKey(): string {
    const rawKey = process.env.OPENAI_API_KEY || process.env.OPENAI_KEY;
    return rawKey && rawKey.trim() !== '' && rawKey !== 'YOUR_API_KEY_HERE' ? rawKey.trim() : '';
  }

  async planScenes(params: {
    prompt: string;
    productImageUrl?: string;
    imageUrl?: string;
    dramaLevel?: string;
    locale?: string;
  }): Promise<{ prompt: string; scenes: DramaScene[]; totalDurationSeconds: number }> {
    const { client, activeKey } = this.getGeminiClient();
    const openaiKey = this.getOpenAIKey();

    if (!activeKey && !openaiKey) {
      throw new BadRequestException(
        'AI ssenariyni yaratish uchun serverda OPENAI_API_KEY yoki GEMINI_API_KEY sozlanishi shart.',
      );
    }

    const productImg = params.productImageUrl || params.imageUrl;
    const scenes = await this.generateDramaScenesWithLLM(
      client,
      activeKey,
      params.prompt,
      productImg,
      params.locale || 'uz',
    );
    const totalDurationSeconds = scenes.reduce((acc, s) => acc + s.durationSeconds, 0);

    return {
      prompt: params.prompt,
      scenes,
      totalDurationSeconds,
    };
  }

  async startGeneration(params: {
    userId?: string;
    prompt: string;
    productImageUrl?: string;
    imageUrl?: string;
    scenes?: DramaScene[];
    aspectRatio?: AspectRatioType;
    resolution?: string;
    includeBackgroundMusic?: boolean;
    dramaLevel?: string;
    locale?: string;
  }): Promise<{
    jobId: string;
    status: string;
    progress: number;
    message: string;
    model: string;
    remainingCredits?: number;
  }> {
    const jobId = `drama_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const aspectRatio: AspectRatioType = '9:16';
    const resolution = params.resolution || process.env.GEMINI_VIDEO_RESOLUTION || '360p';
    const modelTier = process.env.GEMINI_VIDEO_MODEL || 'gemini-omni-1.1-flash';
    const includeBackgroundMusic = params.includeBackgroundMusic === true;
    const productImageUrl = params.productImageUrl || params.imageUrl;

    let userRemainingCredits: number | undefined;
    let dbJobId: string | undefined;

    if (params.userId) {
      const dbResult = await this.kyselyService.db.transaction().execute(async (trx) => {
        const dbUser = await trx
          .selectFrom('users')
          .select(['id', 'credits_balance'])
          .where('id', '=', params.userId!)
          .forUpdate()
          .executeTakeFirst();

        if (!dbUser) {
          throw new NotFoundException('Foydalanuvchi hisobi topilmadi');
        }

        if (dbUser.credits_balance <= 0) {
          const errMsg =
            params.locale === 'en'
              ? 'Insufficient video tokens. Please request credits from the administrator.'
              : params.locale === 'ru'
              ? 'Недостаточно токенов для создания видео. Пожалуйста, пополните баланс.'
              : 'Video yaratish uchun hisobingizda tokenlar yetarli emas. Iltimos, administrator orqali token soʻrang.';
          throw new BadRequestException(errMsg);
        }

        const newBalance = dbUser.credits_balance - 1;

        await trx
          .updateTable('users')
          .set({
            credits_balance: newBalance,
            updated_at: sql`now()`,
          })
          .where('id', '=', params.userId!)
          .execute();

        const inserted = await trx
          .insertInto('video_jobs')
          .values({
            user_id: params.userId!,
            product_id: null,
            platform_preset: 'uzum_9_16',
            script_tone: 'gemini_omni',
            script_text: params.prompt.trim().slice(0, 2000),
            status: 'queued',
            progress_percent: 5,
            credits_charged: 1,
            audio_preview_url: null,
            output_video_url: null,
          })
          .returning(['id'])
          .executeTakeFirst();

        return { newBalance, dbJobId: inserted?.id };
      });

      userRemainingCredits = dbResult.newBalance;
      dbJobId = dbResult.dbJobId;
      this.logger.log(`Charged 1 credit from user ${params.userId}. Remaining tokens: ${userRemainingCredits}`);
    }

    const initialScenes = Array.isArray(params.scenes) && params.scenes.length > 0 ? params.scenes : [];
    const totalDurationSeconds = initialScenes.length > 0
      ? initialScenes.reduce((acc, s) => acc + s.durationSeconds, 0)
      : 24;

    const job: DramaVideoGenerationJob = {
      jobId,
      userId: params.userId,
      dbJobId,
      prompt: params.prompt,
      productImageUrl,
      aspectRatio,
      resolution,
      modelTier,
      includeBackgroundMusic,
      bgMusicTrack: '',
      status: 'queued',
      progress: 5,
      currentStepMessage: `${modelTier} (${resolution}) video generatsiyasi navbatga qoʻyildi...`,
      scenes: initialScenes,
      totalDurationSeconds,
      locale: params.locale || 'uz',
      createdAt: new Date().toISOString(),
    };

    this.jobs.set(jobId, job);
    this.logger.log(
      `Created video job ${jobId} (Model: ${modelTier}, Resolution: ${resolution}, 9:16, Music: ${includeBackgroundMusic ? 'ON' : 'OFF'}, Pre-confirmed scenes: ${initialScenes.length})`,
    );

    this.processJobAsync(jobId).catch(async (err) => {
      this.logger.error(`Error in drama generation job ${jobId}: ${err.message}`, err.stack);
      const current = this.jobs.get(jobId);
      if (current) {
        current.status = 'failed';
        current.error = err.message;
      }
      if (params.userId) {
        try {
          await this.kyselyService.db.transaction().execute(async (trx) => {
            await trx
              .updateTable('users')
              .set({
                credits_balance: sql`credits_balance + 1`,
                updated_at: sql`now()`,
              })
              .where('id', '=', params.userId!)
              .execute();

            if (dbJobId) {
              await trx
                .updateTable('video_jobs')
                .set({
                  status: 'failed',
                  error_message: err.message,
                  completed_at: sql`now()`,
                })
                .where('id', '=', dbJobId)
                .execute();
            }
          });
          this.logger.log(`Refunded 1 credit to user ${params.userId} due to generation failure.`);
        } catch (refundErr: any) {
          this.logger.error(`Failed to refund credit: ${refundErr.message}`);
        }
      }
    });

    return {
      jobId,
      status: job.status,
      progress: job.progress,
      message: `${modelTier} (${resolution}) video generatsiyasi boshlandi`,
      model: modelTier,
      remainingCredits: userRemainingCredits,
    };
  }

  getJob(jobId: string): DramaVideoGenerationJob {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new NotFoundException(`Video vazifasi topilmadi: ${jobId}`);
    }
    return job;
  }

  private async processJobAsync(jobId: string) {
    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
    const job = this.jobs.get(jobId);
    if (!job) return;

    const { client, activeKey } = this.getGeminiClient();

    let scenes = job.scenes;
    if (!scenes || scenes.length === 0) {
      job.status = 'framing_drama_scenes';
      job.progress = 20;
      job.currentStepMessage = ' LLM tizimi ssenariyni keskin emotsional sahnalarga ajratmoqda...';

      scenes = await this.generateDramaScenesWithLLM(
        client,
        activeKey,
        job.prompt,
        job.productImageUrl,
        job.locale || 'uz',
      );
      job.scenes = scenes;
    }

    let accumulatedTime = 0;
    const masterKaraokeTimeline: KaraokeWord[] = [];

    scenes.forEach((scene, idx) => {
      if (!scene.karaokeSubtitles || scene.karaokeSubtitles.length === 0) {
        scene.karaokeSubtitles = this.generateFallbackKaraoke(
          scene.dialogueScript || scene.caption || `Sahna ${idx + 1}`,
          scene.durationSeconds,
        );
      }
      scene.karaokeSubtitles.forEach((kw: KaraokeWord) => {
        masterKaraokeTimeline.push({
          word: kw.word,
          startSec: Number((accumulatedTime + kw.startSec).toFixed(2)),
          endSec: Number((accumulatedTime + kw.endSec).toFixed(2)),
        });
      });
      accumulatedTime += scene.durationSeconds;
    });

    job.totalDurationSeconds = accumulatedTime;
    job.karaokeTimeline = masterKaraokeTimeline;
    job.progress = 35;
    const targetResolution = job.resolution || process.env.GEMINI_VIDEO_RESOLUTION || '360p';

    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), `tasvir-ai-${jobId}-`));
    const generatedClipPaths: string[] = [];

    // Ensure public output directory exists for scene images and master videos
    const candidates = [
      path.resolve(process.cwd(), 'apps/web/public/generated-videos'),
      path.resolve(process.cwd(), '../web/public/generated-videos'),
      path.resolve(process.cwd(), 'public/generated-videos'),
    ];
    let publicDir = candidates[0];
    for (const c of candidates) {
      if (fs.existsSync(path.dirname(c))) {
        publicDir = c;
        break;
      }
    }
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    // PHASE 1: Generate high-quality 9:16 vertical AI images for each scene
    job.status = 'generating_ai_images';
    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      const sceneDuration = Math.max(3, Math.min(scene.durationSeconds, 8));
      scene.durationSeconds = sceneDuration;

      job.currentStepMessage = `AI tasvir yaratilmoqda: Sahna ${i + 1}/${scenes.length} ("${scene.actTitle}")...`;
      job.progress = 35 + Math.floor((i / scenes.length) * 35);

      const imgFilename = `img_${jobId}_scene_${scene.sceneIndex}.jpg`;
      const publicImgPath = path.join(publicDir, imgFilename);

      await this.generateImageForScene({
        scene,
        sceneIndex: scene.sceneIndex,
        totalScenes: scenes.length,
        outputPath: publicImgPath,
        productImageUrl: job.productImageUrl,
        resolution: targetResolution,
      });

      scene.localImagePath = publicImgPath;
      scene.imageUrl = `/generated-videos/${imgFilename}`;
      this.logger.log(`Scene ${scene.sceneIndex} image ready: ${scene.imageUrl}`);
    }

    // PHASE 2: Convert images into dynamic vertical 9:16 video clips with FFmpeg
    job.status = 'rendering_scene_clips';
    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      job.currentStepMessage = `Sahna klipi shakllantirilmoqda: Sahna ${i + 1}/${scenes.length}...`;
      job.progress = 70 + Math.floor((i / scenes.length) * 10);

      const clipOutputPath = path.join(tempDir, `scene_${scene.sceneIndex}.mp4`);
      await this.ffmpegConcatService.convertImageToSceneClip({
        imagePath: scene.localImagePath || path.join(publicDir, `img_${jobId}_scene_${scene.sceneIndex}.jpg`),
        outputPath: clipOutputPath,
        durationSeconds: scene.durationSeconds,
        sceneIndex: scene.sceneIndex,
        caption: scene.caption || scene.dialogueScript,
        resolution: targetResolution,
      });

      scene.localClipPath = clipOutputPath;
      generatedClipPaths.push(clipOutputPath);
    }

    if (generatedClipPaths.length === 0) {
      throw new Error('Hech qanday sahna kadrlarini shakllantirib boʻlmadi');
    }

    // PHASE 3: Concatenate scenes and blend background music
    job.status = 'concatenating_master_video';
    job.progress = 80;
    job.currentStepMessage = `Sahnalar va ovoz yoʻlagi birlashtirilmoqda (${targetResolution})...`;

    const masterOutputPath = path.join(tempDir, `master_drama_${jobId}.mp4`);
    await this.ffmpegConcatService.concatScenes({
      sceneClipPaths: generatedClipPaths,
      outputPath: masterOutputPath,
      includeBackgroundMusic: job.includeBackgroundMusic,
      totalDurationSeconds: job.totalDurationSeconds,
      resolution: targetResolution,
    });

    // PHASE 4: Save master video locally and cloud
    job.progress = 90;
    job.status = 'saving_to_cloud';
    job.currentStepMessage = 'Master video saqlanmoqda...';

    let finalCdnUrl: string | null = null;
    try {
      const videoBuffer = fs.readFileSync(masterOutputPath);
      finalCdnUrl = await this.uploadThingService.uploadVideo(
        videoBuffer,
        `tasvir-ai-video-${jobId}.mp4`,
      );
      if (finalCdnUrl) {
        this.logger.log(`Master video uploaded to UploadThing CDN: ${finalCdnUrl}`);
      }
    } catch (uploadErr: any) {
      this.logger.warn(`UploadThing upload notice: ${uploadErr.message}`);
    }

    const localFilename = `tasvir-ai-video-${jobId}.mp4`;
    const localDestPath = path.join(publicDir, localFilename);
    try {
      fs.copyFileSync(masterOutputPath, localDestPath);
      if (!finalCdnUrl) {
        finalCdnUrl = `/generated-videos/${localFilename}`;
      }
      this.logger.log(`Saved master video to public directory: /generated-videos/${localFilename}`);
    } catch (localSaveErr: any) {
      this.logger.error(`Failed to copy master video to public: ${localSaveErr.message}`);
    }

    if (!finalCdnUrl) {
      throw new Error('Master videoni saqlashda xatolik yuz berdi');
    }

    job.status = 'completed';
    job.progress = 100;
    job.currentStepMessage = 'AI sahna tasvirlari va 9:16 master video muvaffaqiyatli tayyorlandi!';
    job.videoUrl = finalCdnUrl;
    job.downloadUrl = finalCdnUrl;
    job.completedAt = new Date().toISOString();

    if (job.dbJobId) {
      try {
        await this.kyselyService.db
          .updateTable('video_jobs')
          .set({
            status: 'completed',
            progress_percent: 100,
            output_video_url: finalCdnUrl,
            completed_at: sql`now()`,
          })
          .where('id', '=', job.dbJobId)
          .execute();
      } catch (dbErr: any) {
        this.logger.warn(`Failed to update video_jobs table for completed job ${jobId}: ${dbErr.message}`);
      }
    }

    this.logger.log(`Job ${jobId} finished with ${scenes.length} scenes, total: ${job.totalDurationSeconds}s`);
  }

  private async generateImageForScene(params: {
    scene: DramaScene;
    sceneIndex: number;
    totalScenes: number;
    outputPath: string;
    productImageUrl?: string;
    resolution?: string;
  }): Promise<void> {
    const { scene, sceneIndex, totalScenes, outputPath, productImageUrl, resolution } = params;

    // 1. If product photo is provided and this is the final/product scene, use the product photo
    const isProductScene = Boolean(
      productImageUrl && (
        sceneIndex === totalScenes || 
        scene.actTitle.toLowerCase().includes('mahsulot') || 
        scene.cinematicPrompt.toLowerCase().includes('product')
      )
    );

    if (isProductScene && productImageUrl) {
      const productSaved = await this.saveOrDownloadImage(productImageUrl, outputPath);
      if (productSaved) {
        this.logger.log(`Used provided product image for scene ${sceneIndex}`);
        return;
      }
    }

    // Build focused cinematic image prompt from scene.cinematicPrompt
    const cleanPrompt = (scene.cinematicPrompt || scene.actTitle || 'cinematic film still')
      .replace(/[\r\n\t]+/g, ' ')
      .replace(/["'\\]/g, '')
      .trim();
    const visualPrompt = `${cleanPrompt}, 9:16 vertical orientation, cinematic film still, detailed dramatic lighting, photorealistic, 8k resolution`;

    // 2. Google Imagen 3 (via @google/genai)
    const { client, activeKey } = this.getGeminiClient();
    if (activeKey) {
      try {
        this.logger.log(`Invoking Google Imagen 3 for Scene ${sceneIndex}: "${cleanPrompt.slice(0, 60)}"...`);
        const imagenRes = await client.models.generateImages({
          model: 'imagen-3.0-generate-002',
          prompt: visualPrompt.slice(0, 480),
          config: {
            numberOfImages: 1,
            aspectRatio: '9:16',
          },
        });
        const imageBytes = imagenRes?.generatedImages?.[0]?.image?.imageBytes;
        if (imageBytes) {
          const buffer = Buffer.from(imageBytes, 'base64');
          if (buffer.length > 5000) {
            fs.writeFileSync(outputPath, buffer);
            this.logger.log(`Generated Google Imagen 3 AI image for scene ${sceneIndex} (${buffer.length} bytes)`);
            return;
          }
        }
      } catch (imagenErr: any) {
        this.logger.warn(`Google Imagen 3 notice for scene ${sceneIndex}: ${imagenErr.message}. Trying DALL-E / Pollinations.`);
      }
    }

    // 3. OpenAI DALL-E 3 (via OPENAI_API_KEY)
    const openaiKey = this.getOpenAIKey();
    if (openaiKey) {
      try {
        this.logger.log(`Invoking OpenAI DALL-E for Scene ${sceneIndex}: "${cleanPrompt.slice(0, 60)}"...`);
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 22000);
        try {
          const res = await fetch('https://api.openai.com/v1/images/generations', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${openaiKey}`,
            },
            body: JSON.stringify({
              model: 'dall-e-3',
              prompt: visualPrompt.slice(0, 950),
              n: 1,
              size: '1024x1792',
              response_format: 'b64_json',
            }),
            signal: controller.signal,
          });

          if (res.ok) {
            const data: any = await res.json();
            const b64 = data?.data?.[0]?.b64_json;
            if (b64) {
              const buffer = Buffer.from(b64, 'base64');
              fs.writeFileSync(outputPath, buffer);
              this.logger.log(`Generated OpenAI DALL-E 3 image for scene ${sceneIndex} (${buffer.length} bytes)`);
              return;
            }
          }
        } finally {
          clearTimeout(timeout);
        }
      } catch (dalleErr: any) {
        this.logger.warn(`OpenAI DALL-E notice for scene ${sceneIndex}: ${dalleErr.message}. Trying Pollinations AI.`);
      }
    }

    // 4. Pollinations AI (FLUX & Turbo vertical models)
    const seed = Math.floor(Math.random() * 999999);
    const encodedPrompt = encodeURIComponent(visualPrompt.slice(0, 350));
    const pollinationsEndpoints = [
      `https://image.pollinations.ai/prompt/${encodedPrompt}?width=720&height=1280&model=turbo&nologo=true&seed=${seed}`,
      `https://image.pollinations.ai/prompt/${encodedPrompt}?width=720&height=1280&model=flux&nologo=true&seed=${seed}`,
    ];

    for (const pollUrl of pollinationsEndpoints) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 18000);
        try {
          const res = await fetch(pollUrl, { signal: controller.signal });
          if (res.ok) {
            const buffer = Buffer.from(await res.arrayBuffer());
            if (buffer.length > 5000 && (buffer[0] === 0xff || buffer[0] === 0x89)) {
              fs.writeFileSync(outputPath, buffer);
              this.logger.log(`Generated Pollinations AI image for scene ${sceneIndex} (${buffer.length} bytes)`);
              return;
            }
          }
        } finally {
          clearTimeout(timeout);
        }
      } catch (pollErr: any) {
        this.logger.warn(`Pollinations endpoint notice for scene ${sceneIndex}: ${pollErr.message}`);
      }
    }

    // 5. Stylized Thematic Studio Canvas via FFmpeg (NEVER random stock photos)
    this.logger.log(`Creating stylized studio canvas for scene ${sceneIndex} ("${scene.actTitle}")...`);
    await this.ffmpegConcatService.createThematicSceneImage({
      outputPath,
      sceneIndex,
      actTitle: scene.actTitle,
      caption: scene.caption || scene.dialogueScript,
      tensionLevel: scene.tensionLevel,
      resolution,
    });
    this.logger.log(`Created thematic studio canvas image for scene ${sceneIndex}`);
  }

  private async saveOrDownloadImage(inputUrlOrPath: string, outputPath: string): Promise<boolean> {
    try {
      if (inputUrlOrPath.startsWith('data:image/')) {
        const base64Data = inputUrlOrPath.split(',')[1];
        if (base64Data) {
          fs.writeFileSync(outputPath, Buffer.from(base64Data, 'base64'));
          return true;
        }
      }

      if (inputUrlOrPath.startsWith('http://') || inputUrlOrPath.startsWith('https://')) {
        const res = await fetch(inputUrlOrPath);
        if (res.ok) {
          const buf = Buffer.from(await res.arrayBuffer());
          fs.writeFileSync(outputPath, buf);
          return true;
        }
      }

      const possiblePaths = [
        inputUrlOrPath,
        path.resolve(process.cwd(), 'apps/web/public', inputUrlOrPath.replace(/^\//, '')),
        path.resolve(process.cwd(), '../web/public', inputUrlOrPath.replace(/^\//, '')),
        path.resolve(process.cwd(), 'public', inputUrlOrPath.replace(/^\//, '')),
      ];

      for (const p of possiblePaths) {
        if (fs.existsSync(p) && fs.statSync(p).isFile()) {
          fs.copyFileSync(p, outputPath);
          return true;
        }
      }

      return false;
    } catch (e: any) {
      this.logger.warn(`Failed to save product image from ${inputUrlOrPath}: ${e.message}`);
      return false;
    }
  }

  private async generateDramaScenesWithLLM(
    client: GoogleGenAI,
    activeKey: string,
    userPrompt: string,
    productImageUrl?: string,
    locale: string = 'uz',
  ): Promise<DramaScene[]> {
    const cleanPrompt = userPrompt
      .replace(/[\r\n\t]+/g, ' ')
      .replace(/[<>{}\\]/g, '')
      .trim()
      .slice(0, 1000);

    const openaiKey = this.getOpenAIKey();

    if (openaiKey) {
      try {
        this.logger.log(
          `Invoking OpenAI (Story & Cinematic Director) to write story for: "${cleanPrompt.slice(0, 60)}" (Lang: ${locale}, Product Image: ${productImageUrl ? 'YES' : 'NO'})`,
        );
        const scenes = await this.generateDramaScenesWithOpenAI(openaiKey, cleanPrompt, productImageUrl, locale);
        if (scenes && scenes.length >= 2) {
          this.logger.log(`OpenAI successfully authored ${scenes.length} viral drama scenes.`);
          return scenes;
        }
      } catch (openAiErr: any) {
        this.logger.warn(`OpenAI story engine notice: ${openAiErr.message}. Falling back to Gemini story engine.`);
      }
    }

    if (activeKey) {
      return this.generateDramaScenesWithGemini(client, activeKey, cleanPrompt, productImageUrl, locale);
    }

    throw new BadRequestException(
      'AI ssenariyni yaratish uchun OPENAI_API_KEY yoki GEMINI_API_KEY serverda sozlanishi shart.',
    );
  }

  private async generateDramaScenesWithOpenAI(
    openaiKey: string,
    cleanPrompt: string,
    productImageUrl?: string,
    locale: string = 'uz',
  ): Promise<DramaScene[]> {
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    const targetLang = locale === 'ru' ? 'RUSSIAN (Русский язык)' : locale === 'en' ? 'ENGLISH' : 'UZBEK (Oʻzbek tili, Lotin yozuvida)';

    const promptText = `Create the production-ready scenario and scene plan for AI video generation based on: "${cleanPrompt}".
${
  productImageUrl
    ? 'A reference photo of the user\'s product is provided. Inspect the product image carefully: preserve its shape, packaging, label design, and colors. Craft a compelling, emotional story that organically features this product and culminates in a high-production Commercial Product Advertisement Ending (Mode F).'
    : 'If this prompt relates to a product, conclude with a high-production commercial studio advertisement ending.'
}
STRICT LANGUAGE REQUIREMENT:
All visible text for humans — including act titles (title), dialogues (dialogue), captions (caption), and emotional descriptions (emotion) — MUST be strictly written in ${targetLang}.
Do NOT mix other languages into dialogue, titles, or subtitles. Only the 'video_prompt' (the visual image generation prompt) should be written in descriptive English.

Generate as many coherent scenes as the story emotionally requires (typically 5 to 8 scenes: narrative build-up, emotional turning point, and the commercial studio finale). Return strictly valid JSON following the schema in section 11.`;

    const userContent: any[] = [{ type: 'text', text: promptText }];

    if (productImageUrl && productImageUrl.trim()) {
      userContent.push({
        type: 'image_url',
        image_url: {
          url: productImageUrl.trim(),
          detail: 'high',
        },
      });
    }

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.8, 
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: AI_STORY_CINEMATIC_DIRECTOR_SYSTEM_PROMPT },
          { role: 'user', content: userContent },
        ],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      let parsedErr: any = null;
      try {
        parsedErr = JSON.parse(errText);
      } catch {}
      const errMsg = parsedErr?.error?.message || errText;
      throw new Error(`OpenAI API (${res.status}): ${errMsg}`);
    }

    const data: any = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('OpenAI javobidan matn olib boʻlmadi');
    }

    const cleaned = content.replace(/```json|```/gi, '').trim();
    let parsed: any;
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      parsed = JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
    } else {
      parsed = JSON.parse(cleaned);
    }
    const scenesArray = Array.isArray(parsed?.scenes)
      ? parsed.scenes
      : Array.isArray(parsed?.project?.scenes)
        ? parsed.project.scenes
        : [];
    return this.validateAndFormatScenes(scenesArray, cleanPrompt);
  }

  private async generateDramaScenesWithGemini(
    client: GoogleGenAI,
    activeKey: string,
    cleanPrompt: string,
    productImageUrl?: string,
    locale: string = 'uz',
  ): Promise<DramaScene[]> {
    const targetLang = locale === 'ru' ? 'RUSSIAN (Русский язык)' : locale === 'en' ? 'ENGLISH' : 'UZBEK (Oʻzbek tili, Lotin yozuvida)';

    this.logger.log(
      `Invoking Gemini LLM for Drama Framing Engine on "${cleanPrompt}" (Lang: ${locale}, Product Image: ${productImageUrl ? 'YES' : 'NO'})`,
    );

    try {
      const parts: any[] = [
        {
          text: `${AI_STORY_CINEMATIC_DIRECTOR_SYSTEM_PROMPT}

Create the production-ready scenario and scene plan for AI video generation based on: "${cleanPrompt}".
${
  productImageUrl
    ? 'A reference photo of the user\'s product is provided. Inspect the product image carefully: preserve its shape, packaging, label design, and colors. Craft a compelling, emotional story that organically features this product and culminates in a high-production Commercial Product Advertisement Ending (Mode F).'
    : 'If this prompt relates to a product, conclude with a high-production commercial studio advertisement ending.'
}
STRICT LANGUAGE REQUIREMENT:
All visible text for humans — including act titles (title), dialogues (dialogue), captions (caption), and emotional descriptions (emotion) — MUST be strictly written in ${targetLang}.
Do NOT mix other languages into dialogue, titles, or subtitles. Only the 'video_prompt' (the visual image generation prompt) should be written in descriptive English.

Generate as many coherent scenes as the story emotionally requires (typically 5 to 8 scenes: narrative build-up, emotional turning point, and the commercial studio finale).
Respond strictly with valid JSON following the schema provided in section 11. Do NOT wrap in markdown fences.`,
        },
      ];

      if (productImageUrl && productImageUrl.startsWith('data:')) {
        const match = productImageUrl.match(/^data:([^;]+);base64,(.+)$/);
        if (match) {
          parts.push({
            inlineData: {
              mimeType: match[1],
              data: match[2],
            },
          });
        }
      }

      const primaryModel = process.env.GEMINI_MODEL || 'gemini-omni-1.1-flash';
      let response: any;
      try {
        response = await client.models.generateContent({
          model: primaryModel,
          contents: parts,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.8,
          },
        });
      } catch (geminiModelErr: any) {
        this.logger.warn(`Model ${primaryModel} generateContent notice: ${geminiModelErr.message}. Falling back to gemini-2.5-flash.`);
        response = await client.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: parts,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.8,
          },
        });
      }

      if (response && response.text) {
        const cleaned = response.text.replace(/```json|```/gi, '').trim();
        let parsed: any;
        const firstBrace = cleaned.indexOf('{');
        const lastBrace = cleaned.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) {
          parsed = JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
        } else {
          parsed = JSON.parse(cleaned);
        }
        const scenesArray = Array.isArray(parsed?.scenes)
          ? parsed.scenes
          : Array.isArray(parsed?.project?.scenes)
            ? parsed.project.scenes
            : [];
        return this.validateAndFormatScenes(scenesArray, cleanPrompt);
      }
      throw new Error('Gemini javobidan ssenariy sahnalarini ajratib boʻlmadi');
    } catch (llmErr: any) {
      this.logger.error(`Gemini LLM drama framing error: ${llmErr.message}`);
      throw new BadRequestException(`Gemini AI ssenariyni yaratishda xatolik yuz berdi: ${llmErr.message}`);
    }
  }

  private validateAndFormatScenes(rawScenes: any[], cleanPrompt: string): DramaScene[] {
    if (!Array.isArray(rawScenes) || rawScenes.length < 2) {
      throw new Error('LLM javobidan kamida 2 ta sahna ajratib boʻlmadi');
    }

    const validatedScenes: DramaScene[] = rawScenes.map((s: any, idx: number) => {
      const rawDuration = Number(s.duration_seconds || s.durationSeconds) || 5;
      const duration = Math.max(4, Math.min(rawDuration, 8));

      let dialogue = '';
      if (typeof s.dialogue === 'string') {
        dialogue = s.dialogue;
      } else if (Array.isArray(s.dialogue) && s.dialogue.length > 0) {
        dialogue = s.dialogue
          .map((d: any) => {
            if (typeof d === 'string') return d;
            const charPrefix = d.character ? `${d.character}: ` : '';
            return `${charPrefix}${d.line || d.text || ''}`.trim();
          })
          .filter(Boolean)
          .join(' ');
      }

      if (!dialogue && s.voice_over) {
        dialogue = typeof s.voice_over === 'string' ? s.voice_over : s.voice_over.script || '';
      }
      if (!dialogue && s.dialogueScript) {
        dialogue = s.dialogueScript;
      }
      if (!dialogue && s.action) {
        dialogue = s.action;
      }
      if (!dialogue) {
        dialogue = s.title || `Sahna ${idx + 1}`;
      }

      let cinematicPrompt = (s.video_prompt || s.cinematicPrompt || '').trim();
      if (!cinematicPrompt) {
        const cameraDetails = s.camera ? `${s.camera.shot || ''} ${s.camera.movement || ''}`.trim() : '';
        cinematicPrompt = `Vertical 9:16 cinematic scene. ${s.action || cleanPrompt}. ${cameraDetails} ${s.lighting || ''}`.trim();
      }

      const caption = s.purpose || s.caption || s.action || dialogue;

      return {
        sceneIndex: Number(s.scene_number || s.sceneIndex) || idx + 1,
        actTitle: s.title || s.actTitle || `Sahna ${idx + 1}`,
        emotion: s.emotion || 'Yuqori emotsional hayajon',
        tensionLevel: Math.max(1, Math.min(Number(s.tensionLevel || s.tension_level) || (idx === 1 ? 10 : 8), 10)),
        durationSeconds: duration,
        cinematicPrompt,
        dialogueScript: dialogue,
        caption,
        karaokeSubtitles: Array.isArray(s.karaokeSubtitles) && s.karaokeSubtitles.length > 0
          ? s.karaokeSubtitles
          : this.generateFallbackKaraoke(dialogue, duration),
      };
    });

    return validatedScenes;
  }

  private generateFallbackKaraoke(text: string, durationSec: number): KaraokeWord[] {
    const words = text.split(/\s+/).filter(Boolean);
    if (words.length === 0) return [];
    const step = durationSec / words.length;

    return words.map((w, i) => ({
      word: w,
      startSec: Number((i * step).toFixed(2)),
      endSec: Number(((i + 1) * step).toFixed(2)),
    }));
  }
}
