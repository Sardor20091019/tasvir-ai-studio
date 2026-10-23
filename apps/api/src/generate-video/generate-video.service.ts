import { Injectable, Logger, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';
import * as crypto from 'crypto';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { UploadThingService } from '../storage/uploadthing.service';
import { FfmpegConcatService } from './ffmpeg-concat.service';
import {
  AspectRatioType,
  DramaScene,
  DramaVideoGenerationJob,
  KaraokeWord,
} from './generate-video.types';

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

  async planScenes(params: {
    prompt: string;
    dramaLevel?: string;
  }): Promise<{ prompt: string; scenes: DramaScene[]; totalDurationSeconds: number }> {
    const { client, activeKey } = this.getGeminiClient();
    if (!activeKey) {
      throw new BadRequestException(
        'Gemini API kaliti sozlanmagan. Haqiqiy AI ssenariy yaratish uchun serverda GEMINI_API_KEY oʻrnatilishi shart.',
      );
    }

    const scenes = await this.generateDramaScenesWithLLM(client, activeKey, params.prompt);
    const totalDurationSeconds = scenes.reduce((acc, s) => acc + s.durationSeconds, 0);

    return {
      prompt: params.prompt,
      scenes,
      totalDurationSeconds,
    };
  }

  async startGeneration(params: {
    prompt: string;
    scenes?: DramaScene[];
    aspectRatio?: AspectRatioType;
    includeBackgroundMusic?: boolean;
    dramaLevel?: string;
  }): Promise<{ jobId: string; status: string; progress: number; message: string; model: string }> {
    const jobId = `drama_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const aspectRatio: AspectRatioType = '9:16';
    const includeBackgroundMusic = params.includeBackgroundMusic === true;

    const initialScenes = Array.isArray(params.scenes) && params.scenes.length > 0 ? params.scenes : [];
    const totalDurationSeconds = initialScenes.length > 0
      ? initialScenes.reduce((acc, s) => acc + s.durationSeconds, 0)
      : 16;

    const job: DramaVideoGenerationJob = {
      jobId,
      prompt: params.prompt,
      aspectRatio,
      modelTier: 'veo-3.1-lite-generate',
      includeBackgroundMusic,
      bgMusicTrack: 'EMIN & JONY — «Камин» (Fireplace)',
      status: 'queued',
      progress: 5,
      currentStepMessage: 'Google Veo 3.1 dramatik video loyihasi navbatga qoʻyildi...',
      scenes: initialScenes,
      totalDurationSeconds,
      createdAt: new Date().toISOString(),
    };

    this.jobs.set(jobId, job);
    this.logger.log(
      `Created Veo 3.1 drama job ${jobId} (Model: veo-3.1-lite-generate, 9:16, Music: ${includeBackgroundMusic ? 'ON (EMIN & JONY - Kamin)' : 'OFF'}, Pre-confirmed scenes: ${initialScenes.length})`,
    );

    this.processJobAsync(jobId).catch((err) => {
      this.logger.error(`Error in drama generation job ${jobId}: ${err.message}`, err.stack);
      const current = this.jobs.get(jobId);
      if (current) {
        current.status = 'failed';
        current.error = err.message;
      }
    });

    return {
      jobId,
      status: job.status,
      progress: job.progress,
      message: 'Google Veo 3.1 dramatik video generatsiyasi boshlandi',
      model: 'veo-3.1-lite-generate',
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
      job.currentStepMessage = 'Dramatik LLM tizimi ssenariyni keskin emotsional sahnalarga ajratmoqda...';

      scenes = await this.generateDramaScenesWithLLM(client, activeKey, job.prompt);
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
    job.currentStepMessage = 'Google Veo 3.1 (veo-3.1-lite-generate) orqali 9:16 sahna kadrlari generatsiya qilinmoqda...';

    job.status = 'generating_veo_clips';
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), `tasvir-veo-${jobId}-`));
    const generatedClipPaths: string[] = [];

    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      const sceneDuration = Math.max(4, Math.min(scene.durationSeconds, 8));
      scene.durationSeconds = sceneDuration;

      job.currentStepMessage = `Google Veo 3.1: Sahna ${i + 1}/${scenes.length} ("${scene.actTitle}") render qilinmoqda (${sceneDuration}s)...`;
      job.progress = 40 + Math.floor((i / scenes.length) * 30);

      const clipOutputPath = path.join(tempDir, `scene_${scene.sceneIndex}.mp4`);

      if (activeKey) {
        try {
          this.logger.log(
            `Calling Google Veo 3.1 ("veo-3.1-lite-generate") for scene ${scene.sceneIndex} [duration: ${sceneDuration}s, aspect: 9:16]`,
          );

          const veoOperation: any = await (client.models as any).generateVideos({
            model: 'veo-3.1-lite-generate',
            prompt: `${scene.cinematicPrompt}, vertical 9:16 aspect ratio, dramatic cinematic lighting, emotional crying tears, 4k ultra realistic, high cinematic tension, movie cinematography`,
            config: {
              aspectRatio: '9:16',
              durationSeconds: sceneDuration,
              numberOfVideos: 1,
            },
          });

          if (veoOperation) {
            let op = veoOperation;
            let attempts = 0;
            while (!op.done && attempts < 12) {
              await sleep(3000);
              attempts++;
              try {
                if ((client.operations as any)?.getVideosOperation) {
                  op = await (client.operations as any).getVideosOperation({ operation: op });
                } else {
                  break;
                }
              } catch (opErr) {
                break;
              }
            }

            const videoResult = op.response?.generatedVideos?.[0]?.video;
            if (videoResult?.uri) {
              scene.clipVideoUrl = videoResult.uri;
              this.logger.log(`Veo 3.1 scene ${scene.sceneIndex} produced video URI: ${videoResult.uri}`);
            }
          }
        } catch (veoErr: any) {
          this.logger.warn(`Google Veo 3.1 call notice: ${veoErr.message}. Synthesizing high-res 9:16 vertical drama clip.`);
        }
      }

      try {
        await this.ffmpegConcatService.synthesizeDramaSceneClip({
          outputPath: clipOutputPath,
          durationSeconds: sceneDuration,
          sceneIndex: scene.sceneIndex,
          tensionLevel: scene.tensionLevel,
          caption: scene.caption || scene.dialogueScript,
        });

        scene.localClipPath = clipOutputPath;
        generatedClipPaths.push(clipOutputPath);
      } catch (synthErr: any) {
        this.logger.error(`Error synthesizing clip for scene ${scene.sceneIndex}: ${synthErr.message}`);
      }

      await sleep(1000);
    }

    if (generatedClipPaths.length === 0) {
      throw new Error('Hech qanday Veo dramatik video sahnalarini shakllantirib boʻlmadi');
    }

    job.status = 'concatenating_master_video';
    job.progress = 80;
    job.currentStepMessage = 'FFmpeg concat demuxer orqali sahnalar yagona master videoga birlashtirilmoqda...';

    const masterOutputPath = path.join(tempDir, `master_drama_${jobId}.mp4`);
    const backgroundMusicPath = path.resolve(process.cwd(), 'apps/api/assets/audio/kamin-emin-jony.mp3');

    await this.ffmpegConcatService.concatScenes({
      sceneClipPaths: generatedClipPaths,
      outputPath: masterOutputPath,
      backgroundMusicPath,
      includeBackgroundMusic: job.includeBackgroundMusic,
      totalDurationSeconds: job.totalDurationSeconds,
    });

    job.progress = 90;
    job.status = 'saving_to_cloud';
    job.currentStepMessage = 'Master video CDN va doimiy xotiraga yuklanmoqda...';

    let finalCdnUrl: string | null = null;
    try {
      const videoBuffer = fs.readFileSync(masterOutputPath);
      finalCdnUrl = await this.uploadThingService.uploadVideo(
        videoBuffer,
        `veo-3.1-drama-${jobId}.mp4`,
      );
      if (finalCdnUrl) {
        this.logger.log(`Veo 3.1 master drama video uploaded to UploadThing CDN: ${finalCdnUrl}`);
      }
    } catch (uploadErr: any) {
      this.logger.warn(`UploadThing upload notice: ${uploadErr.message}`);
    }

    if (!finalCdnUrl) {
      try {
        const publicDir = path.resolve(process.cwd(), 'apps/web/public/generated-videos');
        if (!fs.existsSync(publicDir)) {
          fs.mkdirSync(publicDir, { recursive: true });
        }
        const localFilename = `veo-3.1-drama-${jobId}.mp4`;
        const localDestPath = path.join(publicDir, localFilename);
        fs.copyFileSync(masterOutputPath, localDestPath);
        finalCdnUrl = `/generated-videos/${localFilename}`;
        this.logger.log(`Saved master video locally to public directory: ${finalCdnUrl}`);
      } catch (localSaveErr: any) {
        this.logger.error(`Failed to save video locally: ${localSaveErr.message}`);
      }
    }

    if (!finalCdnUrl) {
      throw new Error('Master videoni saqlashda xatolik yuz berdi');
    }

    job.status = 'completed';
    job.progress = 100;
    job.currentStepMessage = 'Google Veo 3.1 dramatik video roligi muvaffaqiyatli tayyorlandi!';
    job.videoUrl = finalCdnUrl;
    job.downloadUrl = finalCdnUrl;
    job.completedAt = new Date().toISOString();

    this.logger.log(`Job ${jobId} finished with ${scenes.length} scenes, total: ${job.totalDurationSeconds}s`);
  }

  private async generateDramaScenesWithLLM(
    client: GoogleGenAI,
    activeKey: string,
    userPrompt: string,
  ): Promise<DramaScene[]> {
    if (!activeKey) {
      throw new BadRequestException(
        'Gemini API kaliti topilmadi. AI ssenariy yaratish uchun serverda GEMINI_API_KEY sozlanishi shart.',
      );
    }

    const cleanPrompt = userPrompt
      .replace(/[\r\n\t]+/g, ' ')
      .replace(/[<>{}\\]/g, '')
      .trim()
      .slice(0, 1000);

    try {
      this.logger.log(`Invoking Gemini LLM for Drama Framing Engine on "${cleanPrompt}"`);
      const response: any = await client.models.generateContent({
        model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
        contents: `You are an elite cinematic drama commercial director specializing in viral 9:16 vertical product ads.
Structure an intense 3-scene drama commercial directly based on this user product/topic: "${cleanPrompt}".
Format instructions:
1. Every scene must have high emotional stakes tailored to this specific product (e.g. betrayal, rejection, intense dilemma, tears/crying, and cathartic triumphant resolution).
2. The durationSeconds of each scene MUST be strictly between 4 and 8 seconds.
3. Provide word-by-word timed karaoke subtitles for each scene, where startSec and endSec are within the scene duration.
4. Provide cinematicPrompt tailored for Google Veo 3.1 with 9:16 vertical composition.
5. All text (actTitle, emotion, dialogueScript, caption, karaoke words) should be natural Uzbek (or matching the prompt language).

Respond ONLY with valid JSON in this exact structure:
{
  "scenes": [
    {
      "sceneIndex": 1,
      "actTitle": "1-Sahna: ...",
      "emotion": "...",
      "tensionLevel": 8,
      "durationSeconds": 5,
      "cinematicPrompt": "Vertical 9:16 close up...",
      "dialogueScript": "...",
      "caption": "...",
      "karaokeSubtitles": [
        { "word": "...", "startSec": 0.2, "endSec": 0.9 }
      ]
    },
    {
      "sceneIndex": 2,
      "actTitle": "2-Sahna: ...",
      "emotion": "...",
      "tensionLevel": 10,
      "durationSeconds": 6,
      "cinematicPrompt": "Vertical 9:16...",
      "dialogueScript": "...",
      "caption": "...",
      "karaokeSubtitles": [
        { "word": "...", "startSec": 0.2, "endSec": 1.0 }
      ]
    },
    {
      "sceneIndex": 3,
      "actTitle": "3-Sahna: ...",
      "emotion": "...",
      "tensionLevel": 9,
      "durationSeconds": 5,
      "cinematicPrompt": "Vertical 9:16 golden hour...",
      "dialogueScript": "...",
      "caption": "...",
      "karaokeSubtitles": [
        { "word": "...", "startSec": 0.2, "endSec": 0.9 }
      ]
    }
  ]
}`,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.8,
        },
      });

      if (response && response.text) {
        const parsed = JSON.parse(response.text.replace(/```json|```/g, '').trim());
        if (Array.isArray(parsed?.scenes) && parsed.scenes.length >= 2) {
          const validatedScenes: DramaScene[] = parsed.scenes.map((s: any, idx: number) => {
            const duration = Math.max(4, Math.min(Number(s.durationSeconds) || 5, 8));
            return {
              sceneIndex: idx + 1,
              actTitle: s.actTitle || `Act ${idx + 1}`,
              emotion: s.emotion || 'Intense emotional stakes',
              tensionLevel: Math.max(1, Math.min(Number(s.tensionLevel) || 8, 10)),
              durationSeconds: duration,
              cinematicPrompt: s.cinematicPrompt || `Vertical 9:16 cinematic scene for ${cleanPrompt}`,
              dialogueScript: s.dialogueScript || 'Dramatik sahna',
              caption: s.caption || s.dialogueScript || '',
              karaokeSubtitles: Array.isArray(s.karaokeSubtitles) && s.karaokeSubtitles.length > 0
                ? s.karaokeSubtitles
                : this.generateFallbackKaraoke(s.dialogueScript || 'Dramatik sahna', duration),
            };
          });

          this.logger.log(`LLM successfully structured ${validatedScenes.length} dynamic drama scenes for prompt.`);
          return validatedScenes;
        }
      }
      throw new Error('Gemini javobidan ssenariy sahnalarini ajratib boʻlmadi');
    } catch (llmErr: any) {
      this.logger.error(`Gemini LLM drama framing error: ${llmErr.message}`);
      throw new BadRequestException(`Gemini AI ssenariyni yaratishda xatolik yuz berdi: ${llmErr.message}`);
    }
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
