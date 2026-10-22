import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { ProductsModule } from './products/products.module';
import { VideoJobsModule } from './video-jobs/video-jobs.module';
import { BillingModule } from './billing/billing.module';
import { GenerateVideoModule } from './generate-video/generate-video.module';
import { StorageModule } from './storage/storage.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    ProductsModule,
    VideoJobsModule,
    BillingModule,
    GenerateVideoModule,
    StorageModule,
  ],
  controllers: [AppController],
})
export class AppModule {}

