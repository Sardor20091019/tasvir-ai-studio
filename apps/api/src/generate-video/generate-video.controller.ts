import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { GenerateVideoService, AspectRatioType } from './generate-video.service';

@Controller('generate-video')
export class GenerateVideoController {
  constructor(@Inject(GenerateVideoService) private readonly generateVideoService: GenerateVideoService) {}

  @Post()
  async createVideoJob(
    @Body()
    body: {
      prompt: string;
      aspectRatio?: AspectRatioType;
      durationSeconds?: number;
      style?: string;
    },
  ) {
    const prompt = (body?.prompt || '').trim();
    if (!prompt) {
      throw new BadRequestException('Video yaratish uchun matnli prompt kiritilishi shart');
    }

    if (prompt.length > 2000) {
      throw new BadRequestException('Prompt uzunligi 2000 belgidan oshmasligi kerak');
    }

    return this.generateVideoService.startGeneration({
      prompt,
      aspectRatio: body.aspectRatio,
      durationSeconds: body.durationSeconds,
      style: body.style,
    });
  }

  @Get(':jobId')
  async getJob(@Param('jobId') jobId: string) {
    return this.generateVideoService.getJob(jobId);
  }

  @Get('status/:jobId')
  async getJobStatus(@Param('jobId') jobId: string) {
    return this.generateVideoService.getJob(jobId);
  }
}
