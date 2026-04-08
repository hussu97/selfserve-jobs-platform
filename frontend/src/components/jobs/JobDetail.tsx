import ReactMarkdown from 'react-markdown';
import Link from 'next/link';
import { EmploymentTypeBadge } from '@/components/shared/EmploymentTypeBadge';
import { SkillTag } from '@/components/shared/SkillTag';
import { ShareButton } from '@/components/shared/ShareButton';
import { ReportButton } from '@/components/shared/ReportButton';
import { formatDate, formatDeadline, getCountryLabel, timeAgo } from '@/lib/utils';
import type { Job } from '@/lib/types';

interface JobDetailProps {
  job: Job;
}

export function JobDetail({ job }: JobDetailProps) {
  return (
    <article className="max-w-4xl mx-auto">
      {/* Back link */}
      <Link
        href="/jobs"
        className="inline-flex items-center gap-1.5 text-sm mb-6 hover:opacity-70 transition-opacity"
        style={{ color: 'var(--color-text-muted)' }}
      >
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
        </svg>
        Back to jobs
      </Link>

      {/* Header */}
      <header className="mb-8">
        <div className="flex flex-wrap items-start gap-3 mb-3">
          <EmploymentTypeBadge type={job.employment_type} size="md" />
          {job.deadline_date && (
            <span
              className="text-sm px-2.5 py-1 rounded-full border font-medium"
              style={{
                color: 'var(--color-primary)',
                borderColor: 'var(--color-primary)',
                backgroundColor: 'rgba(194, 112, 62, 0.05)',
              }}
            >
              Deadline: {formatDeadline(job.deadline_date)}
            </span>
          )}
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold mb-2" style={{ fontFamily: 'Lora, serif', color: 'var(--color-secondary)' }}>
          {job.job_title}
        </h1>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-4">
          <span className="font-semibold text-lg" style={{ color: 'var(--color-text)' }}>
            {job.company_name}
          </span>
          <span className="flex items-center gap-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
            <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.273 1.765 11.842 11.842 0 00.976.544l.062.029.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" clipRule="evenodd" />
            </svg>
            {job.company_city}, {getCountryLabel(job.company_country)}
          </span>
          <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Posted {timeAgo(job.created_at)}
          </span>
        </div>

        {/* Skills */}
        {job.key_skills.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {job.key_skills.map((skill) => (
              <SkillTag key={skill} skill={skill} size="md" />
            ))}
          </div>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2">
          <div
            className="rounded-xl border p-6 mb-6"
            style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
          >
            <h2 className="text-xl font-semibold mb-4" style={{ fontFamily: 'Lora, serif', color: 'var(--color-secondary)' }}>
              Job description
            </h2>
            <div className="prose">
              <ReactMarkdown>{job.description}</ReactMarkdown>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="flex flex-col gap-4">
          {/* Apply / Contact */}
          <div
            className="rounded-xl border p-5"
            style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
          >
            <h3 className="font-semibold mb-3" style={{ color: 'var(--color-secondary)', fontFamily: 'Lora, serif' }}>
              How to apply
            </h3>
            {job.contact_method === 'email' && job.contact_email ? (
              <a
                href={`mailto:${job.contact_email}`}
                className="inline-flex items-center justify-center w-full gap-2 px-4 py-3 rounded-xl text-white font-medium transition-opacity hover:opacity-90"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path d="M3 4a2 2 0 00-2 2v1.161l8.441 4.221a1.25 1.25 0 001.118 0L19 7.162V6a2 2 0 00-2-2H3z" />
                  <path d="M19 8.839l-7.77 3.885a2.75 2.75 0 01-2.46 0L1 8.839V14a2 2 0 002 2h14a2 2 0 002-2V8.839z" />
                </svg>
                Apply via email
              </a>
            ) : job.contact_url ? (
              <a
                href={job.contact_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center w-full gap-2 px-4 py-3 rounded-xl text-white font-medium transition-opacity hover:opacity-90"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M4.25 5.5a.75.75 0 00-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 00.75-.75v-4a.75.75 0 011.5 0v4A2.25 2.25 0 0112.75 17h-8.5A2.25 2.25 0 012 14.75v-8.5A2.25 2.25 0 014.25 4h5a.75.75 0 010 1.5h-5z" clipRule="evenodd" />
                  <path fillRule="evenodd" d="M6.194 12.753a.75.75 0 001.06.053L16.5 4.44v2.81a.75.75 0 001.5 0v-4.5a.75.75 0 00-.75-.75h-4.5a.75.75 0 000 1.5h2.553l-9.056 8.194a.75.75 0 00-.053 1.06z" clipRule="evenodd" />
                </svg>
                Apply now
              </a>
            ) : null}
          </div>

          {/* Job info */}
          <div
            className="rounded-xl border p-5 flex flex-col gap-3"
            style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
          >
            <h3 className="font-semibold" style={{ color: 'var(--color-secondary)', fontFamily: 'Lora, serif' }}>
              Details
            </h3>
            <dl className="flex flex-col gap-2.5 text-sm">
              <div className="flex justify-between">
                <dt style={{ color: 'var(--color-text-muted)' }}>Type</dt>
                <dd>
                  <EmploymentTypeBadge type={job.employment_type} />
                </dd>
              </div>
              <div className="flex justify-between">
                <dt style={{ color: 'var(--color-text-muted)' }}>Location</dt>
                <dd style={{ color: 'var(--color-text)' }}>{job.company_city}, {getCountryLabel(job.company_country)}</dd>
              </div>
              {job.deadline_date && (
                <div className="flex justify-between">
                  <dt style={{ color: 'var(--color-text-muted)' }}>Deadline</dt>
                  <dd style={{ color: 'var(--color-text)' }}>{formatDate(job.deadline_date)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt style={{ color: 'var(--color-text-muted)' }}>Posted</dt>
                <dd style={{ color: 'var(--color-text)' }}>{formatDate(job.created_at)}</dd>
              </div>
            </dl>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <ShareButton title={`${job.job_title} at ${job.company_name}`} />
            <ReportButton entityType="jobs" entityCode={job.code} />
          </div>
        </aside>
      </div>
    </article>
  );
}
