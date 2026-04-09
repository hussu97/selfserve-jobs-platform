import { Badge } from '@/components/ui/Badge';
import { getEmploymentTypeLabel } from '@/lib/utils';
import type { EmploymentType } from '@/lib/types';

interface EmploymentTypeBadgeProps {
  type: EmploymentType;
  size?: 'sm' | 'md';
}

const TYPE_COLORS: Record<EmploymentType, 'primary' | 'secondary' | 'accent' | 'default' | 'warning'> = {
  full_time: 'secondary',
  part_time: 'accent',
  contract: 'primary',
  consulting: 'primary',
  freelance: 'warning',
  internship: 'default',
  remote: 'accent',
};

export function EmploymentTypeBadge({ type, size = 'sm' }: EmploymentTypeBadgeProps) {
  return (
    <Badge variant={TYPE_COLORS[type] ?? 'default'} size={size}>
      {getEmploymentTypeLabel(type)}
    </Badge>
  );
}
