import { Global, Module } from '@nestjs/common';
import { UploadThingService } from './uploadthing.service';

@Global()
@Module({
  providers: [UploadThingService],
  exports: [UploadThingService],
})
export class StorageModule {}
