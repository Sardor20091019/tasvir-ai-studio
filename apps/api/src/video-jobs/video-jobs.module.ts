import { Module } from '@nestjs/common';
import { VideoJobsController } from './video-jobs.controller';
import { VideoJobsService } from './video-jobs.service';

@Module({
  controllers: [VideoJobsController],
  providers: [VideoJobsService],
  exports: [VideoJobsService],
})
export class VideoJobsModule {}

