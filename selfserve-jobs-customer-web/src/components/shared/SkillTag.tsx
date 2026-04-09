import { cn } from '@/lib/utils';

interface SkillTagProps {
  skill: string;
  removable?: boolean;
  onRemove?: (skill: string) => void;
  className?: string;
  size?: 'sm' | 'md';
  colorIndex?: number;
}

const COLOR_FAMILIES = [
  'bg-secondary-fixed text-on-secondary-fixed-variant',
  'bg-tertiary-fixed text-on-tertiary-fixed-variant',
  'bg-surface-container-high text-on-surface-variant',
];

export function SkillTag({ skill, removable = false, onRemove, className, size = 'sm', colorIndex }: SkillTagProps) {
  const colorClass =
    colorIndex !== undefined
      ? COLOR_FAMILIES[colorIndex % 3]
      : 'bg-accent/20 text-accent-dark';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-semibold uppercase tracking-wider',
        colorClass,
        size === 'sm' ? 'px-2.5 py-0.5 text-[10px]' : 'px-3 py-1 text-xs',
        className
      )}
    >
      {skill}
      {removable && onRemove && (
        <button
          type="button"
          onClick={() => onRemove(skill)}
          className="ml-0.5 rounded-full hover:bg-accent/30 transition-colors p-0.5 cursor-pointer"
          aria-label={`Remove ${skill}`}
        >
          <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
          </svg>
        </button>
      )}
    </span>
  );
}
