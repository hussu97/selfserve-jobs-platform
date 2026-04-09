'use client';

import { useEffect } from 'react';

interface ViewTrackerProps {
  entityType: 'job' | 'profile';
  code: string;
  trackFn: (code: string) => Promise<void>;
}

export function ViewTracker({ entityType, code, trackFn }: ViewTrackerProps) {
  useEffect(() => {
    const key = `viewed_${entityType}_${code}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
    trackFn(code).catch(() => {});
  }, [entityType, code, trackFn]);

  return null;
}
