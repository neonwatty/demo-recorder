import type { DemoDefinition } from '../src/core/types';

const demo: DemoDefinition = {
  id: 'example-demo',
  name: 'Example Demo - Hacker News',
  url: 'https://news.ycombinator.com',

  run: async ({ page, wait, highlight }) => {
    // Wait for page to load
    await wait(1500);

    // Highlight the main title
    await highlight('.hnname a', 800);

    // Highlight the first story
    await highlight('.titleline > a', 1000);

    // Click on "new" link
    await highlight('a[href="newest"]', 600);
    await page.click('a[href="newest"]');

    // Wait for navigation
    await page.waitForLoadState('networkidle');
    await wait(1500);

    // Final pause
    await wait(2000);
  },
};

export default demo;
