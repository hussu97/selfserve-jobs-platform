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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-[60px]">

            {/* Logo */}
            <Link
              href="/"
              className="text-xl tracking-tight font-heading italic text-primary hover:opacity-75 transition-opacity"
            >
              jobs4u
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {NAV_LINKS.map((link) => {
                const isActive = pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      'relative px-4 py-2 text-xs font-semibold uppercase tracking-widest rounded-full transition-all',
                      isActive
                        ? 'text-primary'
                        : 'text-text-muted hover:text-text-main hover:bg-surface/70'
                    )}
                  >
                    {link.label}
                    {isActive && (
                      <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-primary" />
                    )}
                  </Link>
                );
              })}
              <Link
                href="/about"
                className={cn(
                  'relative px-4 py-2 text-xs font-semibold uppercase tracking-widest rounded-full transition-all',
                  pathname === '/about'
                    ? 'text-primary'
                    : 'text-text-muted hover:text-text-main hover:bg-surface/70'
                )}
              >
                About
              </Link>
            </nav>

            {/* Desktop CTAs */}
            <div className="hidden md:flex items-center gap-2">
              <Link
                href="/jobs/new"
                className="px-4 py-2 text-xs font-semibold uppercase tracking-widest rounded-full text-text-muted transition-all hover:text-text-main hover:bg-surface/60"
              >
                Post a Job
              </Link>
              <Link
                href="/profiles/new"
                className="px-5 py-2 text-xs font-semibold uppercase tracking-widest rounded-full text-white bg-primary shadow-ambient transition-all hover:bg-primary-hover hover:shadow-ambient-hover"
              >
                Create Profile
              </Link>
            </div>

            {/* Mobile Hamburger */}
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
