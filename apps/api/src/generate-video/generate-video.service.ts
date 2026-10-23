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
  }): Promise<{ prompt: string; scenes: DramaScene[]; totalDurationSeconds: number }> {
    const { client, activeKey } = this.getGeminiClient();
    const openaiKey = this.getOpenAIKey();

    if (!activeKey && !openaiKey) {
      throw new BadRequestException(
        'AI ssenariyni yaratish uchun serverda OPENAI_API_KEY yoki GEMINI_API_KEY sozlanishi shart.',
      );
    }

    const productImg = params.productImageUrl || params.imageUrl;
    const scenes = await this.generateDramaScenesWithLLM(client, activeKey, params.prompt, productImg);
    const totalDurationSeconds = scenes.reduce((acc, s) => acc + s.durationSeconds, 0);

    return {
      prompt: params.prompt,
      scenes,
      totalDurationSeconds,
    };
  }

  async startGeneration(params: {
    prompt: string;
    productImageUrl?: string;
    imageUrl?: string;
    scenes?: DramaScene[];
    aspectRatio?: AspectRatioType;
    resolution?: string;
    includeBackgroundMusic?: boolean;
    dramaLevel?: string;
  }): Promise<{ jobId: string; status: string; progress: number; message: string; model: string }> {
    const jobId = `drama_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const aspectRatio: AspectRatioType = '9:16';
    const resolution = params.resolution || process.env.GEMINI_VIDEO_RESOLUTION || '360p';
    const modelTier = process.env.GEMINI_VIDEO_MODEL || 'gemini-omni-1.1-flash';
    const includeBackgroundMusic = params.includeBackgroundMusic === true;
    const productImageUrl = params.productImageUrl || params.imageUrl;

    const initialScenes = Array.isArray(params.scenes) && params.scenes.length > 0 ? params.scenes : [];
    const totalDurationSeconds = initialScenes.length > 0
      ? initialScenes.reduce((acc, s) => acc + s.durationSeconds, 0)
      : 24;

    const job: DramaVideoGenerationJob = {
      jobId,
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
      createdAt: new Date().toISOString(),
    };

    this.jobs.set(jobId, job);
    this.logger.log(
      `Created video job ${jobId} (Model: ${modelTier}, Resolution: ${resolution}, 9:16, Music: ${includeBackgroundMusic ? 'ON' : 'OFF'}, Pre-confirmed scenes: ${initialScenes.length})`,
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
      message: `${modelTier} (${resolution}) video generatsiyasi boshlandi`,
      model: modelTier,
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

      scenes = await this.generateDramaScenesWithLLM(
        client,
        activeKey,
        job.prompt,
        job.productImageUrl,
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
    const targetModel = job.modelTier || process.env.GEMINI_VIDEO_MODEL || 'gemini-omni-1.1-flash';
    const targetResolution = job.resolution || process.env.GEMINI_VIDEO_RESOLUTION || '360p';

    job.currentStepMessage = `${targetModel} (${targetResolution}) orqali 9:16 sahna kadrlari generatsiya qilinmoqda...`;

    job.status = 'generating_veo_clips';
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), `tasvir-veo-${jobId}-`));
    const generatedClipPaths: string[] = [];

    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      const sceneDuration = Math.max(4, Math.min(scene.durationSeconds, 8));
      scene.durationSeconds = sceneDuration;

      job.currentStepMessage = `${targetModel}: Sahna ${i + 1}/${scenes.length} ("${scene.actTitle}") render qilinmoqda (${sceneDuration}s, ${targetResolution})...`;
      job.progress = 40 + Math.floor((i / scenes.length) * 30);

      const clipOutputPath = path.join(tempDir, `scene_${scene.sceneIndex}.mp4`);
      let clipGenerated = false;

      if (activeKey) {
        try {
          this.logger.log(
            `Calling Google ${targetModel} [resolution: ${targetResolution}, duration: ${sceneDuration}s, aspect: 9:16] for scene ${scene.sceneIndex}`,
          );

          const videoPrompt = `${scene.cinematicPrompt}, vertical 9:16 aspect ratio, dramatic cinematic lighting, ${targetResolution} quality, cinematic tension, movie cinematography`;

          // 1. Native Gemini Omni 1.1 Flash conversational interactions API
          if (client.interactions && typeof (client.interactions as any).create === 'function') {
            try {
              const interactionRes: any = await (client.interactions as any).create({
                model: targetModel,
                input: videoPrompt,
                response_format: {
                  type: 'video',
                  resolution: targetResolution,
                },
              });

              const interactionVideo = interactionRes?.output?.video;
              if (interactionVideo?.videoBytes) {
                fs.writeFileSync(clipOutputPath, Buffer.from(interactionVideo.videoBytes, 'base64'));
                clipGenerated = true;
                scene.localClipPath = clipOutputPath;
                this.logger.log(`${targetModel} scene ${scene.sceneIndex} saved directly from interaction videoBytes`);
              } else if (interactionVideo?.uri) {
                scene.clipVideoUrl = interactionVideo.uri;
                this.logger.log(`${targetModel} scene ${scene.sceneIndex} produced video URI: ${interactionVideo.uri}`);
                const downloaded = await this.downloadVeoVideo(interactionVideo.uri, clipOutputPath, activeKey);
                if (downloaded) {
                  clipGenerated = true;
                  scene.localClipPath = clipOutputPath;
                }
              }
            } catch (interactionErr: any) {
              this.logger.warn(`Interactions API with ${targetModel} notice: ${interactionErr.message}`);
            }
          }

          // 2. Standard Models generateVideos interface
          if (!clipGenerated && client.models && typeof (client.models as any).generateVideos === 'function') {
            const videoOperation: any = await (client.models as any).generateVideos({
              model: targetModel,
              prompt: videoPrompt,
              config: {
                aspectRatio: '9:16',
                resolution: targetResolution,
                durationSeconds: sceneDuration,
                numberOfVideos: 1,
              },
            });

            if (videoOperation) {
              let op = videoOperation;
              let attempts = 0;
              while (!op.done && attempts < 20) {
                await sleep(3000);
                attempts++;
                try {
                  if ((client.operations as any)?.getVideosOperation) {
                    op = await (client.operations as any).getVideosOperation({ operation: op });
                  } else if (typeof (client.operations as any)?.get === 'function') {
                    op = await (client.operations as any).get({ operation: op });
                  } else {
                    break;
                  }
                } catch (opErr) {
                  break;
                }
              }

              const videoResult = op.response?.generatedVideos?.[0]?.video;
              if (videoResult) {
                if (videoResult.videoBytes) {
                  fs.writeFileSync(clipOutputPath, Buffer.from(videoResult.videoBytes, 'base64'));
                  clipGenerated = true;
                  scene.localClipPath = clipOutputPath;
                  this.logger.log(`${targetModel} scene ${scene.sceneIndex} saved directly from videoBytes`);
                } else if (videoResult.uri) {
                  scene.clipVideoUrl = videoResult.uri;
                  this.logger.log(`${targetModel} scene ${scene.sceneIndex} produced video URI: ${videoResult.uri}`);
                  const downloaded = await this.downloadVeoVideo(videoResult.uri, clipOutputPath, activeKey);
                  if (downloaded) {
                    clipGenerated = true;
                    scene.localClipPath = clipOutputPath;
                  }
                }
              }
            }
          }
        } catch (veoErr: any) {
          this.logger.warn(`Google ${targetModel} call notice: ${veoErr.message}. Synthesizing 9:16 vertical drama clip at ${targetResolution}.`);
        }
      }

      if (!clipGenerated) {
        try {
          await this.ffmpegConcatService.synthesizeDramaSceneClip({
            outputPath: clipOutputPath,
            durationSeconds: sceneDuration,
            sceneIndex: scene.sceneIndex,
            tensionLevel: scene.tensionLevel,
            caption: scene.caption || scene.dialogueScript,
            resolution: targetResolution,
          });

          scene.localClipPath = clipOutputPath;
          clipGenerated = true;
        } catch (synthErr: any) {
          this.logger.error(`Error synthesizing clip for scene ${scene.sceneIndex}: ${synthErr.message}`);
        }
      }

      if (clipGenerated && fs.existsSync(clipOutputPath)) {
        generatedClipPaths.push(clipOutputPath);
      }

      await sleep(1000);
    }

    if (generatedClipPaths.length === 0) {
      throw new Error('Hech qanday dramatik video sahnalarini shakllantirib boʻlmadi');
    }

    job.status = 'concatenating_master_video';
    job.progress = 80;
    job.currentStepMessage = `FFmpeg concat orqali sahnalar master videoga birlashtirilmoqda (${targetResolution})...`;

    const masterOutputPath = path.join(tempDir, `master_drama_${jobId}.mp4`);

    await this.ffmpegConcatService.concatScenes({
      sceneClipPaths: generatedClipPaths,
      outputPath: masterOutputPath,
      includeBackgroundMusic: job.includeBackgroundMusic,
      totalDurationSeconds: job.totalDurationSeconds,
      resolution: targetResolution,
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
        const candidates = [
          path.resolve(process.cwd(), 'apps/web/public/generated-videos'),
          path.resolve(process.cwd(), '../web/public/generated-videos'),
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

  private async downloadVeoVideo(uri: string, outputPath: string, apiKey: string): Promise<boolean> {
    try {
      if (uri.startsWith('http://') || uri.startsWith('https://')) {
        const headers: Record<string, string> = {};
        if (apiKey) {
          headers['x-goog-api-key'] = apiKey;
        }
        const res = await fetch(uri, { headers });
        if (res.ok) {
          const arrayBuffer = await res.arrayBuffer();
          fs.writeFileSync(outputPath, Buffer.from(arrayBuffer));
          return true;
        }
      }
      return false;
    } catch (e: any) {
      this.logger.warn(`Failed to download Veo video from ${uri}: ${e.message}`);
      return false;
    }
  }

  private async generateDramaScenesWithLLM(
    client: GoogleGenAI,
    activeKey: string,
    userPrompt: string,
    productImageUrl?: string,
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
          `Invoking OpenAI (Story & Cinematic Director) to write story for: "${cleanPrompt.slice(0, 60)}" (Product Image: ${productImageUrl ? 'YES' : 'NO'})`,
        );
        const scenes = await this.generateDramaScenesWithOpenAI(openaiKey, cleanPrompt, productImageUrl);
        if (scenes && scenes.length >= 2) {
          this.logger.log(`OpenAI successfully authored ${scenes.length} viral drama scenes.`);
          return scenes;
        }
      } catch (openAiErr: any) {
        this.logger.warn(`OpenAI story engine notice: ${openAiErr.message}. Falling back to Gemini story engine.`);
      }
    }

    if (activeKey) {
      return this.generateDramaScenesWithGemini(client, activeKey, cleanPrompt, productImageUrl);
    }

    throw new BadRequestException(
      'AI ssenariyni yaratish uchun OPENAI_API_KEY yoki GEMINI_API_KEY serverda sozlanishi shart.',
    );
  }

  private async generateDramaScenesWithOpenAI(
    openaiKey: string,
    cleanPrompt: string,
    productImageUrl?: string,
  ): Promise<DramaScene[]> {
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

    const promptText = `Create the production-ready scenario and scene plan for AI video generation based on: "${cleanPrompt}".
${
  productImageUrl
    ? 'A reference photo of the user\'s product is provided. Inspect the product image carefully: preserve its shape, packaging, label design, and colors. Craft a compelling, emotional story that organically features this product and culminates in a high-production Commercial Product Advertisement Ending (Mode F).'
    : 'If this prompt relates to a product, conclude with a high-production commercial studio advertisement ending.'
}
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
  ): Promise<DramaScene[]> {
    this.logger.log(
      `Invoking Gemini LLM for Drama Framing Engine on "${cleanPrompt}" (Product Image: ${productImageUrl ? 'YES' : 'NO'})`,
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
        emotion: s.emotion || 'Intense emotional stakes',
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
