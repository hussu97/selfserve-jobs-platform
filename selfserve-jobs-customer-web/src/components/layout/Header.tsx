'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MobileNav } from './MobileNav';
import { cn } from '@/lib/utils';

const NAV_LINKS = [
  { href: '/jobs', label: 'Jobs' },
  { href: '/profiles', label: 'Profiles' },
];

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-bg/80 shadow-[0_1px_3px_rgba(28,28,26,0.04)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-[68px]">

            <Link
              href="/"
              className="text-2xl tracking-tight font-heading italic text-primary hover:opacity-75 transition-opacity"
            >
              jobs4u
            </Link>

            <nav className="hidden md:flex items-center gap-6">
              {NAV_LINKS.map((link) => {
                const isActive = pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      'font-heading text-base tracking-tight transition-all',
                      isActive
                        ? 'text-primary font-semibold border-b-2 border-primary pb-0.5'
                        : 'text-text-muted opacity-80 hover:opacity-100 hover:text-primary transition-opacity'
                    )}
                  >
                    {link.label}
                  </Link>
                );
              })}
              <Link
                href="/about"
                className={cn(
                  'font-heading text-base tracking-tight transition-all',
                  pathname === '/about'
                    ? 'text-primary font-semibold border-b-2 border-primary pb-0.5'
                    : 'text-text-muted opacity-80 hover:opacity-100 hover:text-primary transition-opacity'
                )}
              >
                About
              </Link>
            </nav>

            <div className="hidden md:flex items-center gap-2">
              <Link
                href="/jobs/new"
                className="px-4 py-2 text-xs font-semibold uppercase tracking-widest text-text-muted transition-all hover:text-text-main hover:bg-surface/60 rounded-xl"
              >
                Post a Job
              </Link>
              <Link
                href="/profiles/new"
                className="px-5 py-2 text-sm font-semibold uppercase tracking-widest rounded-xl text-white bg-primary shadow-ambient transition-all hover:bg-primary-hover hover:shadow-ambient-hover"
              >
                Create Profile
              </Link>
            </div>

            <button
              className="md:hidden p-2 -mr-1 rounded-full transition-colors text-text-muted hover:text-text-main hover:bg-surface"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  );
}
