# Generate Demo File and Record Video

Generate a Playwright demo file and record the video.

## Arguments
- $ARGUMENTS: Description of the demo flow (e.g., "upload a file, click process, wait for result, download")

## Instructions

1. First, ask the user for the app URL if not provided in the description
2. Create a demo file at `demos/<id>.demo.ts` based on the user's description
3. After writing the file, run the recording command using Bash:
   ```
   demo-recorder record demos/<id>.demo.ts
   ```
4. Report the output video location to the user

## Demo File Format

```typescript
import type { DemoDefinition } from '../src/core/types';

const demo: DemoDefinition = {
  id: '<kebab-case-id>',
  name: '<Human Readable Name>',
  url: '<app-url>',

  run: async ({ page, wait, highlight }) => {
    // Demo steps here
  },
};

export default demo;
```

## Available helpers:

- `page` - Playwright Page object
- `wait(ms)` - Pause for specified milliseconds
- `highlight(selector, ms?)` - Highlight element with red border

## Common actions:

```typescript
await page.click('button.submit');
await page.fill('input#email', 'text');
await page.waitForSelector('.result');
await page.waitForLoadState('networkidle');
await page.goBack();
await page.evaluate(() => window.scrollBy(0, 400));
await page.locator('input[type="file"]').setInputFiles('./file.mp4');
```

## Guidelines:

1. Use semantic selectors (data-testid, aria-labels)
2. Add `wait()` between actions for visual clarity
3. Use `highlight()` before important interactions
4. End with `await wait(2000)` to show final state

## IMPORTANT: After generating the demo file, ALWAYS run:

```bash
demo-recorder record demos/<id>.demo.ts
```

This will create the MP4 video in `./output/<id>/`

$ARGUMENTS
