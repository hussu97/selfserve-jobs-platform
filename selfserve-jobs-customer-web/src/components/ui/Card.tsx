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
        'rounded-xl border bg-bg',
        'border-border/70 shadow-[0_1px_4px_rgba(44,40,37,0.06)]',
        hover && 'transition-all duration-200 cursor-pointer hover:shadow-[0_6px_20px_rgba(44,40,37,0.10)] hover:-translate-y-0.5 hover:border-border',
        paddings[padding],
        className
      )}
    >
      {children}
    </div>
  );
}
