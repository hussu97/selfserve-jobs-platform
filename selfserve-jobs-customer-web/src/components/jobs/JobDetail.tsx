import ReactMarkdown from 'react-markdown';
import Link from 'next/link';
import { EmploymentTypeBadge } from '@/components/shared/EmploymentTypeBadge';
import { SkillTag } from '@/components/shared/SkillTag';
import { ShareButton } from '@/components/shared/ShareButton';
import { ReportButton } from '@/components/shared/ReportButton';
import { ApplyButton } from '@/components/jobs/ApplyButton';
import { formatDeadline, getCountryLabel, timeAgo } from '@/lib/utils';
import type { Job } from '@/lib/types';

interface JobDetailProps {
  job: Job;
}

export function JobDetail({ job }: JobDetailProps) {
  const applyHref =
    job.contact_method === 'email' && job.contact_email
      ? `mailto:${job.contact_email}`
      : job.contact_url ?? null;

  return (
    <article className="max-w-4xl mx-auto">
      {/* Back link */}
      <Link
        href="/jobs"
        className="inline-flex items-center gap-1.5 text-sm mb-6 hover:opacity-70 transition-opacity text-text-muted"
      >
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
        </svg>
        Back to jobs
      </Link>

      {/* Header */}
      <header className="mb-8">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex flex-wrap items-center gap-3">
            <EmploymentTypeBadge type={job.employment_type} size="md" />
            {job.deadline_date && (
              <span className="text-sm px-2.5 py-1 rounded-full font-medium text-primary bg-primary/10">
                Deadline: {formatDeadline(job.deadline_date)}
              </span>
            )}
          </div>

          {applyHref && (
            <ApplyButton
              href={applyHref}
              method={job.contact_method === 'email' ? 'email' : 'url'}
            />
          )}
        </div>

        <h1 className="font-heading text-3xl sm:text-4xl text-primary leading-tight mb-2">
          {job.job_title}
        </h1>

        {/* Salary display */}
        {(job.salary_min || job.salary_max) && job.salary_currency && (
          <div className="inline-flex items-center gap-1.5 mb-3 px-3 py-1.5 rounded-full bg-surface text-sm font-medium text-[var(--color-accent-dark)]">
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M10.75 10.818v2.614A3.13 3.13 0 0011.888 13c.482-.315.612-.648.612-.875 0-.229-.13-.562-.612-.875a3.13 3.13 0 00-1.138-.432zM8.33 8.62c.053.055.115.11.184.164.208.16.46.284.736.363V6.5l-.746.592A2.25 2.25 0 008.33 8.62z" />
              <path fillRule="evenodd" d="M9.75 2.75a.75.75 0 00-1.5 0v.295a2.98 2.98 0 00-1.189.39l-.23-.23a.75.75 0 10-1.06 1.061l.23.23a2.98 2.98 0 00-.39 1.189H5.25a.75.75 0 000 1.5h.405a2.98 2.98 0 00.39 1.189l-.23.23a.75.75 0 101.06 1.061l.23-.23a2.98 2.98 0 001.189.39v.295a.75.75 0 001.5 0v-.295a2.98 2.98 0 001.189-.39l.23.23a.75.75 0 101.06-1.061l-.23-.23a2.98 2.98 0 00.39-1.189h.405a.75.75 0 000-1.5h-.405a2.98 2.98 0 00-.39-1.189l.23-.23a.75.75 0 10-1.06-1.061l-.23.23a2.98 2.98 0 00-1.189-.39V2.75zM10 6.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" clipRule="evenodd" />
              <path d="M15.5 2a.75.75 0 00-1.5 0v9.5a.75.75 0 001.5 0V2z" />
            </svg>
            {job.salary_currency}{' '}
            {job.salary_min && job.salary_max
              ? `${new Intl.NumberFormat().format(job.salary_min)} – ${new Intl.NumberFormat().format(job.salary_max)}`
              : job.salary_min
              ? `From ${new Intl.NumberFormat().format(job.salary_min)}`
              : `Up to ${new Intl.NumberFormat().format(job.salary_max!)}`}
            {' /month'}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-4">
          <span className="text-secondary font-medium text-lg">
            {job.company_name}
          </span>
          <span className="flex items-center gap-1 text-sm text-text-muted">
            <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.273 1.765 11.842 11.842 0 00.976.544l.062.029.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" clipRule="evenodd" />
            </svg>
            {job.company_city}, {getCountryLabel(job.company_country)}
          </span>
          <span className="text-sm text-text-muted">
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

      {/* Description */}
      <div className="bg-surface-lowest rounded-2xl shadow-ambient p-6 mb-6">
        <h2 className="font-heading text-xl text-primary mb-4">
          Job description
        </h2>
        <div className="prose">
          <ReactMarkdown
            allowedElements={['p', 'ul', 'ol', 'li', 'strong', 'em', 'a', 'blockquote', 'code', 'pre', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'br', 'hr']}
            unwrapDisallowed
          >
            {job.description}
          </ReactMarkdown>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <ShareButton title={`${job.job_title} at ${job.company_name}`} />
        <ReportButton entityType="job" entityCode={job.code} />
      </div>
    </article>
  );
}
