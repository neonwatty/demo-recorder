# demo-recorder

CLI tool to record demo videos of web apps using Playwright.

## Install

```bash
npm install -g demo-recorder
```

## Usage

```bash
# Create a demo file
demo-recorder create my-feature --url http://localhost:3000

# Record the demo
demo-recorder record demos/my-feature.demo.ts

# List demos
demo-recorder list
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

## Requirements

- Node.js 18+
- FFmpeg: `brew install ffmpeg`

## License

MIT
