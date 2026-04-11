import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn('animate-pulse rounded-lg bg-surface', className)}
      aria-hidden="true"
    />
  );
}

export function JobDetailSkeleton() {
  return (
    <div aria-hidden="true">
      {/* Hero / header block */}
      <div className="hero-gradient">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {/* Breadcrumb */}
          <div className="flex gap-2 mb-6">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-24" />
          </div>
          {/* Title + company */}
          <Skeleton className="h-10 w-3/4 mb-3" />
          <Skeleton className="h-6 w-48 mb-4" />
          {/* Meta row */}
          <div className="flex flex-wrap gap-3 mb-6">
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-5 w-28 rounded-full" />
            <Skeleton className="h-5 w-24 rounded-full" />
          </div>
          {/* Skills */}
          <div className="flex flex-wrap gap-2 mb-8">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-16 rounded-full" />
            ))}
          </div>
          {/* Description lines */}
          <div className="flex flex-col gap-3 max-w-2xl">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className={cn('h-4', i % 4 === 3 ? 'w-2/3' : 'w-full')} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProfileDetailSkeleton() {
  return (
    <div aria-hidden="true">
      {/* Hero / header block */}
      <div className="hero-gradient">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {/* Breadcrumb */}
          <div className="flex gap-2 mb-6">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-28" />
          </div>
          {/* Avatar + name */}
          <div className="flex items-center gap-4 mb-4">
            <Skeleton className="w-16 h-16 rounded-full flex-shrink-0" />
            <div className="flex flex-col gap-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-5 w-36" />
            </div>
          </div>
          {/* Meta badges */}
          <div className="flex flex-wrap gap-3 mb-6">
            <Skeleton className="h-5 w-24 rounded-full" />
            <Skeleton className="h-5 w-28 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          {/* Skills */}
          <div className="flex flex-wrap gap-2 mb-8">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-16 rounded-full" />
            ))}
          </div>
          {/* Brief lines */}
          <div className="flex flex-col gap-3 max-w-2xl">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className={cn('h-4', i % 3 === 2 ? 'w-3/4' : 'w-full')} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function JobCardSkeleton() {
  return (
    <div className="h-full flex flex-col bg-surface-lowest rounded-2xl shadow-ambient p-6 gap-4" aria-hidden="true">
      <div className="flex items-center justify-between gap-2">
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-3 w-14" />
      </div>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <div className="flex gap-1.5">
        <Skeleton className="h-5 w-14 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-12 rounded-full" />
      </div>
      <div className="border-t border-border/10 pt-4 mt-auto flex flex-col gap-2">
        <Skeleton className="h-4 w-1/3" />
        <div className="flex justify-between">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
    </div>
  );
}

export function ProfileCardSkeleton() {
  return (
    <div className="h-full flex flex-col bg-surface-lowest rounded-2xl shadow-ambient p-6 gap-4" aria-hidden="true">
      <div className="flex items-center justify-between gap-2">
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-3 w-14" />
      </div>
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
        <div className="flex flex-col gap-1.5 flex-1">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-3.5 w-1/2" />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
      </div>
      <div className="flex gap-1.5">
        <Skeleton className="h-5 w-14 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-12 rounded-full" />
      </div>
      <div className="border-t border-border/10 pt-4 mt-auto flex flex-col gap-2">
        <Skeleton className="h-4 w-1/3" />
        <div className="flex justify-between">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
    </div>
  );
}
