import ReactMarkdown from 'react-markdown';
import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { SkillTag } from '@/components/shared/SkillTag';
import { ShareButton } from '@/components/shared/ShareButton';
import { ReportButton } from '@/components/shared/ReportButton';
import {
  formatDate,
  getCountryLabel,
  getNoticePeriodLabel,
  getRelocationLabel,
  formatExperience,
  timeAgo,
} from '@/lib/utils';
import type { Profile } from '@/lib/types';

interface ProfileDetailProps {
  profile: Profile;
}

const RELOCATION_BADGE: Record<string, 'success' | 'default' | 'warning'> = {
  yes: 'success',
  open: 'warning',
  no: 'default',
};

export function ProfileDetail({ profile }: ProfileDetailProps) {
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

        <h1 className="text-3xl sm:text-4xl font-bold mb-1 text-secondary">
          {profile.person_name}
        </h1>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-4">
          <span className="font-semibold text-lg text-text-main">
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
          <div className="rounded-xl border border-border bg-surface p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-secondary">
              About
            </h2>
            <div className="prose">
              <ReactMarkdown>{profile.brief}</ReactMarkdown>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="flex flex-col gap-4">
          {/* Contact / LinkedIn */}
          {profile.linkedin_profile_link && (
            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="font-semibold mb-3 text-secondary">
                Connect
              </h3>
              <a
                href={profile.linkedin_profile_link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center w-full gap-2 px-4 py-3 rounded-xl text-white font-medium transition-opacity hover:opacity-90"
                style={{ backgroundColor: '#0A66C2' }}
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
                View LinkedIn
              </a>
            </div>
          )}

          {/* Profile details */}
          <div className="rounded-xl border border-border bg-surface p-5 flex flex-col gap-3">
            <h3 className="font-semibold text-secondary">
              Details
            </h3>
            <dl className="flex flex-col gap-2.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-text-muted">Experience</dt>
                <dd className="text-text-main">{formatExperience(profile.years_of_experience)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-text-muted">Location</dt>
                <dd className="text-text-main">
                  {profile.current_city}, {getCountryLabel(profile.current_country)}
                </dd>
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
              {profile.has_resume && (
                <div className="flex justify-between">
                  <dt className="text-text-muted">Resume</dt>
                  <dd className="text-xs font-medium text-accent">
                    Available
                  </dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-text-muted">Listed</dt>
                <dd className="text-text-main">{formatDate(profile.created_at)}</dd>
              </div>
            </dl>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <ShareButton title={`${profile.person_name} — ${profile.current_title}`} />
            <ReportButton entityType="profiles" entityCode={profile.code} />
          </div>
        </aside>
      </div>
    </article>
  );
}
