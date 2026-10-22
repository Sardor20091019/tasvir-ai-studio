import { Injectable, Logger } from '@nestjs/common';
import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// Path to static ffmpeg binary installed in node_modules
// eslint-disable-next-line @typescript-eslint/no-var-requires
const ffmpegPath: string = require('ffmpeg-static') || 'ffmpeg';

export interface ConcatOptions {
  sceneClipPaths: string[];
  outputPath: string;
  backgroundMusicPath?: string;
  includeBackgroundMusic: boolean;
  totalDurationSeconds: number;
}

@Injectable()
export class FfmpegConcatService {
  private readonly logger = new Logger(FfmpegConcatService.name);

  getFfmpegPath(): string {
    return ffmpegPath;
  }

  /**
   * Concat multiple 9:16 scene clips sequentially into one continuous master video file
   * using FFmpeg concat demuxer (-f concat -safe 0) and optional audio mix with EMIN & JONY - Kamin.
   */
  async concatScenes(options: ConcatOptions): Promise<string> {
    const {
      sceneClipPaths,
      outputPath,
      backgroundMusicPath,
      includeBackgroundMusic,
      totalDurationSeconds,
    } = options;

    if (!sceneClipPaths || sceneClipPaths.length === 0) {
      throw new Error('Hech qanday video sahnalari taqdim etilmadi');
    }

    // Ensure output directory exists
    const outDir = path.dirname(outputPath);
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    // Create temporary concat demuxer manifest file
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tasvir-concat-'));
    const concatListPath = path.join(tempDir, 'concat_list.txt');

    const concatContent = sceneClipPaths
      .map((p) => `file '${path.resolve(p).replace(/'/g, "'\\''")}'`)
      .join('\n');

    fs.writeFileSync(concatListPath, concatContent, 'utf8');
    this.logger.log(`Created FFmpeg concat manifest with ${sceneClipPaths.length} scenes at ${concatListPath}`);

    // Determine background music overlay settings
    const musicExists = backgroundMusicPath && fs.existsSync(backgroundMusicPath);
    const shouldMixMusic = includeBackgroundMusic && musicExists;

    const ffmpegArgs: string[] = [
      '-y', // Overwrite output
      '-f',
      'concat',
      '-safe',
      '0',
      '-i',
      concatListPath,
    ];

    if (shouldMixMusic && backgroundMusicPath) {
      this.logger.log(
        `Overlaying background music: "Kamin" by EMIN & JONY from ${backgroundMusicPath} (duration: ${totalDurationSeconds}s)`,
      );
      // Stream loop music to cover total scene duration perfectly
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

    // Vertical 9:16 HD encoding parameters (1080x1920)
    ffmpegArgs.push(
      '-vf',
      'scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2,setsar=1',
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
          this.logger.log(`Successfully concatenated master dramatic video to ${outputPath}`);
          resolve(outputPath);
        } else {
          this.logger.error(`FFmpeg concat failed with exit code ${code}:\n${stderrOutput.slice(-800)}`);
          reject(new Error(`FFmpeg concat muvaffaqiyatsiz tugadi (kod: ${code})`));
        }
      });
    });
  }

  /**
   * Synthesize an individual vertical 9:16 high-intensity drama clip
   * with Ken Burns slow cinematic camera motion, mood lighting, and audio chime.
   * Duration is strictly clamped between 4 and 8 seconds.
   */
  async synthesizeDramaSceneClip(params: {
    outputPath: string;
    durationSeconds: number; // strictly 4 to 8 seconds
    sceneIndex: number;
    tensionLevel: number;
    caption: string;
  }): Promise<string> {
    const { outputPath, sceneIndex, caption } = params;
    // Constraint: clip duration strictly between 4 and 8 seconds
    const duration = Math.max(4, Math.min(params.durationSeconds || 5, 8));

    const outDir = path.dirname(outputPath);
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    // Color tones for dramatic acts:
    // Act 1: Cold dramatic dark blue/slate (#0B1120)
    // Act 2: High stakes crimson tension (#1F0A10)
    // Act 3: Golden redemption / triumphant resolution (#1C1405)
    const bgColors = ['0x0B1120', '0x1F0A10', '0x1C1405'];
    const color = bgColors[(sceneIndex - 1) % bgColors.length];

    // Audio chime frequencies for emotional tension
    const toneFreqs = [220, 293.66, 329.63];
    const freq = toneFreqs[(sceneIndex - 1) % toneFreqs.length];

    // Escape caption for FFmpeg drawtext
    const safeCaption = caption.replace(/['":\\]/g, ' ').slice(0, 50);

    const ffmpegArgs: string[] = [
      '-y',
      // Generate vertical 9:16 solid color canvas
      '-f',
      'lavfi',
      '-i',
      `color=c=${color}:s=1080x1920:d=${duration}:r=30`,
      // Generate dramatic synthesized mood tone audio
      '-f',
      'lavfi',
      '-i',
      `sine=frequency=${freq}:duration=${duration}`,
      '-filter_complex',
      `[0:v]noise=alls=12:allf=t+u,drawbox=x=40:y=1600:w=1000:h=180:color=black@0.65:t=fill,drawtext=text='${safeCaption}':fontcolor=white:fontsize=48:x=(w-text_w)/2:y=1660[v];[1:a]volume=0.4,afade=t=in:st=0:d=1,afade=t=out:st=${duration - 1}:d=1[a]`,
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

