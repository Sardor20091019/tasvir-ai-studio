import { Injectable, Logger } from '@nestjs/common';
import { UTApi, UTFile } from 'uploadthing/server';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class UploadThingService {
  private readonly logger = new Logger(UploadThingService.name);
  private utapi: UTApi | null = null;

  constructor() {
    const rawToken = process.env.UPLOADTHING_TOKEN;
    if (rawToken && rawToken !== 'YOUR_UPLOADTHING_TOKEN_HERE') {
      try {
        const cleanToken = rawToken.replace(/^['"]|['"]$/g, '').trim();
        this.utapi = new UTApi({ token: cleanToken });
        this.logger.log('UploadThing client initialized successfully with UPLOADTHING_TOKEN.');
      } catch (err: any) {
        this.logger.error(`Failed to initialize UTApi: ${err.message}`);
      }
    } else {
      this.logger.warn('UPLOADTHING_TOKEN is not set or is a placeholder.');
    }
  }

  /**
   * Upload video buffer or local file path to UploadThing and return the permanent CDN URL
   */
  async uploadVideo(
    source: Buffer | string,
    filename: string = 'tasvir-ai-video.mp4',
  ): Promise<string | null> {
    if (!this.utapi) {
      this.logger.warn('UTApi not configured, skipping UploadThing cloud save.');
      return null;
    }

    try {
      let buffer: Buffer;
      if (typeof source === 'string') {
        // If it's a file path on disk
        if (fs.existsSync(source)) {
          buffer = fs.readFileSync(source);
        } else {
          // If it starts with /videos/, try finding it in public
          const publicPath = path.resolve(__dirname, '../../../web/public', source.replace(/^\//, ''));
          if (fs.existsSync(publicPath)) {
            buffer = fs.readFileSync(publicPath);
          } else {
            return null;
          }
        }
      } else {
        buffer = source;
      }

      const file = new UTFile([new Uint8Array(buffer)], filename, { type: 'video/mp4' });
      this.logger.log(`Uploading ${filename} (${buffer.byteLength} bytes) to UploadThing...`);

      const res = await this.utapi.uploadFiles(file);

      if (res && res.data) {
        const ufsUrl = res.data.ufsUrl || res.data.url;
        this.logger.log(`Successfully saved video to UploadThing: ${ufsUrl}`);
        return ufsUrl;
      } else if (res && res.error) {
        this.logger.error(`UploadThing upload returned error: ${res.error.message}`);
      }
    } catch (err: any) {
      this.logger.error(`UploadThing save error: ${err.message}`);
    }

    return null;
  }
}
