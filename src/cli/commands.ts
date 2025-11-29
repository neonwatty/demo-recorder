import path from 'path';
import fs from 'fs/promises';
import ora from 'ora';
import { PlaywrightRecorder } from '../recorder/playwright-recorder';
import { convertToMp4, checkFfmpegInstalled } from '../recorder/video-processor';
import { loadDemo, listDemos } from '../core/demo-loader';
import { logger } from '../utils/logger';

export interface RecordOptions {
  output: string;
  convert: boolean;
  headed: boolean;
}

export interface CreateOptions {
  url: string;
  name?: string;
  dir: string;
  record: boolean;
  output: string;
  headed: boolean;
}

/**
 * Record command - records video from a demo definition
 */
export async function recordCommand(demoFile: string, options: RecordOptions): Promise<void> {
  const spinner = ora('Loading demo definition...').start();

  try {
    const demoPath = path.resolve(demoFile);
    const demo = await loadDemo(demoPath);
    spinner.succeed(`Loaded demo: ${demo.name}`);

    // Check FFmpeg if conversion is needed
    if (options.convert) {
      const hasFfmpeg = await checkFfmpegInstalled();
      if (!hasFfmpeg) {
        spinner.warn('FFmpeg not found - video will be saved as WebM');
      }
    }

    // Record the video
    spinner.start('Recording demo...');
    const recorder = new PlaywrightRecorder({ headed: options.headed });
    const { videoPath, durationMs } = await recorder.record(demo, options.output);
    spinner.succeed(`Recording complete (${(durationMs / 1000).toFixed(1)}s)`);

    // Convert to MP4 if needed
    let finalPath = videoPath;
    if (options.convert) {
      const hasFfmpeg = await checkFfmpegInstalled();
      if (hasFfmpeg) {
        spinner.start('Converting to MP4...');
        finalPath = await convertToMp4({ inputPath: videoPath });
        spinner.succeed('Conversion complete');
      }
    }

    console.log('\n========================================');
    console.log('Recording saved!');
    console.log(`File: ${finalPath}`);
    console.log('========================================\n');
  } catch (error) {
    spinner.fail('Recording failed');
    logger.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

/**
 * List demos command
 */
export async function listCommand(options: { dir: string }): Promise<void> {
  const spinner = ora('Finding demo files...').start();

  try {
    const demosDir = path.resolve(options.dir);
    const demoFiles = await listDemos(demosDir);

    if (demoFiles.length === 0) {
      spinner.info('No demo files found');
      console.log(`\nLooking in: ${demosDir}`);
      console.log('Demo files should have the extension: .demo.ts, .demo.js, or .demo.mjs\n');
      return;
    }

    spinner.succeed(`Found ${demoFiles.length} demo file(s)`);
    console.log('\nAvailable demos:\n');

    for (const file of demoFiles) {
      try {
        const demo = await loadDemo(file);
        console.log(`  ${path.basename(file)}`);
        console.log(`    ID: ${demo.id}`);
        console.log(`    Name: ${demo.name}`);
        console.log(`    URL: ${demo.url}`);
        console.log('');
      } catch (error) {
        console.log(`  ${path.basename(file)}`);
        console.log(`    Error: ${(error as Error).message}`);
        console.log('');
      }
    }
  } catch (error) {
    spinner.fail('Failed to list demos');
    logger.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

/**
 * Create command - generates a demo file template
 */
export async function createCommand(id: string, options: CreateOptions): Promise<void> {
  const spinner = ora('Creating demo file...').start();

  try {
    const demosDir = path.resolve(options.dir);
    await fs.mkdir(demosDir, { recursive: true });

    const filename = `${id}.demo.ts`;
    const filepath = path.join(demosDir, filename);

    // Check if file already exists
    try {
      await fs.access(filepath);
      spinner.fail(`Demo file already exists: ${filepath}`);
      process.exit(1);
    } catch {
      // File doesn't exist, good to proceed
    }

    const name = options.name || id.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

    const template = generateDemoTemplate(id, name, options.url);
    await fs.writeFile(filepath, template);
    spinner.succeed(`Created demo: ${filepath}`);

    console.log('\nNext steps:');
    console.log(`  1. Edit ${filename} to define your demo flow`);
    console.log(`  2. Run: demo-recorder record ${filepath}`);

    // Optionally record immediately
    if (options.record) {
      console.log('\n');
      await recordCommand(filepath, {
        output: options.output,
        convert: true,
        headed: options.headed,
      });
    }
  } catch (error) {
    spinner.fail('Failed to create demo');
    logger.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

/**
 * Generate a demo file template
 */
function generateDemoTemplate(id: string, name: string, url: string): string {
  return `import type { DemoDefinition } from '../src/core/types';

const demo: DemoDefinition = {
  id: '${id}',
  name: '${name}',
  url: '${url}',

  run: async ({ page, wait, highlight }) => {
    // Wait for page to load
    await wait(1500);

    // TODO: Add your demo steps here
    // Examples:
    //   await highlight('button.submit', 500);  // Highlight an element
    //   await page.click('button.submit');       // Click an element
    //   await page.fill('input#email', 'test@example.com');  // Fill input
    //   await page.waitForSelector('.result');   // Wait for element
    //   await wait(2000);                        // Pause for 2 seconds

    // Final pause
    await wait(2000);
  },
};

export default demo;
`;
}
