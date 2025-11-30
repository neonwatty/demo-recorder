# demo-recorder

CLI tool to record demo videos and capture screenshots of web apps using Playwright.

## Install

```bash
npm install -g @neonwatty/demo-recorder
```

## Usage

```bash
# Create a demo file
demo-recorder create my-feature --url http://localhost:3000

# Record video
demo-recorder record demos/my-feature.demo.ts

# Capture screenshots (same demo file!)
demo-recorder screenshot demos/my-feature.demo.ts

# Extract thumbnail from video
demo-recorder thumbnail output/my-feature/video.mp4

# Convert video to GIF
demo-recorder gif output/my-feature/video.mp4

# List demos
demo-recorder list
```

### Screenshot Options

```bash
demo-recorder screenshot <demo-file> [options]

Options:
  --format <png|jpeg|webp>  Image format (default: png)
  --quality <0-100>         Quality for jpeg/webp (default: 90)
  --full-page               Capture full page instead of viewport
  --headed                  Run browser in visible mode
  --no-gallery              Skip HTML gallery generation
```

### Thumbnail Options

```bash
demo-recorder thumbnail <video-file> [options]

Options:
  -o, --output <path>       Output image path
  -t, --time <seconds>      Timestamp in seconds (default: 1/3 into video)
  -w, --width <n>           Width in pixels (default: 1280)
  -f, --format <format>     Image format: png, jpeg, webp (default: png)
  -q, --quality <n>         Quality for jpeg/webp (default: 90)
```

### GIF Options

```bash
demo-recorder gif <video-file> [options]

Options:
  -o, --output <path>       Output GIF path
  --fps <n>                 Frames per second (default: 10)
  --width <n>               Width in pixels (default: 800)
  --colors <n>              Color palette size, 32-256 (default: 256)
  --no-dither               Disable dithering
  --fast                    Use faster single-pass encoding (lower quality)
```

## Demo File Format

```typescript
import type { DemoDefinition } from 'demo-recorder';

const demo: DemoDefinition = {
  id: 'my-feature',
  name: 'My Feature Demo',
  url: 'http://localhost:3000',
  run: async ({ page, wait, highlight }) => {
    await wait(1000);
    await highlight('button.start', 500);
    await page.click('button.start');
    await wait(2000);
  },
};

export default demo;
```

## API

| Helper | Description |
|--------|-------------|
| `page` | Playwright Page object |
| `wait(ms)` | Pause execution |
| `highlight(selector, ms?)` | Highlight element with red border |
| `clickAnimated(selector)` | Animated cursor move + click |
| `typeAnimated(selector, text)` | Character-by-character typing |
| `moveTo(selector)` | Smooth cursor movement |
| `zoomHighlight(selector)` | Highlight with zoom effect |
| `scrollToElement(selector)` | Smooth scroll to element |
| `screenshot(name?)` | Manual screenshot capture |

## Requirements

- Node.js 18+
- FFmpeg: `brew install ffmpeg`

## License

MIT
