import { cn } from '@/lib/utils';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Spinner({ size = 'md', className }: SpinnerProps) {
  const sizes = {
    sm: 'h-4 w-4 border-2',
    md: 'h-7 w-7 border-2',
    lg: 'h-10 w-10 border-3',
  };

  return (
    <div
      className={cn(
        'animate-spin rounded-full border-t-transparent',
        'border-primary',
        sizes[size],
        className
      )}
      role="status"
      aria-label="Loading"
    />
  );
}

export function SpinnerPage() {
  return (
    <div className="flex items-center justify-center min-h-[300px]">
      <div className="flex flex-col items-center gap-3">
        <Spinner size="lg" />
        <p className="text-sm text-text-muted">
          Loading…
        </p>
      </div>
    </div>
  );
}
