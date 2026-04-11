import { test, expect } from '@playwright/test';

/**
 * Responsive layout tests — verifies that key pages are functional across
 * mobile (375 px), tablet (768 px), and desktop (1280 px) viewports.
 *
 * These tests run in addition to the per-project viewport settings defined
 * in playwright.config.ts so they can be invoked explicitly on any project.
 */

const VIEWPORTS = [
  { name: 'mobile', width: 375, height: 812 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 800 },
];

const KEY_PAGES = [
  { label: 'homepage', path: '/' },
  { label: 'jobs list', path: '/jobs' },
  { label: 'profiles list', path: '/profiles' },
];

for (const viewport of VIEWPORTS) {
  test.describe(`${viewport.name} (${viewport.width}px)`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    for (const page_config of KEY_PAGES) {
      test(`${page_config.label} renders main content`, async ({ page }) => {
        await page.goto(page_config.path);
        await expect(page.getByRole('main')).toBeVisible();
      });

      test(`${page_config.label} has no horizontal scroll`, async ({ page }) => {
        await page.goto(page_config.path);
        const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
        expect(bodyWidth).toBeLessThanOrEqual(viewport.width);
      });
    }

    test('navigation is accessible', async ({ page }) => {
      await page.goto('/');
      await expect(page.getByRole('navigation')).toBeVisible();
    });
  });
}
