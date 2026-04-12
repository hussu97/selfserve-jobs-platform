'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://hirebridgeuae.com';

/**
 * Dynamically updates the <link rel="canonical"> tag for client-side paginated pages.
 *
 * - Page 1: canonical = base path (no ?page param)
 * - Page 2+: canonical = base path + ?page=N
 *
 * Other filter params (search, country, etc.) are intentionally excluded from the
 * canonical URL — only pagination affects canonicalization.
 */
export function CanonicalTag() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const page = searchParams.get('page');
    const pageNum = page ? parseInt(page, 10) : 1;

    let canonical = `${SITE_URL}${pathname}`;
    if (pageNum > 1) {
      canonical += `?page=${pageNum}`;
    }

    let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      document.head.appendChild(link);
    }
    link.href = canonical;

    return () => {
      // Leave the canonical in place — it will be overwritten on next render
    };
  }, [pathname, searchParams]);

  return null;
}
