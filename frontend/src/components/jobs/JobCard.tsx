import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { SkillTag } from '@/components/shared/SkillTag';
import { EmploymentTypeBadge } from '@/components/shared/EmploymentTypeBadge';
import { timeAgo, formatDeadline, getCountryLabel } from '@/lib/utils';
import type { JobListItem } from '@/lib/types';

interface JobCardProps {
  job: JobListItem;
}

export function JobCard({ job }: JobCardProps) {
  const displaySkills = job.key_skills.slice(0, 4);
  const extraSkills = job.key_skills.length - displaySkills.length;

  return (
    <Link href={`/jobs/${job.code}`} className="block group">
      <Card hover padding="md" className="h-full flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3
              className="font-semibold text-base leading-snug group-hover:text-[#C2703E] transition-colors line-clamp-2"
              style={{ color: 'var(--color-text)' }}
            >
              {job.job_title}
            </h3>
            <p
              className="text-sm mt-0.5 font-medium"
              style={{ color: 'var(--color-secondary)' }}
            >
              {job.company_name}
            </p>
          </div>
          <EmploymentTypeBadge type={job.employment_type} />
        </div>

        {/* Location */}
        <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-text-muted)' }}>
          <svg className="h-3.5 w-3.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.273 1.765 11.842 11.842 0 00.976.544l.062.029.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" clipRule="evenodd" />
          </svg>
          <span>{job.company_city}, {getCountryLabel(job.company_country)}</span>
        </div>

        {/* Skills */}
        {displaySkills.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {displaySkills.map((skill) => (
              <SkillTag key={skill} skill={skill} />
            ))}
            {extraSkills > 0 && (
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{ color: 'var(--color-text-muted)' }}
              >
                +{extraSkills} more
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-auto pt-1">
          <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            {timeAgo(job.created_at)}
          </span>
          {job.deadline_date && (
            <span
              className="text-xs font-medium"
              style={{ color: 'var(--color-primary)' }}
            >
              Deadline: {formatDeadline(job.deadline_date)}
            </span>
          )}
        </div>
      </Card>
    </Link>
  );
}
