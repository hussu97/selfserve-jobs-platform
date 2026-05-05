import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BlogPostForm } from '../BlogPostForm';
import type { AdminBlogPost } from '@/lib/types';

vi.mock('@/lib/api', () => ({
  adminCreateBlogPost: vi.fn(),
  adminUpdateBlogPost: vi.fn(),
  adminFetchLinkPreview: vi.fn(),
}));

const post: AdminBlogPost = {
  post_code: 'blogpost1234',
  title: 'Saved post',
  slug: 'saved-post',
  excerpt: 'Saved excerpt',
  content: '## Saved Heading\n\nSaved markdown body.',
  author: 'Saved Author',
  tags: ['UAE', 'Hiring'],
  status: 'draft',
  featured_image_url: 'https://example.com/image.jpg',
  reading_minutes: 3,
  view_count: 12,
  link_click_count: 2,
  link_preview: {
    url: 'https://example.com/careers',
    title: 'Example Careers',
    description: 'Example description',
    domain: 'example.com',
  },
  created_at: '2026-05-05T00:00:00Z',
  updated_at: '2026-05-05T00:00:00Z',
};

describe('BlogPostForm', () => {
  it('hydrates every saved field when editing a post', () => {
    render(
      <BlogPostForm
        sessionToken="admin-token"
        editPost={post}
        onSaved={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByDisplayValue('Saved post')).toBeInTheDocument();
    expect(screen.getByDisplayValue('saved-post')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Saved excerpt')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/write your article/i)).toHaveValue(post.content);
    expect(screen.getByDisplayValue('Saved Author')).toBeInTheDocument();
    expect(screen.getByDisplayValue('UAE, Hiring')).toBeInTheDocument();
    expect(screen.getByDisplayValue('3')).toBeInTheDocument();
    expect(screen.getByDisplayValue('https://example.com/image.jpg')).toBeInTheDocument();
    expect(screen.getByDisplayValue('https://example.com/careers')).toBeInTheDocument();
    expect(screen.getByText('Example Careers')).toBeInTheDocument();
  });
});
