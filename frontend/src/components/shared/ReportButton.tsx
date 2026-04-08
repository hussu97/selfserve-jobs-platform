'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import type { EntityType } from '@/lib/types';

interface ReportButtonProps {
  entityType: EntityType;
  entityCode: string;
}

export function ReportButton({ entityType, entityCode }: ReportButtonProps) {
  return (
    <Link href={`/report?type=${entityType}&code=${entityCode}`}>
      <Button variant="ghost" size="sm">
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 7l2.55 3.4A1 1 0 0116 12H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z" clipRule="evenodd" />
        </svg>
        Report
      </Button>
    </Link>
  );
}
