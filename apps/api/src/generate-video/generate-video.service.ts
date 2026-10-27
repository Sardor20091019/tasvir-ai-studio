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
import { CloudflareWorkersAiService } from './cloudflare-workers-ai.service';
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
    @Inject(CloudflareWorkersAiService) private readonly cloudflareWorkersAiService: CloudflareWorkersAiService,
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
    const hasCloudflare = this.cloudflareWorkersAiService.isAvailable();
    const { client, activeKey } = this.getGeminiClient();
    const openaiKey = this.getOpenAIKey();

    if (!hasCloudflare && !activeKey && !openaiKey) {
      throw new BadRequestException(
        'AI ssenariyni yaratish uchun serverda CLOUDFLARE_WORKERS_API_TOKEN, OPENAI_API_KEY yoki GEMINI_API_KEY sozlanishi shart.',
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
      currentStepMessage: `Kinematografik (${resolution}) video generatsiyasi navbatga qoʻyildi...`,
      scenes: initialScenes,
      totalDurationSeconds,
      locale: params.locale || 'uz',
      createdAt: new Date().toISOString(),
    };

    this.jobs.set(jobId, job);
    this.logger.log(
      `Created video job ${jobId} (Resolution: ${resolution}, 9:16, Music: ${includeBackgroundMusic ? 'ON' : 'OFF'}, Pre-confirmed scenes: ${initialScenes.length})`,
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
      message: `Kinematografik (${resolution}) video generatsiyasi boshlandi`,
      model: 'ai-video-engine',
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

    const storyTheme = job.prompt.replace(/[\r\n\t]+/g, ' ').trim().slice(0, 120);
    const visualAnchor = `Consistent character appearance, recurring actors, consistent wardrobe, identical room setting and realistic visual continuity across all scenes. ${storyTheme}`;

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
        storyPrompt: job.prompt,
        visualAnchor,
      });

      scene.localImagePath = publicImgPath;
      scene.imageUrl = `/generated-videos/${imgFilename}`;

      if (fs.existsSync(publicImgPath)) {
        try {
          const imgBuffer = fs.readFileSync(publicImgPath);
          const cdnImageUrl = await this.uploadThingService.uploadImage(imgBuffer, imgFilename);
          if (cdnImageUrl) {
            scene.imageUrl = cdnImageUrl;
            this.logger.log(`Uploaded scene ${scene.sceneIndex} image to UploadThing CDN: ${cdnImageUrl}`);
          }
        } catch (imgUpErr: any) {
          this.logger.warn(`Scene ${scene.sceneIndex} image upload notice: ${imgUpErr.message}`);
        }
      }

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

  private buildSceneVisualPrompt(params: {
    scene: DramaScene;
    sceneIndex: number;
    totalScenes: number;
    storyPrompt?: string;
    visualAnchor?: string;
  }): string {
    const { scene, sceneIndex, totalScenes, storyPrompt, visualAnchor } = params;

    let basePrompt = (scene.cinematicPrompt || '').trim();

    const isUzbekText = /[ʻʼ'`]|(?:bolajon|bobo|ona|ota|mehribon|sog'in|tong|nonushta|yolg'iz|xotira|hayot|ko'z|mehr|bilan|har|kun|qulupnay|oshxona|stul|yurak)/i.test(basePrompt);
    if (!basePrompt || isUzbekText || basePrompt.length < 20) {
      basePrompt = `Scene ${sceneIndex} of ${totalScenes}: Highly detailed vertical 9:16 cinematic film still. Visual scene: ${scene.actTitle}. Emotion: ${scene.emotion}. Authentic human facial expressions and dramatic cinematic composition.`;
    }

    const anchorParts: string[] = [];
    if (visualAnchor) {
      anchorParts.push(visualAnchor);
    }
    anchorParts.push(basePrompt);
    anchorParts.push('vertical 9:16 aspect ratio');
    anchorParts.push('cinematic 35mm photograph, natural dramatic lighting, Kodak Portra color tone, highly detailed faces, 8k resolution, authentic realistic cinematography');

    return anchorParts.join(', ').slice(0, 1000);
  }

  private async generateImageForScene(params: {
    scene: DramaScene;
    sceneIndex: number;
    totalScenes: number;
    outputPath: string;
    productImageUrl?: string;
    resolution?: string;
    storyPrompt?: string;
    visualAnchor?: string;
  }): Promise<void> {
    const { scene, sceneIndex, totalScenes, outputPath, productImageUrl, resolution } = params;

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

    const visualPrompt = this.buildSceneVisualPrompt(params);

    if (this.cloudflareWorkersAiService.isAvailable()) {
      try {
        const imageBuffer = await this.cloudflareWorkersAiService.generateImage(visualPrompt);
        if (imageBuffer && imageBuffer.length > 5000) {
          fs.writeFileSync(outputPath, imageBuffer);
          this.logger.log(`Generated Cloudflare Workers AI FLUX image for scene ${sceneIndex} (${imageBuffer.length} bytes)`);
          return;
        }
      } catch (cfImgErr: any) {
        this.logger.warn(`Cloudflare Workers AI FLUX notice for scene ${sceneIndex}: ${cfImgErr.message}`);
      }
    }

    // 2. Google Imagen 3 (via @google/genai)
    const { client, activeKey } = this.getGeminiClient();
    if (activeKey) {
      try {
        this.logger.log(`Invoking Google Imagen 3 for Scene ${sceneIndex}: "${visualPrompt.slice(0, 60)}"...`);
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
        this.logger.log(`Invoking OpenAI DALL-E for Scene ${sceneIndex}: "${visualPrompt.slice(0, 60)}"...`);
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

    if (this.cloudflareWorkersAiService.isAvailable()) {
      try {
        this.logger.log(
          `Invoking Cloudflare Workers AI for story framing on: "${cleanPrompt.slice(0, 60)}" (Lang: ${locale})`,
        );
        const scenes = await this.generateDramaScenesWithCloudflareAI(cleanPrompt, productImageUrl, locale);
        if (scenes && scenes.length >= 2) {
          this.logger.log(`Cloudflare Workers AI successfully authored ${scenes.length} viral drama scenes.`);
          return scenes;
        }
      } catch (cfErr: any) {
        this.logger.warn(`Cloudflare Workers AI story notice: ${cfErr.message}. Trying OpenAI/Gemini.`);
      }
    }

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
      'AI ssenariyni yaratish uchun Cloudflare, OpenAI yoki Gemini API kaliti serverda sozlanishi shart.',
    );
  }

  private buildViralDramaPrompt(cleanPrompt: string, productImageUrl?: string, locale: string = 'uz'): string {
    const targetLang = locale === 'ru' ? 'RUSSIAN (Русский язык)' : locale === 'en' ? 'ENGLISH' : 'UZBEK (Oʻzbek tili, Lotin yozuvida)';
    const sessionNonce = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const dynamicAngles = [
      'Kutilmagan fidoiylik va yashirin mehr (Secret Sacrificial Love & Devotion)',
      'Mag\'lubiyatdan yuksak cho\'qqiga erishish va qasos o\'rniga kechirish (Triumph & Forgiveness)',
      'Bolalikdagi orzu va yillar o\'tib topilgan aziz inson (Childhood Nostalgia & Reunion)',
      'Hayotiy xato va so\'nggi soniyalardagi najot (Second Chance & Redemption)',
      'Oila rishtalari, ko\'z yoshlar va samimiy mehr (Unbreakable Family Bond & Catharsis)',
      'Zulmatdan yorug\'likka chiqish va buyuk sabr (Patience & Miraculous Victory)',
      'Kutilmagan sirning fosh bo\'lishi va qalb taskini (Shocking Truth & Inner Peace)',
      'Do\'stlik sadoqati va har qanday to\'siqni yenguvchi ahd (True Loyalty & Eternal Friendship)',
    ];
    const selectedAngle = dynamicAngles[Math.floor(Math.random() * dynamicAngles.length)];

    return `[IJODIY SESSIYA ID: #${sessionNonce}]
[SYUJET RAKURSI: ${selectedAngle}]
Siz Instagram Reels va TikTok platformalari uchun oʻta kuchli, virusli (viral) va millionlab tomoshabinlarni koʻz yoshlariga yoki chuqur hayratga soluvchi professional dramaturg va kinematografsiz.

FOYDALANUVCHI MAVZUSI / GʻOYASI: "${cleanPrompt}".
${
  productImageUrl
    ? 'Foydalanuvchi mahsulot fotosuratini taqdim etgan. Mahsulot shakli, rangi va qadogʻini hikoyada organik saqlang va 5-sahnani yuqori darajadagi premium tijoriy reklama (Commercial Product Finale) bilan yakunlang.'
    : 'Agar mavzu mahsulotga oid boʻlsa, 5-sahnani estetik tijoriy reklama studiyasi bilan yakunlang.'
}

MUTLAQO YANGI VA BETAKRORLIK QOIDASI:
Oldingi yaratilgan ssenariylar, iboralar yoki standart shablonlarni ASLO takrorlamang! Ushbu prompt boʻyicha "${selectedAngle}" dramatik rakursidan yondashib, mutlaqo yangi, kutilmagan, chuqur dramatizm va yangicha qahramonlar bilan yozing. Avvalgi javoblardan birorta jumla ko'chirilmasin.

REELS & TIKTOK MAXIMUM RETENTION & EMOTIONAL IMPACT TALABLARI:
1. ANIQ 5 TA TOʻLIQ VA KUCHLI SAHNA TUZING (scene_number: 1 dan 5 gacha):
   - 1-SAHNA: VIRAL HOOK (Kuchlanish: 10/10). Tasodifiy skroll qilayotgan tomoshabinni birinchi 2 soniyadayoq ekran qarshisida muzlatib qoʻyuvchi favqulodda hayajonli, shok, sir yoki taʼsirchan savol bilan ochilsin!
   - 2-SAHNA: EMOTSIONAL SINOV & KELISHMOVCHILIK (Kuchlanish: 9/10). Qahramonlar duch kelgan ogʻir sinov, kutilmagan toʻsiq, sogʻinch yoki yoʻqotish xavfi.
   - 3-SAHNA: ENG YUQORI KULMINATSIYA & ZAIF NUQTA (Kuchlanish: 10/10). Hissiyotlar portlashi, koʻz yoshlar, yurakni larzaga soluvchi keskin harakat yoki shafqatsiz haqiqat.
   - 4-SAHNA: UMID UCHQUNI & MEHRNING KUCHI (Kuchlanish: 9/10). Qutqaruvchi yechim, iliqlik, samimiy mehr, tavba yoki sadoqatning gʻalabasi.
   - 5-SAHNA: QALBGA MUHRLANUVCHI BUYUK XULOSA / KATARSIS (Kuchlanish: 10/10). Tomoshabinga chuqur hayotiy maʼno, koʻz yoshlar bilan toʻla tasalli yoki unutilmas falsafiy xulosa beruvchi, qayta-qayta tomosha qilishga undovchi buyuk yakun.

2. DIALOG / DIKTOR MATNI (ENG MUHIM):
   - HAR BIR SAHNADA KAMIDA 25-45 SOʻZDAN IBORAT (2-4 TA TOʻLIQ GAP) OʻTA EMOTSIONAL, CHUQUR VA DETALLI DIKTOR/QAHRAMON NUTQI BOʻLISHI SHART!
   - Hech qachon 3-8 soʻzli qisqa jumlalar yozmang. Subtitrlar ekranda tinimsiz oʻqilishi kerak.
   - Barcha insoniy matnlar (title, dialogue, caption, emotion) 100% ${targetLang} tilida yozilsin.

3. VIZUAL FLUX PROMPT (video_prompt):
   - Har bir sahna uchun 'video_prompt' maydoni FAQAT INGLIZ TILIDA (100% English) boʻlishi SHART! Hech qachon oʻzbekcha soʻz qoʻshmang, chunki FLUX faqat inglizcha promptlarni tushunadi.
   - QAHRAMONLAR VA LOKATSIYA KONSISTENTLIGI (ENG MUHIM): Barcha sahnalarda ASOSIY QAHRAMONLAR TASHQI KOʻRINISHI (yoshi, jinsi, kiyimi, soch turmagi, yuz tuzilishi) bir xil qilib takrorlansin! (Masalan: "The same elderly grandfather with kind wrinkled eyes and white beard wearing a brown cardigan" va "the same 8-year-old grandson with dark hair in a warm sweater").
   - SAHNAGA AYNAN MOSLIK: Prompt sahna matnida nima yozilgan boʻlsa, AYNAN OʻSHA HARAKAT, LOKATSIYA VA PREDMETLARNI tasvirlasin (masalan: birga nonushta qilish, boʻsh stulga qarab yolgʻiz oʻtirish, xotira rasmini ushlab yigʻlash)! Hech qachon mavhum gap yozmang.

Javobni qatʼiy ravishda valid JSON formatida qaytaring:
{
  "scenes": [
    {
      "scene_number": 1,
      "title": "Sahna 1: Mehr bilan toʻla nonushta",
      "emotion": "Iliqlik, baxt va mehr",
      "tension_level": 10,
      "duration": 5,
      "dialogue": "Har tong bobomning issiq non ushatishi va samimiy duosi bilan boshlanardi. Oʻsha lahzalardagi xotirjamlik va mehr hayotimizning eng buyuk tayanchi ekanini endi tushundim.",
      "caption": "Mehrli tonggi an'ana",
      "video_prompt": "Vertical 9:16 cinematic film still. An elderly Uzbek grandfather with gentle wrinkled smile and white beard sitting at a wooden kitchen table with his 8-year-old grandson in a cozy sweater, sharing traditional bread and tea, warm morning sunbeams through window, photorealistic 8k, emotional intimate medium shot"
    },
    {
      "scene_number": 2,
      "title": "Sahna 2: Jimjit tong va yolgʻizlik",
      "emotion": "Sogʻinch, qaygʻu va yolgʻizlik",
      "tension_level": 9,
      "duration": 5,
      "dialogue": "Bugun esa oshxonada ogʻir sukunat hukmron. Bobomning boʻsh qolgan oʻrindigʻiga qarab, uning iliq ovozi va mehribon nigohlarini qanchalik sogʻinganimni his qildim.",
      "caption": "Boʻsh qolgan stol",
      "video_prompt": "Vertical 9:16 cinematic film still. The same 8-year-old grandson sitting alone at the kitchen table, gazing sadly at his grandfather's empty chair and untouched tea bowl, soft moody morning shadows, emotional longing facial expression, photorealistic 8k, cinematic medium shot"
    },
    {
      "scene_number": 3,
      "title": "Sahna 3: Xotiralar va Koʻz Yoshlar",
      "emotion": "Hissiyotlar portlashi va sogʻinch",
      "tension_level": 10,
      "duration": 5,
      "dialogue": "Uning qadrdon koʻzoynagi va qoʻlyozmalarini bagʻrimga bosdim. Bobo, siz bergan mehr qalbimda mangu yashaydi, ammo bugun sizsiz oʻtgan har bir daqiqa qalbimni tilka-pora qilmoqda!",
      "caption": "Yurakdagi sogʻinch",
      "video_prompt": "Vertical 9:16 cinematic film still. Close-up of the 8-year-old grandson crying with glistening tears, clutching his grandfather's vintage glasses and old worn photo album to his chest, dramatic side lighting, photorealistic 8k, deep emotional intensity"
    },
    {
      "scene_number": 4,
      "title": "Sahna 4: Qalbdagi Yangi Umid",
      "emotion": "Iliqlik, tasalli va najot",
      "tension_level": 9,
      "duration": 5,
      "dialogue": "Bobom doim aytardi: 'Mehr hech qachon yoʻqolmaydi, u boshqa qalblarga koʻchadi'. Men oʻrnimdan turdim va bobom oʻrgatganidek yangi non yopishga, yaxshilik ulashishga ahd qildim.",
      "caption": "Mehrning davomi",
      "video_prompt": "Vertical 9:16 cinematic film still. The 8-year-old grandson standing by the sunlit kitchen counter with a gentle, determined smile, wiping his tears and holding fresh dough, warm golden hour sunbeams streaming in, photorealistic 8k, inspiring medium shot"
    },
    {
      "scene_number": 5,
      "title": "Sahna 5: Mangu Yashovchi Mehr",
      "emotion": "Katarsis, cheksiz mehr va xotirjamlik",
      "tension_level": 10,
      "duration": 5,
      "dialogue": "Endi bildim: aziz insonlarimiz yonimizda boʻlmasa-da, ular qoldirgan mehr har bir nafsimizda yashaydi. Bu mehrni asraylik, chunki samimiyat va muhabbat abadiydir.",
      "caption": "Unutilmas abadiy xulosa",
      "video_prompt": "Vertical 9:16 cinematic film still. The grandson smiling peacefully towards the golden sunset window, carrying on his grandfather's legacy with serene pride, cinematic atmospheric glow, soft warm lighting, photorealistic 8k, epic slow push-in shot"
    }
  ]
}`;
  }

  private async generateDramaScenesWithCloudflareAI(
    cleanPrompt: string,
    productImageUrl?: string,
    locale: string = 'uz',
  ): Promise<DramaScene[]> {
    const promptText = this.buildViralDramaPrompt(cleanPrompt, productImageUrl, locale);

    const content = await this.cloudflareWorkersAiService.generateText(
      promptText,
      AI_STORY_CINEMATIC_DIRECTOR_SYSTEM_PROMPT,
    );

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

  private async generateDramaScenesWithOpenAI(
    openaiKey: string,
    cleanPrompt: string,
    productImageUrl?: string,
    locale: string = 'uz',
  ): Promise<DramaScene[]> {
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    const promptText = this.buildViralDramaPrompt(cleanPrompt, productImageUrl, locale);

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
        temperature: 0.9,
        seed: Math.floor(Math.random() * 2147483647),
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
    this.logger.log(
      `Invoking Gemini LLM for Drama Framing Engine on "${cleanPrompt}" (Lang: ${locale}, Product Image: ${productImageUrl ? 'YES' : 'NO'})`,
    );

    try {
      const promptText = this.buildViralDramaPrompt(cleanPrompt, productImageUrl, locale);

      const parts: any[] = [
        {
          text: `${AI_STORY_CINEMATIC_DIRECTOR_SYSTEM_PROMPT}\n\n${promptText}`,
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
            temperature: 0.9,
          },
        });
      } catch (geminiModelErr: any) {
        this.logger.warn(`Model ${primaryModel} generateContent notice: ${geminiModelErr.message}. Falling back to gemini-2.5-flash.`);
        response = await client.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: parts,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.9,
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

    const scenesToProcess = [...rawScenes];

    if (scenesToProcess.length === 2) {
      scenesToProcess.splice(1, 0, {
        scene_number: 2,
        title: 'Sahna 2: Keskin Hissiy Sinov',
        emotion: 'Iztirob va kurash',
        tension_level: 9,
        duration: 5,
        dialogue: `Har bir soniya keskin sinovga aylangandi. ${cleanPrompt.slice(0, 45)} qarshisida yurakdagi qoʻrquv va samimiy umid bir-biri bilan murosasiz toʻqnashar, taslim boʻlishga esa hech kimning haqqi yoʻq edi.`,
        caption: 'Ogʻir sinov lahzasi',
        video_prompt: 'Vertical 9:16 cinematic medium close-up, dramatic cold shadows, deep emotion in eyes, photorealistic 8k',
      });
      scenesToProcess.splice(2, 0, {
        scene_number: 3,
        title: 'Sahna 3: Hissiyotlar Kulminatsiyasi',
        emotion: 'Koʻz yoshlar va faryod',
        tension_level: 10,
        duration: 5,
        dialogue: `Koʻz yoshlarimni toʻxtatolmadim, chunki barcha umidlar soʻngan lahzada qalbimda birgina narsa qolgan edi — bu bizni bogʻlab turgan cheksiz mehr va sadoqat edi!`,
        caption: 'Hissiyotlar portlashi',
        video_prompt: 'Vertical 9:16 cinematic intense extreme close-up, tears glistening under atmospheric lighting, photorealistic 8k',
      });
      scenesToProcess.push({
        scene_number: 5,
        title: 'Sahna 5: Buyuk Mehr Tantanasi',
        emotion: 'Katarsis va unutilmas xotira',
        tension_level: 10,
        duration: 5,
        dialogue: `Endi bildim: eng qimmatli narsa bu vaqtinchalik narsalar emas, har tong seni mehr bilan kutib oluvchi aziz insoningdir. Bu tuygʻuni eʼzozlang, chunki haqiqiy mehr abadiydir.`,
        caption: 'Unutilmas xulosa',
        video_prompt: 'Vertical 9:16 cinematic golden hour finale, warm lens flare, peaceful smile, epic slow camera push-in',
      });
    } else if (scenesToProcess.length === 3) {
      scenesToProcess.splice(2, 0, {
        scene_number: 3,
        title: 'Sahna 3: Hissiyotlar Kulminatsiyasi',
        emotion: 'Hissiyotlar choʻqqisi va koʻz yoshlar',
        tension_level: 10,
        duration: 5,
        dialogue: `Hammasi barbod boʻldi deganimda, yurakdagi sadoqat va mehr har qanday qorongʻulikdan ustun keldi. Bu lahza hayotimizning eng muhim burilish nuqtasi boʻldi!`,
        caption: 'Burilish nuqtasi',
        video_prompt: 'Vertical 9:16 intense cinematic extreme close-up, emotional facial expressions, dramatic rim lighting, 8k',
      });
      scenesToProcess.splice(3, 0, {
        scene_number: 4,
        title: 'Sahna 4: Qutqaruvchi Mehr Uchquni',
        emotion: 'Iliqlik va najot',
        tension_level: 9,
        duration: 5,
        dialogue: `Qorongʻulik chekindi, bitta samimiy tabassum barcha dardlarni yuvib ketdi. Mehr bor joyda har doim najot va yangi hayot boshlanadi.`,
        caption: 'Iliqlik va najot',
        video_prompt: 'Vertical 9:16 cinematic warm golden glow, touching hands, genuine relief, photorealistic film still',
      });
    } else if (scenesToProcess.length === 4) {
      scenesToProcess.splice(2, 0, {
        scene_number: 3,
        title: 'Sahna 3: Zaif Nuqta va Hissiyotlar Choʻqqisi',
        emotion: 'Kulminatsiya va kuchli hissiyot',
        tension_level: 10,
        duration: 5,
        dialogue: `Hech narsa oʻz-oʻzidan boʻlmaydi. Yillar davomida asragan orzularimiz sinovdan oʻtayotgan oʻsha lahzada chinakam sadoqat har qanday qiyinchilikdan ustun chiqdi!`,
        caption: 'Hissiyotlar choʻqqisi',
        video_prompt: 'Vertical 9:16 cinematic dramatic close-up, intense eye contact, shallow depth of field, photorealistic 8k',
      });
    }

    const validatedScenes: DramaScene[] = scenesToProcess.map((s: any, idx: number) => {
      const rawDuration = Number(s.duration_seconds || s.durationSeconds || s.duration) || 5;
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

      const wordCount = dialogue.trim().split(/\s+/).filter(Boolean).length;
      if (wordCount < 18 || dialogue.trim().toLowerCase() === (s.title || '').trim().toLowerCase()) {
        const topic = cleanPrompt.slice(0, 50);
        const titleText = (s.title || s.actTitle || `Sahna ${idx + 1}`).replace(/^\d+[-_.:\s]*/, '');
        if (idx === 0) {
          dialogue = `Oʻsha kuni uning koʻzlarida avval hech qachon koʻrmagan kuchli hayajonni his qildim. ${topic} boʻyicha ochilgan bu kutilmagan haqiqat butun hayotimizni bir lahzada oʻzgartirib yuborishini hech kim kutmagan edi!`;
        } else if (idx === 1) {
          dialogue = `Xonadagi ogʻir sukunat va sovuq nafas yurakni larzaga solardi. ${titleText} qarshisida chorasiz qolganimizda, yillar davomida toʻplangan mehr va sabr oʻzining eng ogʻir sinoviga duch keldi.`;
        } else if (idx === 2) {
          dialogue = `Ketma, iltimos, mendan yuz oʻgirma! Hamma narsamni yoʻqotishim mumkin, ammo sening mehringdan ayrilish — bu butun borligʻim barbod boʻlishi demakdir!`;
        } else if (idx === scenesToProcess.length - 1) {
          dialogue = `Endi bildim: eng qimmatli xazina boylik emas, har tong seni mehr bilan kutib oladigan samimiy insonning borligidir. ${topic} orqali qalbimizda qolgan bu iliqlik abadiy yashaydi.`;
        } else {
          dialogue = `Qorongʻulik qanchalik quyuq boʻlmasin, bitta samimiy nigoh va issiq qoʻl tafti barcha ogʻriqlarni yuvib ketdi. Mehr nuri har qanday toʻsiqni yengib oʻtishga qodir edi.`;
        }
      }

      let cinematicPrompt = (s.video_prompt || s.cinematicPrompt || '').trim();
      if (!cinematicPrompt) {
        const cameraDetails = s.camera ? `${s.camera.shot || ''} ${s.camera.movement || ''}`.trim() : '';
        cinematicPrompt = `Vertical 9:16 cinematic scene. ${s.action || cleanPrompt}. ${cameraDetails} ${s.lighting || ''}`.trim();
      }

      const caption = s.purpose || s.caption || s.action || dialogue.slice(0, 45);
      const rawTension = Number(s.tensionLevel || s.tension_level);
      const tensionLevel = idx === 0
        ? 10
        : Math.max(7, Math.min(rawTension || (idx === 1 ? 9 : 8), 10));

      return {
        sceneIndex: Number(s.scene_number || s.sceneIndex) || idx + 1,
        actTitle: s.title || s.actTitle || `Sahna ${idx + 1}`,
        emotion: s.emotion || (idx === 0 ? 'Shok va keskin hayajon' : 'Yuqori emotsional hayajon'),
        tensionLevel,
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
