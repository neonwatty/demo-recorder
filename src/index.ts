#!/usr/bin/env node

import { Command } from 'commander';
import { recordCommand, listCommand, createCommand } from './cli/commands';

const program = new Command();

program
  .name('demo-recorder')
  .description('Record demo videos of web apps using Playwright')
  .version('1.0.0');

// demo-recorder create <id> --url <url>
program
  .command('create <id>')
  .description('Create a new demo definition file')
  .requiredOption('-u, --url <url>', 'URL of the app to demo')
  .option('-n, --name <name>', 'Human-readable name for the demo')
  .option('-d, --dir <directory>', 'Directory to create demo in', './demos')
  .option('-r, --record', 'Record the demo immediately after creating')
  .option('-o, --output <dir>', 'Output directory for recordings', './output')
  .option('--headed', 'Run browser in headed mode when recording')
  .action(createCommand);

// demo-recorder record <demo-file>
program
  .command('record <demo-file>')
  .description('Record a demo video from a demo definition file')
  .option('-o, --output <dir>', 'Output directory', './output')
  .option('--no-convert', 'Skip WebM to MP4 conversion')
  .option('--headed', 'Run browser in headed mode (visible window)')
  .action(recordCommand);

// demo-recorder list
program
  .command('list')
  .description('List all demo definition files')
  .option('-d, --dir <directory>', 'Demos directory', './demos')
  .action(listCommand);

program.parse();
