import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Req,
  BadRequestException,
  Inject,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { GenerateVideoService, AspectRatioType, DramaScene } from './generate-video.service';
import { InMemoryRateLimiter } from '../auth/rate-limiter';
import { AuthGuard } from '../auth/guards/auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

const JOB_ID_REGEX = /^[a-zA-Z0-9_-]{4,64}$/;

@Controller('generate-video')
export class GenerateVideoController {
  constructor(@Inject(GenerateVideoService) private readonly generateVideoService: GenerateVideoService) {}

  @Post('plan-scenes')
  @UseGuards(AuthGuard)
  async planScenes(
    @Req() req: Request,
    @CurrentUser('id') currentUserId: string,
    @Body()
    body: {
      prompt: string;
      dramaLevel?: string;
    },
  ) {
    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket?.remoteAddress || 'unknown';
    InMemoryRateLimiter.check(
      `plan_scenes:${clientIp}`,
      20,
      5 * 60 * 1000,
      'Ssenariy generatsiyasi soʻrovlari cheklovi oshdi. Iltimos, 5 daqiqadan soʻng qayta urinib koʻring.',
    );

    const prompt = (body?.prompt || '').trim();
    if (!prompt) {
      throw new BadRequestException('Ssenariy yaratish uchun matnli prompt kiritilishi shart');
    }

    if (prompt.length > 2000) {
      throw new BadRequestException('Prompt uzunligi 2000 belgidan oshmasligi kerak');
    }

    return this.generateVideoService.planScenes({
      prompt,
      dramaLevel: body.dramaLevel,
    });
  }

  @Post()
  @UseGuards(AuthGuard)
  async createVideoJob(
    @Req() req: Request,
    @CurrentUser('id') currentUserId: string,
    @Body()
    body: {
      prompt: string;
      scenes?: DramaScene[];
      aspectRatio?: AspectRatioType;
      includeBackgroundMusic?: boolean;
      dramaLevel?: string;
    },
  ) {
    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket?.remoteAddress || 'unknown';
    InMemoryRateLimiter.check(
      `generate_video:${clientIp}`,
      15,
      5 * 60 * 1000,
      'Video generatsiyasi soʻrovlari cheklovi oshdi. Iltimos, 5 daqiqadan soʻng qayta urinib koʻring.',
    );

    const prompt = (body?.prompt || '').trim();
    if (!prompt) {
      throw new BadRequestException('Video yaratish uchun matnli prompt kiritilishi shart');
    }

    if (prompt.length > 2000) {
      throw new BadRequestException('Prompt uzunligi 2000 belgidan oshmasligi kerak');
    }

    return this.generateVideoService.startGeneration({
      prompt,
      scenes: body.scenes,
      aspectRatio: '9:16',
      includeBackgroundMusic: body.includeBackgroundMusic,
      dramaLevel: body.dramaLevel,
    });
  }

  @Get(':jobId')
  async getJob(@Param('jobId') jobId: string) {
    if (!JOB_ID_REGEX.test(jobId)) {
      throw new BadRequestException('Yaroqsiz vazifa ID formati');
    }
    return this.generateVideoService.getJob(jobId);
  }

  @Get('status/:jobId')
  async getJobStatus(@Param('jobId') jobId: string) {
    if (!JOB_ID_REGEX.test(jobId)) {
      throw new BadRequestException('Yaroqsiz vazifa ID formati');
    }
    return this.generateVideoService.getJob(jobId);
  }
}
