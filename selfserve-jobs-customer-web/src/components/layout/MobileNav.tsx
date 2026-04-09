'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { logout as apiLogout } from '@/lib/api';

interface MobileNavProps {
  open: boolean;
  onClose: () => void;
}

const BASE_NAV_LINKS = [
  { href: '/jobs', label: 'Browse Jobs' },
  { href: '/profiles', label: 'Browse Profiles' },
  { href: '/about', label: 'About' },
];

export function MobileNav({ open, onClose }: MobileNavProps) {
  const { isLoggedIn, initial, sessionToken, logout } = useAuth();

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const handleLogout = async () => {
    if (sessionToken) {
      apiLogout(sessionToken).catch(() => {});
    }
    logout();
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300',
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        className={cn(
          'fixed top-0 right-0 z-50 h-full w-72 shadow-ambient-hover transition-transform duration-300 ease-in-out',
          'flex flex-col bg-bg',
          open ? 'translate-x-0' : 'translate-x-full'
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-surface">
          <Link
            href="/"
            onClick={onClose}
            className="text-xl font-heading italic text-primary"
          >
            jobs4u
          </Link>
          <button
            onClick={onClose}
            className="p-2 rounded-full transition-colors text-text-muted hover:bg-surface-lowest"
            aria-label="Close menu"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>

        {/* Links */}
        <nav className="flex flex-col p-4 gap-1 flex-1">
          {isLoggedIn && (
            <Link
              href="/account"
              onClick={onClose}
              className="flex items-center gap-3 px-4 py-3 rounded-full text-xs font-semibold uppercase tracking-widest transition-colors hover:bg-surface text-primary mb-1"
            >
              <span className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold shrink-0">
                {initial}
              </span>
              My Account
            </Link>
          )}

          {BASE_NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={onClose}
              className="px-4 py-3 rounded-full text-xs font-semibold uppercase tracking-widest transition-colors hover:bg-surface text-text-main"
            >
              {link.label}
            </Link>
          ))}

          <div className="border-t border-border/20 my-2" />

          <Link
            href="/jobs/new"
            onClick={onClose}
            className="px-4 py-3 rounded-full text-xs font-semibold uppercase tracking-widest transition-colors hover:bg-surface text-text-main"
          >
            Post a Job
          </Link>
          <Link
            href="/profiles/new"
            onClick={onClose}
            className="px-4 py-3 rounded-full text-xs font-semibold uppercase tracking-widest transition-colors hover:bg-surface text-text-main"
          >
            Create Profile
          </Link>

          {!isLoggedIn && (
            <>
              <div className="border-t border-border/20 my-2" />
              <Link
                href="/login"
                onClick={onClose}
                className="px-4 py-3 rounded-full text-xs font-semibold uppercase tracking-widest transition-colors hover:bg-surface text-text-muted"
              >
                Sign In
              </Link>
            </>
          )}
        </nav>

        {/* Footer */}
        {isLoggedIn ? (
          <div className="px-5 py-4 bg-surface">
            <button
              onClick={handleLogout}
              className="text-[10px] uppercase tracking-widest text-text-muted hover:text-secondary transition-colors"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <div className="px-5 py-4 bg-surface text-[10px] uppercase tracking-widest text-text-muted">
            Free to use · No signup required
          </div>
        )}
      </div>
    </>
  );
}
