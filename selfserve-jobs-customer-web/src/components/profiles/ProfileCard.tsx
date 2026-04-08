import Link from 'next/link';
import { Card } from '@/components/ui/Card';
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
      <Card hover padding="md" className="h-full flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base leading-snug text-text-main group-hover:text-primary transition-colors">
              {profile.person_name}
            </h3>
            <p className="text-sm mt-0.5 font-medium text-secondary">
              {profile.current_title}
            </p>
          </div>
          <Badge variant={RELOCATION_BADGE[profile.relocation_preference] ?? 'default'} size="sm">
            {getRelocationLabel(profile.relocation_preference)}
          </Badge>
        </div>

        {/* Location & Experience */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-muted">
          <span className="flex items-center gap-1">
            <svg className="h-3.5 w-3.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.273 1.765 11.842 11.842 0 00.976.544l.062.029.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" clipRule="evenodd" />
            </svg>
            {profile.current_city}, {getCountryLabel(profile.current_country)}
          </span>
          <span>{formatExperience(profile.years_of_experience)} exp.</span>
        </div>

        {/* Skills */}
        {displaySkills.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {displaySkills.map((skill) => (
              <SkillTag key={skill} skill={skill} />
            ))}
            {extraSkills > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full text-text-muted">
                +{extraSkills} more
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-auto pt-1">
          <span className="text-xs text-text-muted">
            {timeAgo(profile.created_at)}
          </span>
          <span className="text-xs font-medium text-text-muted">
            Available: {getNoticePeriodLabel(profile.notice_period)}
          </span>
        </div>
      </Card>
    </Link>
  );
}
