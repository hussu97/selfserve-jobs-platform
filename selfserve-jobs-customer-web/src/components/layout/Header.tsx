'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MobileNav } from './MobileNav';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

const NAV_LINKS = [
  { href: '/jobs', label: 'Jobs' },
  { href: '/profiles', label: 'Profiles' },
];

function CreateListingDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{ outline: 'none' }}
        className="flex items-center gap-1 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-text-muted transition-all hover:text-text-main hover:bg-surface/60 rounded-xl"
      >
        Create Listing
        <svg className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M2 4l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-44 bg-surface-lowest rounded-xl shadow-[0_4px_24px_rgba(28,28,26,0.12)] border border-border/20 overflow-hidden z-50">
          <Link
            href="/jobs/new"
            onClick={() => setOpen(false)}
            className="block px-4 py-3 text-sm text-text-main hover:bg-surface transition-colors"
          >
            Post a Job
          </Link>
          <Link
            href="/profiles/new"
            onClick={() => setOpen(false)}
            className="block px-4 py-3 text-sm text-text-main hover:bg-surface transition-colors"
          >
            Create Profile
          </Link>
        </div>
      )}
    </div>
  );
}

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { isLoggedIn, initial } = useAuth();

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
              {isLoggedIn ? (
                <>
                  <CreateListingDropdown />
                  <Link
                    href="/account"
                    className={cn(
                      'w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all',
                      pathname.startsWith('/account')
                        ? 'bg-primary text-white'
                        : 'bg-primary/10 text-primary hover:bg-primary hover:text-white'
                    )}
                    aria-label="My account"
                  >
                    {initial}
                  </Link>
                </>
              ) : (
                <>
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
                </>
              )}
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
