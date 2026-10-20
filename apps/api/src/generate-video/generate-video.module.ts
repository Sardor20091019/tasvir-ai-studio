import { Module } from '@nestjs/common';
import { GenerateVideoController } from './generate-video.controller';
import { GenerateVideoService } from './generate-video.service';

@Module({
  controllers: [GenerateVideoController],
  providers: [GenerateVideoService],
  exports: [GenerateVideoService],
})
export class GenerateVideoModule {}

