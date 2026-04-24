import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ProfileDetail } from '../ProfileDetail';
import type { Profile } from '@/lib/types';

const authState = {
  isActiveRecruiter: false,
  sessionToken: null as string | null,
};

const getProfileMock = vi.fn();
const getResumeUrlMock = vi.fn();

vi.mock('next/link', () => ({
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}));

vi.mock('@/components/ui/Badge', () => ({
  Badge: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));

vi.mock('@/components/shared/SkillTag', () => ({
  SkillTag: ({ skill }: { skill: string }) => <span>{skill}</span>,
}));

vi.mock('@/components/shared/ShareButton', () => ({
  ShareButton: () => <button type="button">Share</button>,
}));

vi.mock('@/components/shared/ReportButton', () => ({
  ReportButton: () => <button type="button">Report</button>,
}));

vi.mock('../ResumeCarousel', () => ({
  ResumeCarousel: ({ url }: { url: string }) => <div>Rendered resume: {url}</div>,
}));

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => authState,
}));

vi.mock('@/lib/api', () => ({
  getProfile: (...args: unknown[]) => getProfileMock(...args),
  getResumeUrl: (...args: unknown[]) => getResumeUrlMock(...args),
}));

vi.mock('@/lib/analytics', () => ({
  trackEvent: vi.fn(),
}));

const baseProfile: Profile = {
  code: 'prof123abc456',
  person_name: 'Sheba',
  current_title: 'Executive Assistant',
  current_city: 'Dubai',
  current_country: 'UAE',
  years_of_experience: 10,
  brief: 'Experienced operator.',
  key_skills: ['Operations', 'Executive Support'],
  notice_period: '1_month',
  relocation_preference: 'open',
  current_employment_status: 'full_time',
  has_resume: true,
  status: 'active',
  view_count: 12,
  renewal_count: 0,
  expires_at: new Date(Date.now() + 86400000).toISOString(),
  is_verified: true,
  is_active: true,
  is_owner: false,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

describe('ProfileDetail', () => {
  beforeEach(() => {
    authState.isActiveRecruiter = false;
    authState.sessionToken = null;
    getProfileMock.mockReset();
    getResumeUrlMock.mockReset();
  });

  it('keeps contact information masked for public viewers', () => {
    render(<ProfileDetail profile={baseProfile} />);

    expect(screen.getByText('●●●@●●●.com')).toBeInTheDocument();
    expect(getProfileMock).not.toHaveBeenCalled();
    expect(getResumeUrlMock).not.toHaveBeenCalled();
  });

  it('reveals contact details and resume for active recruiters after authed hydration', async () => {
    authState.isActiveRecruiter = true;
    authState.sessionToken = 'recruiter-token';
    getProfileMock.mockResolvedValue({
      ...baseProfile,
      email: 'talent@example.com',
      contact_number: '+971501112233',
    });
    getResumeUrlMock.mockResolvedValue({
      url: 'https://example.com/resume.pdf',
      expires_in: 900,
    });

    render(<ProfileDetail profile={baseProfile} />);

    await waitFor(() => {
      expect(screen.getByText('talent@example.com')).toBeInTheDocument();
    });

    expect(screen.getByText('+971501112233')).toBeInTheDocument();
    expect(screen.getByText('Rendered resume: https://example.com/resume.pdf')).toBeInTheDocument();
    expect(getProfileMock).toHaveBeenCalledWith(baseProfile.code, 'recruiter-token');
    expect(getResumeUrlMock).toHaveBeenCalledWith(baseProfile.code, 'recruiter-token');
  });

  it('reveals owner contact details and resume after authed hydration', async () => {
    authState.sessionToken = 'owner-token';
    getProfileMock.mockResolvedValue({
      ...baseProfile,
      is_owner: true,
      email: 'owner@example.com',
      contact_number: '+971507778889',
    });
    getResumeUrlMock.mockResolvedValue({
      url: 'https://example.com/owner-resume.pdf',
      expires_in: 900,
    });

    render(<ProfileDetail profile={baseProfile} />);

    await waitFor(() => {
      expect(screen.getByText('owner@example.com')).toBeInTheDocument();
    });

    expect(screen.getByText('+971507778889')).toBeInTheDocument();
    expect(screen.getByText('Rendered resume: https://example.com/owner-resume.pdf')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Your view' })).toBeInTheDocument();
    expect(getResumeUrlMock).toHaveBeenCalledWith(baseProfile.code, 'owner-token');
  });
});
