import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Res,
  UseGuards,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { Response } from 'express';
import { VideoJobsService } from './video-jobs.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Controller('video-jobs')
export class VideoJobsController {
  constructor(@Inject(VideoJobsService) private readonly videoJobsService: VideoJobsService) {}

  @Get('avatars')
  async getAvatars() {
    return this.videoJobsService.getAvatars();
  }

  @Post('generate-script')
  async generateScript(
    @Body()
    body: {
      productTitle: string;
      category?: string;
      priceUzs?: number;
      tone: 'discount_hook' | 'quality_review' | 'short_reels';
      dialect?: string;
    },
  ) {
    return this.videoJobsService.generateAiScript(body);
  }

  @Post('tts-preview')
  async ttsPreview(
    @Body()
    body: {
      avatarId?: string;
      scriptText: string;
    },
  ) {
    if (!body.avatarId || !UUID_REGEX.test(body.avatarId)) {
      throw new BadRequestException('Yaroqsiz avatar ID');
    }
    return this.videoJobsService.getTtsAudioPreview(body.avatarId, body.scriptText);
  }

  @Post('render')
  @UseGuards(AuthGuard)
  async createRenderJob(
    @CurrentUser('id') currentUserId: string,
    @Body()
    body: {
      userId?: string;
      productId: string;
      avatarId: string;
      platformPreset: string;
      scriptTone: string;
      scriptText: string;
    },
  ) {
    return this.videoJobsService.createRenderJob({
      ...body,
      userId: currentUserId,
    });
  }

  @Get()
  @UseGuards(AuthGuard)
  async listUserJobs(@CurrentUser('id') currentUserId: string) {
    return this.videoJobsService.listUserJobs(currentUserId);
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  async getJob(
    @Param('id') id: string,
    @CurrentUser('id') currentUserId: string,
  ) {
    if (!UUID_REGEX.test(id)) {
      throw new BadRequestException('Yaroqsiz vazifa ID formati');
    }
    return this.videoJobsService.getJobById(id, currentUserId);
  }

  @Get('audio-mock/:avatarId')
  async getAudioMock(@Param('avatarId') avatarId: string, @Res() res: Response) {
    if (!UUID_REGEX.test(avatarId)) {
      throw new BadRequestException('Yaroqsiz avatar ID');
    }

    const sampleRate = 44100;
    const durationSec = 1.2;
    const numSamples = Math.floor(sampleRate * durationSec);
    const buffer = Buffer.alloc(44 + numSamples * 2);

    buffer.write('RIFF', 0);
    buffer.writeUInt32LE(36 + numSamples * 2, 4);
    buffer.write('WAVE', 8);

    buffer.write('fmt ', 12);
    buffer.writeUInt32LE(16, 16);
    buffer.writeUInt16LE(1, 20); 
    buffer.writeUInt16LE(1, 22); 
    buffer.writeUInt32LE(sampleRate, 24);
    buffer.writeUInt32LE(sampleRate * 2, 28);
    buffer.writeUInt16LE(2, 32);
    buffer.writeUInt16LE(16, 34);

    buffer.write('data', 36);
    buffer.writeUInt32LE(numSamples * 2, 40);

    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const freq = 320 + Math.sin(t * 12) * 80;
      const sample = Math.sin(2 * Math.PI * freq * t) * 0.3 * Math.exp(-t * 1.5) * 32767;
      buffer.writeInt16LE(Math.floor(sample), 44 + i * 2);
    }

    res.set({
      'Content-Type': 'audio/wav',
      'Content-Length': buffer.length.toString(),
      'Cache-Control': 'public, max-age=3600',
      'X-Content-Type-Options': 'nosniff',
    });
    res.end(buffer);
  }
}
