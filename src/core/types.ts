import type { Page, Browser, BrowserContext } from 'playwright';

/**
 * Video recording settings
 */
export interface VideoSettings {
  /** Video width in pixels (default: 1920) */
  width: number;
  /** Video height in pixels (default: 1080) */
  height: number;
}

/**
 * Context passed to the demo's run function
 */
export interface DemoContext {
  /** Playwright Page instance */
  page: Page;
  /** Playwright Browser instance */
  browser: Browser;
  /** Playwright BrowserContext instance */
  context: BrowserContext;
  /** Helper to add a pause (useful for letting animations complete) */
  wait: (ms: number) => Promise<void>;
  /** Helper to highlight an element before interacting */
  highlight: (selector: string, durationMs?: number) => Promise<void>;
}

/**
 * The main demo definition that users create
 */
export interface DemoDefinition {
  /** Unique identifier for this demo (used for filenames) */
  id: string;
  /** Human-readable name */
  name: string;
  /** Target URL to record */
  url: string;
  /** Video recording settings (optional, has defaults) */
  video?: Partial<VideoSettings>;
  /**
   * The actual demo script - receives a Playwright Page and helpers
   */
  run: (context: DemoContext) => Promise<void>;
}

/**
 * Result of running a recording
 */
export interface RecordingResult {
  /** Path to the recorded video file */
  videoPath: string;
  /** Recording duration in milliseconds */
  durationMs: number;
}

/**
 * Default video settings
 */
export const DEFAULT_VIDEO_SETTINGS: VideoSettings = {
  width: 1920,
  height: 1080,
};
