import { Injectable, Logger } from '@nestjs/common';
import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

let ffmpegPath: string = 'ffmpeg';
try {
  ffmpegPath = require('ffmpeg-static') || 'ffmpeg';
} catch {
  // ffmpeg binary fallback from system PATH
}

export interface ConcatOptions {
  sceneClipPaths: string[];
  outputPath: string;
  backgroundMusicPath?: string;
  includeBackgroundMusic: boolean;
  totalDurationSeconds: number;
  resolution?: string;
}

@Injectable()
export class FfmpegConcatService {
  private readonly logger = new Logger(FfmpegConcatService.name);

  getFfmpegPath(): string {
    return ffmpegPath;
  }

  getResolutionDimensions(resolution: string = '360p'): {
    width: number;
    height: number;
    scaleFilter: string;
    captionY: number;
    boxY: number;
    boxW: number;
    boxH: number;
    fontSize: number;
  } {
    const res = (resolution || '360p').toLowerCase();
    if (res === '1080p' || res === '1080') {
      return {
        width: 1080,
        height: 1920,
        scaleFilter: 'scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2,setsar=1',
        captionY: 1660,
        boxY: 1600,
        boxW: 1000,
        boxH: 180,
        fontSize: 48,
      };
    }
    if (res === '720p' || res === '720') {
      return {
        width: 720,
        height: 1280,
        scaleFilter: 'scale=720:1280:force_original_aspect_ratio=decrease,pad=720:1280:(ow-iw)/2:(oh-ih)/2,setsar=1',
        captionY: 1100,
        boxY: 1060,
        boxW: 660,
        boxH: 120,
        fontSize: 32,
      };
    }
    return {
      width: 360,
      height: 640,
      scaleFilter: 'scale=360:640:force_original_aspect_ratio=decrease,pad=360:640:(ow-iw)/2:(oh-ih)/2,setsar=1',
      captionY: 550,
      boxY: 530,
      boxW: 330,
      boxH: 60,
      fontSize: 16,
    };
  }

  async concatScenes(options: ConcatOptions): Promise<string> {
    const {
      sceneClipPaths,
      outputPath,
      backgroundMusicPath,
      includeBackgroundMusic,
      totalDurationSeconds,
      resolution,
    } = options;

    if (!sceneClipPaths || sceneClipPaths.length === 0) {
      throw new Error('Hech qanday video sahnalari taqdim etilmadi');
    }

    const outDir = path.dirname(outputPath);
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tasvir-concat-'));
    const concatListPath = path.join(tempDir, 'concat_list.txt');

    const concatContent = sceneClipPaths
      .map((p) => `file '${path.resolve(p).replace(/'/g, "'\\''")}'`)
      .join('\n');

    fs.writeFileSync(concatListPath, concatContent, 'utf8');
    this.logger.log(`Created FFmpeg concat manifest with ${sceneClipPaths.length} scenes at ${concatListPath}`);

    const musicExists = backgroundMusicPath && fs.existsSync(backgroundMusicPath);
    const shouldMixMusic = includeBackgroundMusic && musicExists;

    const ffmpegArgs: string[] = [
      '-y', 
      '-f',
      'concat',
      '-safe',
      '0',
      '-i',
      concatListPath,
    ];

    if (shouldMixMusic && backgroundMusicPath) {
      this.logger.log(
        `Overlaying background audio track from ${backgroundMusicPath} (duration: ${totalDurationSeconds}s)`,
      );
      ffmpegArgs.push(
        '-stream_loop',
        '-1',
        '-i',
        backgroundMusicPath,
        '-filter_complex',
        `[0:a]volume=1.0[speech];[1:a]volume=0.28[bgm];[speech][bgm]amix=inputs=2:duration=first:dropout_transition=2[aout]`,
        '-map',
        '0:v',
        '-map',
        '[aout]',
      );
    } else {
      this.logger.log('Background music disabled by user or file not found; preserving original speech/scene audio.');
      ffmpegArgs.push('-map', '0:v', '-map', '0:a?');
    }

    const dims = this.getResolutionDimensions(resolution);
    this.logger.log(`Encoding concatenated master video at target resolution: ${dims.width}x${dims.height} (${resolution || '360p'})`);

    ffmpegArgs.push(
      '-vf',
      dims.scaleFilter,
      '-c:v',
      'libx264',
      '-preset',
      'fast',
      '-crf',
      '22',
      '-pix_fmt',
      'yuv420p',
      '-c:a',
      'aac',
      '-b:a',
      '192k',
      '-t',
      totalDurationSeconds.toString(),
      outputPath,
    );

    return new Promise((resolve, reject) => {
      this.logger.log(`Spawning FFmpeg concat demuxer: ${ffmpegPath} ${ffmpegArgs.join(' ')}`);
      const proc = spawn(ffmpegPath, ffmpegArgs);

      let stderrOutput = '';
      proc.stderr.on('data', (chunk) => {
        stderrOutput += chunk.toString();
      });

      proc.on('error', (err) => {
        this.cleanDir(tempDir);
        this.logger.error(`FFmpeg process spawn error: ${err.message}`);
        reject(new Error(`FFmpeg concat xatosi: ${err.message}`));
      });

      proc.on('close', (code) => {
        this.cleanDir(tempDir);
        if (code === 0 && fs.existsSync(outputPath)) {
          this.logger.log(`Successfully concatenated master  video to ${outputPath}`);
          resolve(outputPath);
        } else {
          this.logger.error(`FFmpeg concat failed with exit code ${code}:\n${stderrOutput.slice(-800)}`);
          reject(new Error(`FFmpeg concat muvaffaqiyatsiz tugadi (kod: ${code})`));
        }
      });
    });
  }

  async convertImageToSceneClip(params: {
    imagePath: string;
    outputPath: string;
    durationSeconds: number;
    sceneIndex: number;
    caption?: string;
    resolution?: string;
  }): Promise<string> {
    const { imagePath, outputPath, sceneIndex, caption, resolution } = params;
    const duration = Math.max(3, Math.min(params.durationSeconds || 5, 10));
    const dims = this.getResolutionDimensions(resolution);

    const outDir = path.dirname(outputPath);
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    let filterString = [
      `scale=${dims.width}:${dims.height}:force_original_aspect_ratio=increase`,
      `crop=${dims.width}:${dims.height}`,
      `setsar=1`,
      `format=yuv420p`,
    ].join(',');

    if (caption && caption.trim()) {
      const safeCaption = caption.replace(/['":\\]/g, ' ').trim().slice(0, 50);
      filterString += `,drawbox=x=15:y=${dims.boxY}:w=${dims.boxW}:h=${dims.boxH}:color=black@0.65:t=fill,drawtext=text='${safeCaption}':fontcolor=white:fontsize=${dims.fontSize}:x=(w-text_w)/2:y=${dims.captionY}`;
    }

    const ffmpegArgs: string[] = [
      '-y',
      '-loop',
      '1',
      '-i',
      imagePath,
      '-f',
      'lavfi',
      '-i',
      'anullsrc=r=44100:cl=stereo',
      '-vf',
      filterString,
      '-t',
      String(duration),
      '-c:v',
      'libx264',
      '-preset',
      'ultrafast',
      '-c:a',
      'aac',
      '-shortest',
      outputPath,
    ];

    await this.runFfmpeg(ffmpegArgs, 'convertImageToSceneClip');
    return outputPath;
  }

  async createThematicSceneImage(params: {
    outputPath: string;
    sceneIndex: number;
    actTitle?: string;
    caption?: string;
    tensionLevel?: number;
    resolution?: string;
  }): Promise<string> {
    const { outputPath, sceneIndex, actTitle, caption, resolution } = params;
    const dims = this.getResolutionDimensions(resolution);

    const outDir = path.dirname(outputPath);
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    const bgColors = ['0x0B1120', '0x1F0A10', '0x1C1405', '0x1E1B4B', '0x0F172A'];
    const color = bgColors[(sceneIndex - 1) % bgColors.length];

    const safeTitle = (actTitle || `Sahna ${sceneIndex}`).replace(/['":\\]/g, ' ').trim().slice(0, 40);
    const safeCaption = (caption || '').replace(/['":\\]/g, ' ').trim().slice(0, 50);

    const titleY = Math.floor(dims.height * 0.35);
    const vfParts = [
      'noise=alls=15:allf=t+u',
      `drawbox=x=15:y=${titleY}:w=${dims.width - 30}:h=50:color=black@0.75:t=fill`,
      `drawtext=text='${safeTitle}':fontcolor=0xFFD700:fontsize=${dims.fontSize + 3}:x=(w-text_w)/2:y=${titleY + 16}`,
    ];

    if (safeCaption) {
      vfParts.push(
        `drawbox=x=15:y=${dims.boxY}:w=${dims.boxW}:h=${dims.boxH}:color=black@0.65:t=fill`,
        `drawtext=text='${safeCaption}':fontcolor=white:fontsize=${dims.fontSize}:x=(w-text_w)/2:y=${dims.captionY}`,
      );
    }

    const args = [
      '-y',
      '-f',
      'lavfi',
      '-i',
      `color=c=${color}:s=${dims.width}x${dims.height}:d=1`,
      '-vf',
      vfParts.join(','),
      '-vframes',
      '1',
      outputPath,
    ];

    await this.runFfmpeg(args, 'createThematicSceneImage');
    return outputPath;
  }

  private runFfmpeg(args: string[], opName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.logger.log(`Running FFmpeg [${opName}]: ${ffmpegPath} ${args.join(' ')}`);
      const proc = spawn(ffmpegPath, args);
      let stderrOutput = '';
      proc.stderr.on('data', (d) => {
        stderrOutput += d.toString();
      });
      proc.on('error', (err) => {
        this.logger.error(`FFmpeg [${opName}] spawn error: ${err.message}`);
        reject(new Error(`FFmpeg [${opName}] failed: ${err.message}`));
      });
      proc.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          this.logger.error(`FFmpeg [${opName}] exited with code ${code}: ${stderrOutput.slice(-500)}`);
          reject(new Error(`FFmpeg [${opName}] exited with code ${code}`));
        }
      });
    });
  }

  async synthesizeDramaSceneClip(params: {
    outputPath: string;
    durationSeconds: number; 
    sceneIndex: number;
    tensionLevel: number;
    caption: string;
    resolution?: string;
  }): Promise<string> {
    const { outputPath, sceneIndex, caption, resolution } = params;
    const duration = Math.max(4, Math.min(params.durationSeconds || 5, 8));
    const dims = this.getResolutionDimensions(resolution);

    const outDir = path.dirname(outputPath);
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    const bgColors = ['0x0B1120', '0x1F0A10', '0x1C1405'];
    const color = bgColors[(sceneIndex - 1) % bgColors.length];

    const toneFreqs = [220, 293.66, 329.63];
    const freq = toneFreqs[(sceneIndex - 1) % toneFreqs.length];

    const safeCaption = caption.replace(/['":\\]/g, ' ').slice(0, 50);

    const ffmpegArgs: string[] = [
      '-y',
      '-f',
      'lavfi',
      '-i',
      `color=c=${color}:s=${dims.width}x${dims.height}:d=${duration}:r=30`,
      '-f',
      'lavfi',
      '-i',
      `sine=frequency=${freq}:duration=${duration}`,
      '-filter_complex',
      `[0:v]noise=alls=12:allf=t+u,drawbox=x=15:y=${dims.boxY}:w=${dims.boxW}:h=${dims.boxH}:color=black@0.65:t=fill,drawtext=text='${safeCaption}':fontcolor=white:fontsize=${dims.fontSize}:x=(w-text_w)/2:y=${dims.captionY}[v];[1:a]volume=0.4,afade=t=in:st=0:d=1,afade=t=out:st=${duration - 1}:d=1[a]`,
      '-map',
      '[v]',
      '-map',
      '[a]',
      '-c:v',
      'libx264',
      '-preset',
      'ultrafast',
      '-pix_fmt',
      'yuv420p',
      '-c:a',
      'aac',
      '-b:a',
      '128k',
      '-t',
      duration.toString(),
      outputPath,
    ];

    return new Promise((resolve, reject) => {
      const proc = spawn(ffmpegPath, ffmpegArgs);
      let stderrOutput = '';
      proc.stderr.on('data', (d) => {
        stderrOutput += d.toString();
      });

      proc.on('close', (code) => {
        if (code === 0 && fs.existsSync(outputPath)) {
          resolve(outputPath);
        } else {
          this.logger.warn(`Synthetic drama scene failed with code ${code}, falling back to null: ${stderrOutput.slice(-300)}`);
          reject(new Error(`Sahna yaratish xatosi (kod: ${code})`));
        }
      });
    });
  }

  private cleanDir(dirPath: string): void {
    try {
      if (fs.existsSync(dirPath)) {
        fs.rmSync(dirPath, { recursive: true, force: true });
      }
    } catch (e) {}
  }
}

