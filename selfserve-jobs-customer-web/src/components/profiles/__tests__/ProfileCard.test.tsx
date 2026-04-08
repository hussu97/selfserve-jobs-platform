import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProfileCard } from '../ProfileCard';
import type { ProfileListItem } from '@/lib/types';

// next/link renders as a plain <a> in jsdom
vi.mock('next/link', () => ({
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}));

const baseProfile: ProfileListItem = {
  code: 'prof123abc456',
  person_name: 'Jane Smith',
  current_title: 'Full Stack Developer',
  current_city: 'Berlin',
  current_country: 'DE',
  years_of_experience: 5,
  key_skills: ['Python', 'React', 'PostgreSQL'],
  notice_period: 'immediate',
  relocation_preference: 'yes',
  created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1 hour ago
};

describe('ProfileCard', () => {
  it('renders the person name', () => {
    render(<ProfileCard profile={baseProfile} />);
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('renders the current title', () => {
    render(<ProfileCard profile={baseProfile} />);
    expect(screen.getByText('Full Stack Developer')).toBeInTheDocument();
  });

  it('renders a link to the correct profile URL', () => {
    render(<ProfileCard profile={baseProfile} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/profiles/prof123abc456');
  });

  it('renders the location', () => {
    render(<ProfileCard profile={baseProfile} />);
    // DE should resolve to Germany
    expect(screen.getByText('Berlin, Germany')).toBeInTheDocument();
  });

  it('renders experience information', () => {
    render(<ProfileCard profile={baseProfile} />);
    expect(screen.getByText('5 years exp.')).toBeInTheDocument();
  });

  it('renders skill tags', () => {
    render(<ProfileCard profile={baseProfile} />);
    expect(screen.getByText('Python')).toBeInTheDocument();
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('PostgreSQL')).toBeInTheDocument();
  });

  it('shows +N more when there are more than 4 skills', () => {
    const profile: ProfileListItem = {
      ...baseProfile,
      key_skills: ['Python', 'React', 'PostgreSQL', 'Docker', 'AWS', 'TypeScript'],
    };
    render(<ProfileCard profile={profile} />);
    expect(screen.getByText('+2 more')).toBeInTheDocument();
  });

  it('renders the relocation preference badge', () => {
    render(<ProfileCard profile={baseProfile} />);
    expect(screen.getByText('Open to relocation')).toBeInTheDocument();
  });

  it('renders the notice period', () => {
    render(<ProfileCard profile={baseProfile} />);
    expect(screen.getByText(/Immediate/)).toBeInTheDocument();
  });

  it('renders "Entry level" for 0 years of experience', () => {
    const profile: ProfileListItem = { ...baseProfile, years_of_experience: 0 };
    render(<ProfileCard profile={profile} />);
    expect(screen.getByText('Entry level exp.')).toBeInTheDocument();
  });

  it('renders "Today" for a profile created today', () => {
    render(<ProfileCard profile={baseProfile} />);
    expect(screen.getByText('Today')).toBeInTheDocument();
  });

  it('renders no skills section when key_skills is empty', () => {
    const profile: ProfileListItem = { ...baseProfile, key_skills: [] };
    render(<ProfileCard profile={profile} />);
    expect(screen.queryByText('Python')).toBeNull();
  });
});
