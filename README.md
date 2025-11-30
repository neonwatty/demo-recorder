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
