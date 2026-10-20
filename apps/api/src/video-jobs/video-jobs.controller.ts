import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Headers,
  Res,
  Inject,
} from '@nestjs/common';
import { Response } from 'express';
import { VideoJobsService } from './video-jobs.service';

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
      avatarId: string;
      scriptText: string;
    },
  ) {
    return this.videoJobsService.getTtsAudioPreview(body.avatarId, body.scriptText);
  }

  @Post('render')
  async createRenderJob(
    @Body()
    body: {
      userId: string;
      productId: string;
      avatarId: string;
      platformPreset: string;
      scriptTone: string;
      scriptText: string;
    },
  ) {
    return this.videoJobsService.createRenderJob(body);
  }

  @Get()
  async listUserJobs(
    @Query('userId') queryUserId?: string,
    @Headers('x-user-id') headerUserId?: string,
  ) {
    return this.videoJobsService.listUserJobs(queryUserId || headerUserId);
  }

  @Get(':id')
  async getJob(@Param('id') id: string) {
    return this.videoJobsService.getJobById(id);
  }

  // Audio mock wav endpoint
  @Get('audio-mock/:avatarId')
  async getAudioMock(@Param('avatarId') avatarId: string, @Res() res: Response) {
    // Generate a minimal valid 1-second 44.1kHz mono WAV file in memory
    const sampleRate = 44100;
    const durationSec = 1.2;
    const numSamples = Math.floor(sampleRate * durationSec);
    const buffer = Buffer.alloc(44 + numSamples * 2);

    // RIFF chunk
    buffer.write('RIFF', 0);
    buffer.writeUInt32LE(36 + numSamples * 2, 4);
    buffer.write('WAVE', 8);

    // fmt subchunk
    buffer.write('fmt ', 12);
    buffer.writeUInt32LE(16, 16);
    buffer.writeUInt16LE(1, 20); // PCM
    buffer.writeUInt16LE(1, 22); // mono
    buffer.writeUInt32LE(sampleRate, 24);
    buffer.writeUInt32LE(sampleRate * 2, 28);
    buffer.writeUInt16LE(2, 32);
    buffer.writeUInt16LE(16, 34);

    // data subchunk
    buffer.write('data', 36);
    buffer.writeUInt32LE(numSamples * 2, 40);

    // Generate gentle chime/voice frequency (440Hz modulated)
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
    });
    res.end(buffer);
  }
}
