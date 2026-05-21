import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { JobMarketNotes } from '../JobMarketNotes';

const getBlogPosts = vi.fn();

vi.mock('@/lib/api', () => ({
  getBlogPosts: (...args: unknown[]) => getBlogPosts(...args),
}));

describe('JobMarketNotes', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_SUBSTACK_PUBLICATION_URL', 'https://hirebridge.substack.com');
    getBlogPosts.mockResolvedValue({
      items: [
        {
          post_code: 'blog12345678',
          title: 'How to make your profile stand out',
          slug: 'profile-stand-out',
          excerpt: 'Practical profile guidance.',
          author: 'hirebridge',
          tags: ['Job Search'],
          status: 'published',
          featured_image_url: null,
          reading_minutes: 4,
          source: 'substack',
          external_url: 'https://hirebridge.substack.com/p/profile-stand-out',
          published_at: '2026-05-01T08:00:00Z',
          created_at: '2026-05-01T08:00:00Z',
          updated_at: '2026-05-01T08:00:00Z',
        },
      ],
      total: 1,
      page: 1,
      per_page: 3,
      total_pages: 1,
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    getBlogPosts.mockReset();
  });

  it('renders latest article links and the Substack subscribe CTA', async () => {
    render(<JobMarketNotes />);

    await waitFor(() => {
      expect(screen.getByText('How to make your profile stand out')).toBeInTheDocument();
    });

    expect(screen.getByRole('link', { name: /read articles/i })).toHaveAttribute('href', '/blog');
    expect(screen.getByRole('link', { name: /subscribe/i })).toHaveAttribute(
      'href',
      'https://hirebridge.substack.com'
    );
  });

  it('hides the Substack subscribe CTA when the publication URL is unset', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUBSTACK_PUBLICATION_URL', '');

    render(<JobMarketNotes variant="profile-form" />);

    await waitFor(() => {
      expect(screen.getByText('How to make your profile stand out')).toBeInTheDocument();
    });
    expect(screen.queryByRole('link', { name: /subscribe/i })).not.toBeInTheDocument();
  });
});
