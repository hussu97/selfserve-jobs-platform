import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { SkillTag } from '@/components/shared/SkillTag';
import { timeAgo, getCountryLabel, getRelocationLabel, getNoticePeriodLabel, formatExperience } from '@/lib/utils';
import type { ProfileListItem } from '@/lib/types';

interface ProfileCardProps {
  profile: ProfileListItem;
}

const RELOCATION_BADGE: Record<string, 'success' | 'default' | 'warning'> = {
  yes: 'success',
  open: 'warning',
  no: 'default',
};

export function ProfileCard({ profile }: ProfileCardProps) {
  const displaySkills = profile.key_skills.slice(0, 4);
  const extraSkills = profile.key_skills.length - displaySkills.length;

  return (
    <Link href={`/profiles/${profile.code}`} className="block group">
      <article className="h-full flex flex-col bg-surface-lowest rounded-2xl shadow-ambient overflow-hidden transition-all duration-300 hover:shadow-ambient-hover hover:-translate-y-1">
        <div className="flex flex-col gap-3 p-5 flex-1">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-heading text-lg leading-snug text-text-main group-hover:text-primary transition-colors">
                {profile.person_name}
              </h3>
              <p className="text-sm mt-0.5 font-medium text-secondary truncate">
                {profile.current_title}
              </p>
            </div>
            <div className="flex-shrink-0 mt-0.5">
              <Badge variant={RELOCATION_BADGE[profile.relocation_preference] ?? 'default'} size="sm">
                {getRelocationLabel(profile.relocation_preference)}
              </Badge>
            </div>
          </div>

          {/* Location & Experience */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-muted">
            <span className="flex items-center gap-1">
              <svg className="h-3.5 w-3.5 flex-shrink-0 text-text-muted/70" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.273 1.765 11.842 11.842 0 00.976.544l.062.029.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" clipRule="evenodd" />
              </svg>
              <span className="truncate">{profile.current_city}, {getCountryLabel(profile.current_country)}</span>
            </span>
            <span className="text-text-muted/60">·</span>
            <span>{formatExperience(profile.years_of_experience)} exp.</span>
          </div>

          {/* Skills */}
          {displaySkills.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {displaySkills.map((skill) => (
                <SkillTag key={skill} skill={skill} />
              ))}
              {extraSkills > 0 && (
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full text-text-muted bg-surface">
                  +{extraSkills}
                </span>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between mt-auto pt-3">
            <span className="text-xs text-text-muted">
              {timeAgo(profile.created_at)}
            </span>
            <span className="text-xs text-text-muted">
              {getNoticePeriodLabel(profile.notice_period)}
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
