import { describe, it, expect } from 'vitest';
import { checkFfmpegInstalled, getFfmpegVersion } from '../src/recorder/video-processor';

describe('video-processor', () => {
  describe('checkFfmpegInstalled', () => {
    it('should return boolean indicating FFmpeg availability', async () => {
      const result = await checkFfmpegInstalled();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('getFfmpegVersion', () => {
    it('should return version string or null', async () => {
      const result = await getFfmpegVersion();
      // Result is either a version string or null if not installed
      expect(result === null || typeof result === 'string').toBe(true);
    });
  });
});
