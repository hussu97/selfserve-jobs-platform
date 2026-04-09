import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({ children, className, hover = false, padding = 'md' }: CardProps) {
  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-5',
    lg: 'p-6',
  };

  return (
    <div
      className={cn(
        'rounded-2xl bg-surface-lowest shadow-ambient',
        hover && 'transition-all duration-300 cursor-pointer hover:shadow-ambient-hover hover:-translate-y-1',
        paddings[padding],
        className
      )}
    >
      {children}
    </div>
  );
}
