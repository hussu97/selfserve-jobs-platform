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
        'rounded-xl border',
        'bg-[#F0EBE1] border-[#DDD5C8]',
        hover && 'transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 hover:border-[#C2703E]/30',
        paddings[padding],
        className
      )}
    >
      {children}
    </div>
  );
}
