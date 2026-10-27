import { Module } from '@nestjs/common';
import { GenerateVideoController } from './generate-video.controller';
import { GenerateVideoService } from './generate-video.service';
import { FfmpegConcatService } from './ffmpeg-concat.service';
import { CloudflareWorkersAiService } from './cloudflare-workers-ai.service';

@Module({
  controllers: [GenerateVideoController],
  providers: [GenerateVideoService, FfmpegConcatService, CloudflareWorkersAiService],
  exports: [GenerateVideoService, FfmpegConcatService, CloudflareWorkersAiService],
})
export class GenerateVideoModule {}

