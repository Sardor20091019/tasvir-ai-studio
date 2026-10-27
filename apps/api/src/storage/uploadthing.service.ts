import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

let UTApiClass: any = null;
let UTFileClass: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ut = require('uploadthing/server');
  UTApiClass = ut.UTApi;
  UTFileClass = ut.UTFile;
} catch {
}

@Injectable()
export class UploadThingService {
  private readonly logger = new Logger(UploadThingService.name);
  private utapi: any = null;

  constructor() {
    this.getUtApi();
  }

  private getUtApi(): any {
    if (this.utapi) return this.utapi;

    let rawToken = (process.env.UPLOADTHING_TOKEN || '').trim();
    if (!rawToken || rawToken === 'YOUR_UPLOADTHING_TOKEN_HERE') {
      const candidates = [
        path.resolve(process.cwd(), 'apps/api/.env'),
        path.resolve(process.cwd(), '.env'),
        path.resolve(__dirname, '../../../../.env'),
        path.resolve(__dirname, '../../.env'),
      ];
      for (const p of candidates) {
        if (fs.existsSync(p)) {
          const content = fs.readFileSync(p, 'utf8');
          for (const line of content.split('\n')) {
            const trimmed = line.trim();
            if (trimmed.startsWith('UPLOADTHING_TOKEN=')) {
              rawToken = trimmed.split('=')[1].trim().replace(/^['"]|['"]$/g, '');
              process.env.UPLOADTHING_TOKEN = rawToken;
              break;
            }
          }
        }
        if (rawToken && rawToken !== 'YOUR_UPLOADTHING_TOKEN_HERE') break;
      }
    }

    if (!rawToken || rawToken === 'YOUR_UPLOADTHING_TOKEN_HERE') {
      rawToken = 'eyJhcGlLZXkiOiJza19saXZlX2QxNmQ0ODBiZmFkZDAyMDNlNjI2NGNkZTFhMTIwMTFhNDE5NzA3NDVmY2NmNDc2YzdlYjk4ZjA5Mzk2M2RiYmMiLCJhcHBJZCI6Im42b2dmcWxiMjEiLCJyZWdpb25zIjpbInNlYTEiXX0=';
      process.env.UPLOADTHING_TOKEN = rawToken;
    }

    if (rawToken && UTApiClass) {
      try {
        const cleanToken = rawToken.replace(/^['"]|['"]$/g, '').trim();
        this.utapi = new UTApiClass({ token: cleanToken });
        this.logger.log('UploadThing client initialized successfully with UPLOADTHING_TOKEN.');
        return this.utapi;
      } catch (err: any) {
        this.logger.error(`Failed to initialize UTApi: ${err.message}`);
      }
    } else {
      this.logger.warn('UPLOADTHING_TOKEN is not set or UTApi is unavailable. Using local storage fallback.');
    }

    return null;
  }

  async uploadVideo(
    source: Buffer | string,
    filename: string = 'tasvir-ai-video.mp4',
  ): Promise<string | null> {
    const ut = this.getUtApi();
    if (!ut || !UTFileClass) {
      this.logger.warn('UTApi not configured, skipping UploadThing cloud save.');
      return null;
    }

    try {
      let buffer: Buffer;
      if (typeof source === 'string') {
        if (source.includes('..')) {
          this.logger.warn(`Rejected path traversal attempt in uploadVideo: ${source}`);
          return null;
        }

        const allowedBaseDir = path.resolve(process.cwd(), 'apps/web/public');
        const resolvedPath = path.resolve(allowedBaseDir, source.replace(/^\//, ''));

        if (!resolvedPath.startsWith(allowedBaseDir)) {
          this.logger.warn(`Path outside allowed base directory blocked: ${source}`);
          return null;
        }

        if (fs.existsSync(resolvedPath)) {
          buffer = fs.readFileSync(resolvedPath);
        } else {
          return null;
        }
      } else {
        buffer = source;
      }

      const file = new UTFileClass([new Uint8Array(buffer)], filename, { type: 'video/mp4' });
      this.logger.log(`Uploading ${filename} (${buffer.byteLength} bytes) to UploadThing...`);

      const res = await ut.uploadFiles(file);

      if (res && res.data) {
        const ufsUrl = res.data.ufsUrl || (res.data.key ? `https://n6ogfqlb21.ufs.sh/f/${res.data.key}` : null);
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

  async uploadImage(
    source: Buffer | string,
    filename: string = 'scene-image.jpg',
  ): Promise<string | null> {
    const ut = this.getUtApi();
    if (!ut || !UTFileClass) {
      return null;
    }

    try {
      let buffer: Buffer;
      if (typeof source === 'string') {
        if (source.includes('..')) {
          return null;
        }
        const allowedBaseDir = path.resolve(process.cwd(), 'apps/web/public');
        const resolvedPath = path.resolve(allowedBaseDir, source.replace(/^\//, ''));
        if (!resolvedPath.startsWith(allowedBaseDir) || !fs.existsSync(resolvedPath)) {
          return null;
        }
        buffer = fs.readFileSync(resolvedPath);
      } else {
        buffer = source;
      }

      const file = new UTFileClass([new Uint8Array(buffer)], filename, { type: 'image/jpeg' });
      const res = await ut.uploadFiles(file);

      if (res && res.data) {
        const ufsUrl = res.data.ufsUrl || (res.data.key ? `https://n6ogfqlb21.ufs.sh/f/${res.data.key}` : null);
        return ufsUrl;
      }
    } catch (err: any) {
      this.logger.warn(`UploadThing image upload notice: ${err.message}`);
    }

    return null;
  }
}
