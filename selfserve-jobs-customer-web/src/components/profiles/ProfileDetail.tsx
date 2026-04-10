'use client';

import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { SkillTag } from '@/components/shared/SkillTag';
import { ShareButton } from '@/components/shared/ShareButton';
import { ReportButton } from '@/components/shared/ReportButton';
import {
  getCountryLabel,
  getNoticePeriodLabel,
  getRelocationLabel,
  formatExperience,
  timeAgo,
} from '@/lib/utils';
import { getResumeUrl } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import type { Profile } from '@/lib/types';

interface ProfileDetailProps {
  profile: Profile;
}

// LinkedIn brand color — not a design system token
const LINKEDIN_BLUE = '#0A66C2';

const RELOCATION_BADGE: Record<string, 'success' | 'default' | 'warning'> = {
  yes: 'success',
  open: 'warning',
  no: 'default',
};

export function ProfileDetail({ profile }: ProfileDetailProps) {
  const { isActiveRecruiter, sessionToken } = useAuth();
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);

  useEffect(() => {
    if (isActiveRecruiter && profile.has_resume && sessionToken) {
      getResumeUrl(profile.code, sessionToken)
        .then((r) => setResumeUrl(r.url))
        .catch(() => setResumeUrl(null));
    }
  }, [isActiveRecruiter, profile.has_resume, profile.code, sessionToken]);

  return (
    <article className="max-w-4xl mx-auto">
      {/* Back link */}
      <Link
        href="/profiles"
        className="inline-flex items-center gap-1.5 text-sm mb-6 hover:opacity-70 transition-opacity text-text-muted"
      >
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
        </svg>
        Back to profiles
      </Link>

      {/* Header */}
      <header className="mb-8">
        <div className="flex flex-wrap items-start gap-3 mb-3">
          <Badge variant={RELOCATION_BADGE[profile.relocation_preference] ?? 'default'} size="md">
            {getRelocationLabel(profile.relocation_preference)}
          </Badge>
        </div>

        <h1 className="font-heading text-3xl sm:text-4xl text-primary leading-tight mb-1">
          {profile.person_name}
        </h1>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-4">
          <span className="text-secondary font-medium text-lg">
            {profile.current_title}
          </span>
          <span className="flex items-center gap-1 text-sm text-text-muted">
            <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.273 1.765 11.842 11.842 0 00.976.544l.062.029.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" clipRule="evenodd" />
            </svg>
            {profile.current_city}, {getCountryLabel(profile.current_country)}
          </span>
          <span className="text-sm text-text-muted">
            Listed {timeAgo(profile.created_at)}
          </span>
        </div>

        {/* Skills */}
        {profile.key_skills.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {profile.key_skills.map((skill) => (
              <SkillTag key={skill} skill={skill} size="md" />
            ))}
          </div>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2">
          {/* About */}
          <div className="bg-surface-lowest rounded-2xl shadow-ambient p-6 mb-6">
            <h2 className="font-heading text-xl text-primary mb-4">About</h2>
            <div className="prose">
              <ReactMarkdown>{profile.brief}</ReactMarkdown>
            </div>
          </div>

          {/* Resume section */}
          {profile.has_resume && (
            <div className="bg-surface-lowest rounded-2xl shadow-ambient p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-heading text-xl text-primary">Resume</h2>
                {isActiveRecruiter && resumeUrl && (
                  <div className="flex items-center gap-1">
                    <a
                      href={resumeUrl}
                      download
                      className="p-1.5 rounded-lg text-text-muted hover:text-primary hover:bg-surface transition-colors"
                      title="Download resume"
                    >
                      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" />
                        <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
                      </svg>
                    </a>
                    <a
                      href={resumeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg text-text-muted hover:text-primary hover:bg-surface transition-colors"
                      title="Open in new tab"
                    >
                      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M4.25 5.5a.75.75 0 00-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 00.75-.75v-4a.75.75 0 011.5 0v4A2.25 2.25 0 0112.75 17h-8.5A2.25 2.25 0 012 14.75v-8.5A2.25 2.25 0 014.25 4h5a.75.75 0 010 1.5h-5z" clipRule="evenodd" />
                        <path fillRule="evenodd" d="M6.194 12.753a.75.75 0 001.06.053L16.5 4.44v2.81a.75.75 0 001.5 0v-4.5a.75.75 0 00-.75-.75h-4.5a.75.75 0 000 1.5h2.553l-9.056 8.194a.75.75 0 00-.053 1.06z" clipRule="evenodd" />
                      </svg>
                    </a>
                  </div>
                )}
              </div>

              {isActiveRecruiter && resumeUrl ? (
                <div className="w-full rounded-xl overflow-hidden">
                  <object
                    data={resumeUrl}
                    type="application/pdf"
                    className="w-full"
                    style={{ height: '700px' }}
                  >
                    <p className="text-sm text-text-muted">
                      Unable to display PDF.{' '}
                      <a
                        href={resumeUrl}
                        download
                        className="text-primary hover:opacity-70 transition-opacity underline"
                      >
                        Download resume
                      </a>
                    </p>
                  </object>
                </div>
              ) : (
                /* Blurred/locked resume for non-recruiters */
                <div className="relative rounded-xl overflow-hidden" style={{ height: '300px' }}>
                  <div
                    className="absolute inset-0 bg-surface flex flex-col items-center justify-center z-10"
                    style={{ backdropFilter: 'blur(4px)' }}
                  >
                    <div className="text-center px-6">
                      <div className="w-12 h-12 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center mx-auto mb-3">
                        <svg className="w-6 h-6 text-[var(--color-text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <p className="text-sm font-medium text-[var(--color-text-main)] mb-1">
                        Resume available to verified recruiters
                      </p>
                      <p className="text-xs text-[var(--color-text-muted)] mb-4">
                        Register for free recruiter access to view and download resumes
                      </p>
                      <Link
                        href="/recruiter/register"
                        className="inline-flex items-center justify-center bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white rounded-full px-5 py-2 text-xs font-medium transition-colors"
                      >
                        Apply for recruiter access
                      </Link>
                    </div>
                  </div>
                  {/* Decorative blurred background */}
                  <div className="w-full h-full bg-surface opacity-40" />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="flex flex-col gap-4">
          {/* Contact info — recruiter only */}
          <div className="bg-surface-lowest rounded-2xl shadow-ambient p-5">
            <h3 className="font-heading text-xl text-primary mb-3">Contact</h3>
            {isActiveRecruiter && (profile.email || profile.contact_number) ? (
              <div className="flex flex-col gap-2 text-sm">
                {profile.email && (
                  <a
                    href={`mailto:${profile.email}`}
                    className="flex items-center gap-2 text-[var(--color-primary)] hover:opacity-70 transition-opacity"
                  >
                    <svg className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path d="M3 4a2 2 0 00-2 2v1.161l8.441 4.221a1.25 1.25 0 001.118 0L19 7.162V6a2 2 0 00-2-2H3z" />
                      <path d="M19 8.839l-7.77 3.885a2.75 2.75 0 01-2.46 0L1 8.839V14a2 2 0 002 2h14a2 2 0 002-2V8.839z" />
                    </svg>
                    {profile.email}
                  </a>
                )}
                {profile.contact_number && (
                  <a
                    href={`tel:${profile.contact_number}`}
                    className="flex items-center gap-2 text-[var(--color-primary)] hover:opacity-70 transition-opacity"
                  >
                    <svg className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M2 3.5A1.5 1.5 0 013.5 2h1.148a1.5 1.5 0 011.465 1.175l.716 3.223a1.5 1.5 0 01-1.052 1.767l-.933.267c-.41.117-.643.555-.48.95a11.542 11.542 0 006.254 6.254c.395.163.833-.07.95-.48l.267-.933a1.5 1.5 0 011.767-1.052l3.223.716A1.5 1.5 0 0118 15.352V16.5a1.5 1.5 0 01-1.5 1.5H15c-1.149 0-2.263-.15-3.326-.43A13.022 13.022 0 012.43 8.326 13.019 13.019 0 012 5V3.5z" clipRule="evenodd" />
                    </svg>
                    {profile.contact_number}
                  </a>
                )}
              </div>
            ) : (
              <div className="text-sm">
                <div className="flex flex-col gap-1.5 mb-3">
                  <div className="flex items-center gap-2 text-[var(--color-text-muted)]">
                    <svg className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path d="M3 4a2 2 0 00-2 2v1.161l8.441 4.221a1.25 1.25 0 001.118 0L19 7.162V6a2 2 0 00-2-2H3z" />
                      <path d="M19 8.839l-7.77 3.885a2.75 2.75 0 01-2.46 0L1 8.839V14a2 2 0 002 2h14a2 2 0 002-2V8.839z" />
                    </svg>
                    <span className="text-xs tracking-wider">●●●@●●●.com</span>
                  </div>
                  <div className="flex items-center gap-2 text-[var(--color-text-muted)]">
                    <svg className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M2 3.5A1.5 1.5 0 013.5 2h1.148a1.5 1.5 0 011.465 1.175l.716 3.223a1.5 1.5 0 01-1.052 1.767l-.933.267c-.41.117-.643.555-.48.95a11.542 11.542 0 006.254 6.254c.395.163.833-.07.95-.48l.267-.933a1.5 1.5 0 011.767-1.052l3.223.716A1.5 1.5 0 0118 15.352V16.5a1.5 1.5 0 01-1.5 1.5H15c-1.149 0-2.263-.15-3.326-.43A13.022 13.022 0 012.43 8.326 13.019 13.019 0 012 5V3.5z" clipRule="evenodd" />
                    </svg>
                    <span className="text-xs tracking-wider">●●● ●●● ●●●●</span>
                  </div>
                </div>
                <p className="text-xs text-[var(--color-text-muted)] mb-2.5">
                  Visible to verified recruiters only
                </p>
                <Link
                  href="/recruiter/register"
                  className="inline-flex items-center text-xs font-medium text-[var(--color-secondary)] hover:text-[var(--color-secondary-hover)] transition-colors"
                >
                  Get recruiter access →
                </Link>
              </div>
            )}
          </div>

          {/* LinkedIn */}
          {profile.linkedin_profile_link && (
            <div className="bg-surface-lowest rounded-2xl shadow-ambient p-5">
              <h3 className="font-heading text-xl text-primary mb-3">Connect</h3>
              <a
                href={profile.linkedin_profile_link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center w-full gap-2 px-4 py-3 rounded-full text-white font-medium transition-all hover:opacity-90 shadow-ambient-hover"
                style={{ backgroundColor: LINKEDIN_BLUE }}
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
                View LinkedIn
              </a>
            </div>
          )}

          {/* Profile details */}
          <div className="bg-surface-lowest rounded-2xl shadow-ambient p-5 flex flex-col gap-3">
            <h3 className="font-heading text-xl text-primary">Details</h3>
            <dl className="flex flex-col gap-2.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-text-muted">Experience</dt>
                <dd className="text-text-main">{formatExperience(profile.years_of_experience)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-text-muted">Available</dt>
                <dd className="text-text-main">{getNoticePeriodLabel(profile.notice_period)}</dd>
              </div>
              <div className="flex justify-between items-center">
                <dt className="text-text-muted">Relocation</dt>
                <dd>
                  <Badge
                    variant={RELOCATION_BADGE[profile.relocation_preference] ?? 'default'}
                    size="sm"
                  >
                    {getRelocationLabel(profile.relocation_preference)}
                  </Badge>
                </dd>
              </div>
            </dl>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <ShareButton title={`${profile.person_name} — ${profile.current_title}`} />
            <ReportButton entityType="profile" entityCode={profile.code} />
          </div>
        </aside>
      </div>
    </article>
  );
}
