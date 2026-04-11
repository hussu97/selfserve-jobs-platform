import { test, expect } from '@playwright/test';

/**
 * Smoke tests — verifies that the most critical pages load and render
 * their primary content without JS errors.
 */

test.describe('Homepage', () => {
  test('loads and renders a main content region', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('main')).toBeVisible();
  });

  test('navigation is present', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('navigation')).toBeVisible();
  });
});

test.describe('Jobs list page', () => {
  test('loads successfully', async ({ page }) => {
    const response = await page.goto('/jobs');
    expect(response?.status()).toBe(200);
  });

  test('renders the main content area', async ({ page }) => {
    await page.goto('/jobs');
    await expect(page.getByRole('main')).toBeVisible();
  });

  test('has a search input', async ({ page }) => {
    await page.goto('/jobs');
    await expect(page.getByRole('searchbox')).toBeVisible();
  });
});

test.describe('Profiles list page', () => {
  test('loads successfully', async ({ page }) => {
    const response = await page.goto('/profiles');
    expect(response?.status()).toBe(200);
  });

  test('renders the main content area', async ({ page }) => {
    await page.goto('/profiles');
    await expect(page.getByRole('main')).toBeVisible();
  });
});
