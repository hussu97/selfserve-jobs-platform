import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { JobCard } from '../JobCard';
import type { JobListItem } from '@/lib/types';

// next/link renders as a plain <a> in jsdom
vi.mock('next/link', () => ({
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}));

const baseJob: JobListItem = {
  code: 'job123abc456',
  job_title: 'Senior Frontend Engineer',
  company_name: 'Acme Corp',
  company_city: 'London',
  company_country: 'GB',
  employment_type: 'full_time',
  key_skills: ['React', 'TypeScript', 'Next.js'],
  created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1 hour ago
};

describe('JobCard', () => {
  it('renders the job title', () => {
    render(<JobCard job={baseJob} />);
    expect(screen.getByText('Senior Frontend Engineer')).toBeInTheDocument();
  });

  it('renders the company name', () => {
    render(<JobCard job={baseJob} />);
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
  });

  it('renders a link to the correct job URL', () => {
    render(<JobCard job={baseJob} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/jobs/job123abc456');
  });

  it('renders skill tags', () => {
    render(<JobCard job={baseJob} />);
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
    expect(screen.getByText('Next.js')).toBeInTheDocument();
  });

  it('shows +N more when there are more than 4 skills', () => {
    const job: JobListItem = {
      ...baseJob,
      key_skills: ['React', 'TypeScript', 'Next.js', 'GraphQL', 'PostgreSQL', 'Docker'],
    };
    render(<JobCard job={job} />);
    expect(screen.getByText('+2')).toBeInTheDocument();
  });

  it('renders the location using country label', () => {
    render(<JobCard job={baseJob} />);
    expect(screen.getByText('London, United Kingdom')).toBeInTheDocument();
  });

  it('renders the employment type badge', () => {
    render(<JobCard job={baseJob} />);
    expect(screen.getByText('Full-time')).toBeInTheDocument();
  });

  it('renders "Today" for a job posted today', () => {
    render(<JobCard job={baseJob} />);
    expect(screen.getByText('Today')).toBeInTheDocument();
  });

  it('does not render deadline when not provided', () => {
    render(<JobCard job={baseJob} />);
    expect(screen.queryByText(/Due /)).toBeNull();
  });

  it('renders the deadline when provided', () => {
    const job: JobListItem = {
      ...baseJob,
      deadline_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5).toISOString(), // 5 days from now
    };
    render(<JobCard job={job} />);
    expect(screen.getByText(/Due /)).toBeInTheDocument();
  });

  it('renders no skills section when key_skills is empty', () => {
    const job: JobListItem = { ...baseJob, key_skills: [] };
    render(<JobCard job={job} />);
    // Skills like React should not appear
    expect(screen.queryByText('React')).toBeNull();
  });
});
