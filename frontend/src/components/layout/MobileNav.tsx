'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface MobileNavProps {
  open: boolean;
  onClose: () => void;
}

const NAV_LINKS = [
  { href: '/jobs', label: 'Browse Jobs' },
  { href: '/profiles', label: 'Browse Profiles' },
  { href: '/jobs/new', label: 'Post a Job' },
  { href: '/profiles/new', label: 'Create Profile' },
  { href: '/about', label: 'About' },
];

export function MobileNav({ open, onClose }: MobileNavProps) {
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
          'fixed top-0 right-0 z-50 h-full w-72 shadow-xl transition-transform duration-300 ease-in-out',
          'flex flex-col',
          open ? 'translate-x-0' : 'translate-x-full'
        )}
        style={{ backgroundColor: 'var(--color-bg)' }}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <Link
            href="/"
            onClick={onClose}
            className="font-bold text-xl"
            style={{ fontFamily: 'Lora, serif', color: 'var(--color-secondary)' }}
          >
            jobs4u
          </Link>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors"
            style={{ color: 'var(--color-text-muted)' }}
            aria-label="Close menu"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>

        {/* Links */}
        <nav className="flex flex-col p-4 gap-1 flex-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={onClose}
              className="px-4 py-3 rounded-xl text-sm font-medium transition-colors hover:bg-[#F0EBE1]"
              style={{ color: 'var(--color-text)' }}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div
          className="px-5 py-4 border-t text-xs"
          style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
        >
          Free to use · No signup required
        </div>
      </div>
    </>
  );
}
