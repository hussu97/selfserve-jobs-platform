'use client';

import { useEffect } from 'react';
import { trackJobView, trackProfileView } from '@/lib/api';

interface ViewTrackerProps {
  entityType: 'job' | 'profile';
  code: string;
}

export function ViewTracker({ entityType, code }: ViewTrackerProps) {
  useEffect(() => {
    const key = `viewed_${entityType}_${code}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
    const fn = entityType === 'job' ? trackJobView : trackProfileView;
    fn(code).catch(() => {});
  }, [entityType, code]);

  return null;
}
