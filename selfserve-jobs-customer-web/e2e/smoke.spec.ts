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

  test('hero headline is visible', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
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

  test('has a search input', async ({ page }) => {
    await page.goto('/profiles');
    await expect(page.getByRole('searchbox')).toBeVisible();
  });
});

test.describe('About page', () => {
  test('loads successfully', async ({ page }) => {
    const response = await page.goto('/about');
    expect(response?.status()).toBe(200);
  });

  test('renders the main heading', async ({ page }) => {
    await page.goto('/about');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});

test.describe('FAQ page', () => {
  test('loads successfully', async ({ page }) => {
    const response = await page.goto('/faq');
    expect(response?.status()).toBe(200);
  });

  test('renders FAQ heading', async ({ page }) => {
    await page.goto('/faq');
    await expect(page.getByRole('heading', { name: /frequently asked/i })).toBeVisible();
  });

  test('FAQ sections are present', async ({ page }) => {
    await page.goto('/faq');
    // At least one details/summary (accordion) element should exist
    await expect(page.locator('details').first()).toBeVisible();
  });
});

test.describe('Contact page', () => {
  test('loads successfully', async ({ page }) => {
    const response = await page.goto('/contact');
    expect(response?.status()).toBe(200);
  });

  test('renders page heading', async ({ page }) => {
    await page.goto('/contact');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});

test.describe('Create talent profile page', () => {
  test('loads successfully', async ({ page }) => {
    const response = await page.goto('/profiles/new');
    expect(response?.status()).toBe(200);
  });

  test('renders profile form heading', async ({ page }) => {
    await page.goto('/profiles/new');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('profile form is present', async ({ page }) => {
    await page.goto('/profiles/new');
    await expect(page.locator('form')).toBeVisible();
  });
});

test.describe('Post a job page (non-recruiter gate)', () => {
  test('loads successfully', async ({ page }) => {
    const response = await page.goto('/jobs/new');
    expect(response?.status()).toBe(200);
  });

  test('renders access gate for unauthenticated users', async ({ page }) => {
    await page.goto('/jobs/new');
    // Non-logged-in users should see the recruiter access required message
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});

test.describe('Recruiter registration page', () => {
  test('loads successfully', async ({ page }) => {
    const response = await page.goto('/recruiter/register');
    expect(response?.status()).toBe(200);
  });

  test('renders the registration heading', async ({ page }) => {
    await page.goto('/recruiter/register');
    await expect(page.getByRole('heading', { name: /recruiter/i })).toBeVisible();
  });

  test('registration form is present with required fields', async ({ page }) => {
    await page.goto('/recruiter/register');
    await expect(page.locator('form')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="url"]')).toBeVisible();
  });
});

test.describe('Email verification page (no code)', () => {
  test('loads without crashing when no code is present', async ({ page }) => {
    const response = await page.goto('/verify');
    expect(response?.status()).toBe(200);
  });

  test('shows "Check your email" state when no code in URL', async ({ page }) => {
    await page.goto('/verify');
    await expect(page.getByRole('heading', { name: /check your email/i })).toBeVisible();
  });
});

test.describe('Report page (no listing code)', () => {
  test('loads without crashing when no code is present', async ({ page }) => {
    const response = await page.goto('/report');
    expect(response?.status()).toBe(200);
  });

  test('shows "Nothing to report" state when no code in URL', async ({ page }) => {
    await page.goto('/report');
    await expect(page.getByRole('heading', { name: /nothing to report/i })).toBeVisible();
  });
});
