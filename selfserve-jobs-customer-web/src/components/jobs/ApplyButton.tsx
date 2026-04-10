'use client';

import { trackEvent } from '@/lib/analytics';

interface ApplyButtonProps {
  href: string;
  method: 'email' | 'url';
}

export function ApplyButton({ href, method }: ApplyButtonProps) {
  return (
    <a
      href={href}
      target={method !== 'email' ? '_blank' : undefined}
      rel={method !== 'email' ? 'noopener noreferrer' : undefined}
      onClick={() => trackEvent('job-apply-click', { method })}
      className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold text-white bg-primary-btn hover:bg-primary transition-all flex-shrink-0 shadow-ambient"
    >
      Apply now
      <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
      </svg>
    </a>
  );
}
