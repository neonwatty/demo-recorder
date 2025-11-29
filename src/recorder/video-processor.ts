import { spawn } from 'child_process';
import path from 'path';
import { logger } from '../utils/logger';

export interface ConversionOptions {
  /** Input video file path */
  inputPath: string;
  /** Output path (auto-generated if not provided) */
  outputPath?: string;
  /** Video codec (default: 'h264') */
  codec?: 'h264' | 'h265';
  /** Quality (0-51, lower = better, default: 23) */
  crf?: number;
}

/**
 * Convert WebM to MP4 using FFmpeg
 */
export async function convertToMp4(options: ConversionOptions): Promise<string> {
  const { inputPath, codec = 'h264', crf = 23 } = options;

  const outputPath = options.outputPath || inputPath.replace(/\.webm$/, '.mp4');

  logger.info(`Converting ${path.basename(inputPath)} to MP4...`);

  return new Promise((resolve, reject) => {
    const codecMap: Record<string, string> = {
      h264: 'libx264',
      h265: 'libx265',
    };

    const args = [
      '-i',
      inputPath,
      '-c:v',
      codecMap[codec],
      '-crf',
      crf.toString(),
      '-preset',
      'medium', // Balance between speed and compression
      '-pix_fmt',
      'yuv420p', // Required for YouTube compatibility
      '-movflags',
      '+faststart', // Enable streaming playback
      '-y', // Overwrite output file
      outputPath,
    ];

    const ffmpeg = spawn('ffmpeg', args);

    let stderr = '';
    ffmpeg.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    ffmpeg.on('close', (code) => {
      if (code === 0) {
        logger.info(`Conversion complete: ${outputPath}`);
        resolve(outputPath);
      } else {
        reject(new Error(`FFmpeg exited with code ${code}: ${stderr.slice(-500)}`));
      }
    });

    ffmpeg.on('error', (err) => {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        reject(
          new Error(
            'FFmpeg not found. Please install FFmpeg:\n' +
              '  macOS: brew install ffmpeg\n' +
              '  Ubuntu: sudo apt install ffmpeg\n' +
              '  Windows: choco install ffmpeg'
          )
        );
      } else {
        reject(new Error(`FFmpeg error: ${err.message}`));
      }
    });
  });
}

/**
 * Check if FFmpeg is installed and accessible
 */
export async function checkFfmpegInstalled(): Promise<boolean> {
  return new Promise((resolve) => {
    const ffmpeg = spawn('ffmpeg', ['-version']);
    ffmpeg.on('close', (code) => resolve(code === 0));
    ffmpeg.on('error', () => resolve(false));
  });
}

/**
 * Get FFmpeg version string
 */
export async function getFfmpegVersion(): Promise<string | null> {
  return new Promise((resolve) => {
    const ffmpeg = spawn('ffmpeg', ['-version']);
    let output = '';

    ffmpeg.stdout.on('data', (data) => {
      output += data.toString();
    });

    ffmpeg.on('close', (code) => {
      if (code === 0) {
        const match = output.match(/ffmpeg version ([^\s]+)/);
        resolve(match ? match[1] : 'unknown');
      } else {
        resolve(null);
      }
    });

    ffmpeg.on('error', () => resolve(null));
  });
}
