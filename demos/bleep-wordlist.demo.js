/**
 * Demo: Creating a Custom Word List in Bleep That Sh*t!
 *
 * This demo shows how to create a custom wordset for censoring audio/video.
 * Uses animated interactions for a polished look.
 */
const demo = {
  id: 'bleep-create-wordlist',
  name: 'Create Custom Word List',
  url: 'http://localhost:3004/bleep',

  run: async ({ page, wait, clickAnimated, typeAnimated, zoomHighlight, moveTo }) => {
    // Wait for page to fully load (hideDevTools is called automatically)
    await wait(1500);

    // Helper to scroll element to center
    const scrollToCenter = async (selector) => {
      await page.evaluate((sel) => {
        const element = document.querySelector(sel);
        if (element) {
          const rect = element.getBoundingClientRect();
          const elementCenter = rect.top + rect.height / 2;
          const viewportCenter = window.innerHeight / 2;
          window.scrollBy({ top: elementCenter - viewportCenter, behavior: 'smooth' });
        }
      }, selector);
      await wait(300);
    };

    // Click on the "Manage Word Lists" tab (4th tab)
    await scrollToCenter('[role="tab"]:nth-child(4)');
    await zoomHighlight('[role="tab"]:nth-child(4)', { duration: 500 });
    await clickAnimated('[role="tab"]:nth-child(4)');
    await wait(1200);

    // Delete any existing wordsets first
    const existingDeleteButtons = await page.$$('[data-testid="delete-wordset-button"]');
    for (const btn of existingDeleteButtons) {
      await btn.click();
      await wait(400);
      const confirmBtn = await page.$('[data-testid="confirm-delete-button"]');
      if (confirmBtn) {
        await confirmBtn.click();
        await wait(600);
      }
    }

    // Click "Create New Wordset" button
    await scrollToCenter('[data-testid="new-wordset-button"]');
    await zoomHighlight('[data-testid="new-wordset-button"]', { duration: 500 });
    await clickAnimated('[data-testid="new-wordset-button"]');
    await wait(800);

    // Scroll to center the form
    await scrollToCenter('[data-testid="wordset-name-input"]');

    // Fill in the wordset name with animated typing
    await moveTo('[data-testid="wordset-name-input"]');
    await wait(200);
    await typeAnimated('[data-testid="wordset-name-input"]', 'Demo Profanity List', { delay: 40 });
    await wait(600);

    // Fill in the description
    await moveTo('[data-testid="wordset-description-input"]');
    await wait(200);
    await typeAnimated(
      '[data-testid="wordset-description-input"]',
      'A custom list of words to censor in my videos',
      { delay: 30 }
    );
    await wait(600);

    // Change the color
    await moveTo('[data-testid="color-picker"]');
    await wait(200);
    await clickAnimated('[data-testid="color-picker"]');
    await wait(300);
    // Set a purple color
    await page.evaluate(() => {
      const colorPicker = document.querySelector('[data-testid="color-picker"]');
      if (colorPicker) {
        colorPicker.value = '#9333EA';
        colorPicker.dispatchEvent(new Event('input', { bubbles: true }));
        colorPicker.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    await wait(400);

    // Scroll to center the word input area
    await scrollToCenter('[data-testid="new-word-input"]');

    // Add some words to the list with animated typing
    const wordsToAdd = ['darn', 'heck', 'fudge', 'shoot'];

    for (const word of wordsToAdd) {
      await moveTo('[data-testid="new-word-input"]');
      await wait(150);
      await typeAnimated('[data-testid="new-word-input"]', word, { delay: 60 });
      await wait(300);
      await clickAnimated('[data-testid="add-word-button"]');
      await wait(400);
    }

    // Scroll to center the save button
    await scrollToCenter('[data-testid="save-wordset-button"]');
    await wait(400);

    // Highlight and click save
    await zoomHighlight('[data-testid="save-wordset-button"]', { duration: 700 });
    await clickAnimated('[data-testid="save-wordset-button"]');
    await wait(1500);

    // Scroll to show the success message and new wordset
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
    await wait(1500);
  },
};

module.exports = demo;
