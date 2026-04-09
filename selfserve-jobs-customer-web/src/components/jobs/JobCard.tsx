import Link from 'next/link';
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
  const initial = job.company_name.charAt(0).toUpperCase();
  const description = (job as unknown as Record<string, unknown>).description as string | undefined;

  return (
    <Link href={`/jobs/${job.code}`} className="block group">
      <article className="h-full flex flex-col bg-surface-lowest rounded-2xl shadow-ambient transition-all duration-300 hover:shadow-ambient-hover hover:-translate-y-1 p-8 gap-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-surface flex items-center justify-center text-primary font-heading text-xl select-none">
              {initial}
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <h3 className="font-heading text-2xl leading-snug text-text-main group-hover:text-primary transition-colors line-clamp-2">
                {job.job_title}
              </h3>
              <p className="text-sm mt-1 font-medium text-secondary truncate">
                {job.company_name}
              </p>
            </div>
          </div>
          <div className="flex-shrink-0 mt-1">
            <EmploymentTypeBadge type={job.employment_type} />
          </div>
        </div>

        {description && (
          <p className="text-sm text-text-muted leading-relaxed line-clamp-2">
            {description}
          </p>
        )}

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

        <div className="border-t border-border/10 pt-5 flex items-center justify-between mt-auto">
          <div className="flex items-center gap-1.5 text-sm text-text-muted">
            <svg className="h-4 w-4 flex-shrink-0 text-text-muted/70" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.273 1.765 11.842 11.842 0 00.976.544l.062.029.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" clipRule="evenodd" />
            </svg>
            <span className="truncate">{job.company_city}, {getCountryLabel(job.company_country)}</span>
            <span className="text-text-muted/60 mx-1">·</span>
            <span>{timeAgo(job.created_at)}</span>
            {job.deadline_date && (
              <>
                <span className="text-text-muted/60 mx-1">·</span>
                <span className="font-medium text-secondary/80">Due {formatDeadline(job.deadline_date)}</span>
              </>
            )}
          </div>
          <span className="text-sm font-semibold text-primary whitespace-nowrap">
            View Details →
          </span>
        </div>
      </article>
    </Link>
  );
}
