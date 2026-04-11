import { memo } from 'react';
import Link from 'next/link';
import { SkillTag } from '@/components/shared/SkillTag';
import { EmploymentTypeBadge } from '@/components/shared/EmploymentTypeBadge';
import { timeAgo, formatDeadline, getCountryLabel } from '@/lib/utils';
import type { JobListItem } from '@/lib/types';

interface JobCardProps {
  job: JobListItem;
}

export const JobCard = memo(function JobCard({ job }: JobCardProps) {
  const displaySkills = job.key_skills.slice(0, 4);
  const extraSkills = job.key_skills.length - displaySkills.length;

  return (
    <Link href={`/jobs/${job.code}`} className="block group">
      <article className="h-full flex flex-col bg-surface-lowest rounded-2xl shadow-ambient transition-all duration-300 hover:shadow-ambient-hover hover:-translate-y-1 p-6 gap-4">

        {/* Row 1: Employment type badge + time posted */}
        <div className="flex items-center justify-between gap-2">
          <EmploymentTypeBadge type={job.employment_type} />
          <span className="text-xs text-text-muted/70 whitespace-nowrap">{timeAgo(job.created_at)}</span>
        </div>

        {/* Row 2: Title + Company — full width, no avatar */}
        <div className="min-w-0">
          <h3 className="font-heading text-2xl leading-snug text-text-main group-hover:text-primary transition-colors line-clamp-2">
            {job.job_title}
          </h3>
          <p className="text-sm mt-1 font-medium text-secondary truncate">
            {job.company_name}
          </p>
        </div>

        {/* Row 3: Skills */}
        {displaySkills.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {displaySkills.map((skill, index) => (
              <SkillTag key={skill} skill={skill} colorIndex={index} />
            ))}
            {extraSkills > 0 && (
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full text-text-muted bg-surface">
                +{extraSkills}
              </span>
            )}
          </div>
        )}

        {/* Row 4: Footer — flex-col prevents overflow at narrow widths */}
        <div className="border-t border-border/10 pt-4 mt-auto flex flex-col gap-2">
          {/* Location */}
          <div className="flex items-center gap-1.5 text-sm text-text-muted min-w-0">
            <svg className="h-3.5 w-3.5 flex-shrink-0 text-text-muted/70" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.273 1.765 11.842 11.842 0 00.976.544l.062.029.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" clipRule="evenodd" />
            </svg>
            <span className="truncate">{job.company_city}, {getCountryLabel(job.company_country)}</span>
          </div>

          {/* Deadline + CTA */}
          <div className="flex items-center justify-between gap-2">
            {job.deadline_date ? (
              <span className="text-xs font-medium text-secondary/80 truncate">
                Due {formatDeadline(job.deadline_date)}
              </span>
            ) : (
              <span />
            )}
            <span className="text-sm font-semibold text-primary whitespace-nowrap flex-shrink-0">
              View Details →
            </span>
          </div>
        </div>

      </article>
    </Link>
  );
});
