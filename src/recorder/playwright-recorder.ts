import { chromium, Browser, BrowserContext, Page } from 'playwright';
import path from 'path';
import fs from 'fs/promises';
import type { DemoDefinition, DemoContext, VideoSettings, RecordingResult } from '../core/types';
import { DEFAULT_VIDEO_SETTINGS } from '../core/types';
import { logger } from '../utils/logger';

export interface RecorderOptions {
  /** Run browser in headed mode (visible window) */
  headed?: boolean;
}

export class PlaywrightRecorder {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private options: RecorderOptions;

  constructor(options: RecorderOptions = {}) {
    this.options = options;
  }

  /**
   * Record a demo and return the path to the recorded video
   */
  async record(demo: DemoDefinition, outputDir: string): Promise<RecordingResult> {
    const settings: VideoSettings = {
      ...DEFAULT_VIDEO_SETTINGS,
      ...demo.video,
    };

    const videoDir = path.join(outputDir, demo.id);
    await fs.mkdir(videoDir, { recursive: true });

    const startTime = Date.now();

    logger.info(`Starting recording for: ${demo.name}`);
    logger.info(`Resolution: ${settings.width}x${settings.height}`);
    logger.info(`URL: ${demo.url}`);

    try {
      // Launch browser with video recording enabled
      this.browser = await chromium.launch({
        headless: !this.options.headed,
      });

      this.context = await this.browser.newContext({
        viewport: {
          width: settings.width,
          height: settings.height,
        },
        recordVideo: {
          dir: videoDir,
          size: {
            width: settings.width,
            height: settings.height,
          },
        },
      });

      const page = await this.context.newPage();

      // Navigate to the demo URL
      logger.info('Navigating to URL...');
      await page.goto(demo.url, { waitUntil: 'networkidle' });

      // Create the demo context with helpers
      const demoContext: DemoContext = {
        page,
        browser: this.browser,
        context: this.context,
        wait: (ms: number) => page.waitForTimeout(ms),
        highlight: async (selector: string, durationMs = 500) => {
          await this.highlightElement(page, selector, durationMs);
        },
      };

      // Run the user's demo script
      logger.info('Running demo script...');
      await demo.run(demoContext);

      // Small delay to ensure final state is captured
      await page.waitForTimeout(500);

      // Close context to finalize video
      await this.context.close();
      this.context = null;

      // Get the video path (Playwright generates a random filename)
      const videoPath = await this.findRecordedVideo(videoDir);
      const durationMs = Date.now() - startTime;

      logger.info(`Recording complete: ${videoPath}`);
      logger.info(`Duration: ${(durationMs / 1000).toFixed(1)}s`);

      return { videoPath, durationMs };
    } finally {
      await this.cleanup();
    }
  }

  /**
   * Highlight an element with a visual indicator
   */
  private async highlightElement(
    page: Page,
    selector: string,
    durationMs: number
  ): Promise<void> {
    try {
      await page.evaluate(
        ({ selector, durationMs }) => {
          const element = document.querySelector(selector);
          if (!element) {
            console.warn(`Highlight: Element not found for selector: ${selector}`);
            return;
          }

          const overlay = document.createElement('div');
          overlay.style.cssText = `
            position: absolute;
            border: 3px solid #ff4444;
            border-radius: 4px;
            pointer-events: none;
            z-index: 999999;
            box-shadow: 0 0 10px rgba(255, 68, 68, 0.5);
            transition: opacity 0.2s ease-out;
          `;

          const rect = element.getBoundingClientRect();
          overlay.style.top = `${rect.top + window.scrollY - 3}px`;
          overlay.style.left = `${rect.left + window.scrollX - 3}px`;
          overlay.style.width = `${rect.width + 6}px`;
          overlay.style.height = `${rect.height + 6}px`;

          document.body.appendChild(overlay);

          setTimeout(() => {
            overlay.style.opacity = '0';
            setTimeout(() => overlay.remove(), 200);
          }, durationMs);
        },
        { selector, durationMs }
      );

      await page.waitForTimeout(durationMs + 200);
    } catch (error) {
      logger.warn(`Failed to highlight element: ${selector}`);
    }
  }

  private async findRecordedVideo(dir: string): Promise<string> {
    const files = await fs.readdir(dir);
    const webmFile = files.find((f) => f.endsWith('.webm'));

    if (!webmFile) {
      throw new Error(`No video file found in ${dir}`);
    }

    return path.join(dir, webmFile);
  }

  private async cleanup(): Promise<void> {
    if (this.context) {
      try {
        await this.context.close();
      } catch {
        // Ignore errors during cleanup
      }
      this.context = null;
    }

    if (this.browser) {
      try {
        await this.browser.close();
      } catch {
        // Ignore errors during cleanup
      }
      this.browser = null;
    }
  }
}
