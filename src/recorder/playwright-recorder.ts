import { chromium, Browser, BrowserContext, Page } from 'playwright';
import path from 'path';
import fs from 'fs/promises';
import type {
  DemoDefinition,
  DemoContext,
  VideoSettings,
  RecordingResult,
  TypeOptions,
  MoveOptions,
  ClickOptions,
  ZoomOptions,
} from '../core/types';
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

      // Hide dev tools immediately after page load
      await this.hideDevTools(page);

      // Initialize fake cursor for animations
      await this.initFakeCursor(page);

      // Create the demo context with helpers
      const demoContext: DemoContext = {
        page,
        browser: this.browser,
        context: this.context,
        wait: (ms: number) => page.waitForTimeout(ms),
        highlight: async (selector: string, durationMs = 500) => {
          await this.highlightElement(page, selector, durationMs);
        },
        hideDevTools: async () => {
          await this.hideDevTools(page);
        },
        typeAnimated: async (selector: string, text: string, options?: TypeOptions) => {
          await this.typeAnimated(page, selector, text, options);
        },
        moveTo: async (selector: string, options?: MoveOptions) => {
          await this.moveTo(page, selector, options);
        },
        clickAnimated: async (selector: string, options?: ClickOptions) => {
          await this.clickAnimated(page, selector, options);
        },
        zoomHighlight: async (selector: string, options?: ZoomOptions) => {
          await this.zoomHighlight(page, selector, options);
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
    } catch {
      logger.warn(`Failed to highlight element: ${selector}`);
    }
  }

  /**
   * Hide development tools and logos (Next.js, etc.)
   */
  private async hideDevTools(page: Page): Promise<void> {
    await page.addStyleTag({
      content: `
        nextjs-portal,
        [data-nextjs-toast],
        [data-nextjs-dialog-overlay],
        #__next-build-watcher,
        [class*="nextjs"],
        [class*="__next"] {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
        }
      `,
    });
  }

  /**
   * Initialize a fake cursor element for visible mouse movement
   */
  private async initFakeCursor(page: Page): Promise<void> {
    await page.evaluate(() => {
      // Create cursor element if it doesn't exist
      if (document.getElementById('__demo-cursor')) return;

      const cursor = document.createElement('div');
      cursor.id = '__demo-cursor';
      // Traditional macOS-style arrow cursor, larger size
      cursor.innerHTML = `
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M8 4V28L13.5 22.5L17.5 30H21.5L17.5 22H24L8 4Z" fill="black"/>
          <path d="M10 8V24L14 20L18 28H20L16 20H21L10 8Z" fill="white"/>
        </svg>
      `;
      cursor.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 32px;
        height: 32px;
        pointer-events: none;
        z-index: 999999;
        transform: translate(0, 0);
        filter: drop-shadow(2px 2px 3px rgba(0,0,0,0.4));
      `;
      document.body.appendChild(cursor);
    });
  }

  /**
   * Move the fake cursor to a position
   */
  private async updateCursorPosition(page: Page, x: number, y: number): Promise<void> {
    await page.evaluate(
      ({ x, y }) => {
        const cursor = document.getElementById('__demo-cursor');
        if (cursor) {
          cursor.style.left = `${x}px`;
          cursor.style.top = `${y}px`;
        }
      },
      { x, y }
    );
  }

  /**
   * Type text with character-by-character animation
   */
  private async typeAnimated(
    page: Page,
    selector: string,
    text: string,
    options?: TypeOptions
  ): Promise<void> {
    const delay = options?.delay ?? 50;
    const variation = options?.variation ?? 20;

    try {
      // Focus the element first
      await page.click(selector);
      await page.waitForTimeout(100);

      // Type each character with variation
      for (const char of text) {
        await page.keyboard.type(char);
        const actualDelay = delay + Math.floor(Math.random() * variation * 2) - variation;
        await page.waitForTimeout(Math.max(10, actualDelay));
      }
    } catch {
      logger.warn(`Failed to type in element: ${selector}`);
    }
  }

  /**
   * Move cursor smoothly to an element
   */
  private async moveTo(page: Page, selector: string, options?: MoveOptions): Promise<void> {
    const duration = options?.duration ?? 500;
    const steps = options?.steps ?? 20;

    try {
      const element = await page.$(selector);
      if (!element) {
        logger.warn(`Element not found for moveTo: ${selector}`);
        return;
      }

      const box = await element.boundingBox();
      if (!box) return;

      // Target center of element
      const targetX = box.x + box.width / 2;
      const targetY = box.y + box.height / 2;

      // Get current cursor position (or start from corner)
      const currentPos = await page.evaluate(() => {
        const cursor = document.getElementById('__demo-cursor');
        if (cursor) {
          return {
            x: parseFloat(cursor.style.left) || 100,
            y: parseFloat(cursor.style.top) || 100,
          };
        }
        return { x: 100, y: 100 };
      });

      // Animate cursor movement with easing
      const stepDelay = duration / steps;
      for (let i = 1; i <= steps; i++) {
        const progress = i / steps;
        // Ease-out cubic
        const eased = 1 - Math.pow(1 - progress, 3);

        const x = currentPos.x + (targetX - currentPos.x) * eased;
        const y = currentPos.y + (targetY - currentPos.y) * eased;

        await this.updateCursorPosition(page, x, y);
        await page.mouse.move(x, y);
        await page.waitForTimeout(stepDelay);
      }
    } catch {
      logger.warn(`Failed to move to element: ${selector}`);
    }
  }

  /**
   * Animated click: move to element, hover, then click
   */
  private async clickAnimated(page: Page, selector: string, options?: ClickOptions): Promise<void> {
    const hoverDuration = options?.hoverDuration ?? 200;
    const moveDuration = options?.moveDuration ?? 400;

    try {
      // Move cursor to element
      await this.moveTo(page, selector, { duration: moveDuration });

      // Brief hover
      await page.waitForTimeout(hoverDuration);

      // Add click ripple effect
      await page.evaluate((sel) => {
        const element = document.querySelector(sel);
        if (!element) return;

        const rect = element.getBoundingClientRect();
        const ripple = document.createElement('div');
        ripple.style.cssText = `
          position: fixed;
          left: ${rect.left + rect.width / 2}px;
          top: ${rect.top + rect.height / 2}px;
          width: 10px;
          height: 10px;
          background: rgba(66, 133, 244, 0.4);
          border-radius: 50%;
          transform: translate(-50%, -50%) scale(0);
          pointer-events: none;
          z-index: 999998;
          animation: __demo-ripple 0.4s ease-out forwards;
        `;

        // Add keyframes if not exists
        if (!document.getElementById('__demo-ripple-style')) {
          const style = document.createElement('style');
          style.id = '__demo-ripple-style';
          style.textContent = `
            @keyframes __demo-ripple {
              0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
              100% { transform: translate(-50%, -50%) scale(4); opacity: 0; }
            }
          `;
          document.head.appendChild(style);
        }

        document.body.appendChild(ripple);
        setTimeout(() => ripple.remove(), 400);
      }, selector);

      // Perform the click
      await page.click(selector);
    } catch {
      logger.warn(`Failed to click element: ${selector}`);
    }
  }

  /**
   * Highlight with zoom/scale effect
   */
  private async zoomHighlight(page: Page, selector: string, options?: ZoomOptions): Promise<void> {
    const scale = options?.scale ?? 1.05;
    const duration = options?.duration ?? 600;

    try {
      await page.evaluate(
        ({ selector, scale, duration }) => {
          const element = document.querySelector(selector) as HTMLElement;
          if (!element) return;

          const rect = element.getBoundingClientRect();

          // Create highlight overlay
          const overlay = document.createElement('div');
          overlay.style.cssText = `
            position: fixed;
            top: ${rect.top - 4}px;
            left: ${rect.left - 4}px;
            width: ${rect.width + 8}px;
            height: ${rect.height + 8}px;
            border: 3px solid #4285f4;
            border-radius: 8px;
            pointer-events: none;
            z-index: 999997;
            box-shadow: 0 0 20px rgba(66, 133, 244, 0.5), 0 0 40px rgba(66, 133, 244, 0.3);
            transform: scale(1);
            animation: __demo-zoom ${duration}ms ease-in-out forwards;
          `;

          // Add keyframes if not exists
          if (!document.getElementById('__demo-zoom-style')) {
            const style = document.createElement('style');
            style.id = '__demo-zoom-style';
            style.textContent = `
              @keyframes __demo-zoom {
                0% { transform: scale(1); opacity: 0; }
                20% { transform: scale(${scale}); opacity: 1; }
                80% { transform: scale(${scale}); opacity: 1; }
                100% { transform: scale(1); opacity: 0; }
              }
            `;
            document.head.appendChild(style);
          }

          document.body.appendChild(overlay);
          setTimeout(() => overlay.remove(), duration);
        },
        { selector, scale, duration }
      );

      await page.waitForTimeout(duration);
    } catch {
      logger.warn(`Failed to zoom highlight element: ${selector}`);
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
