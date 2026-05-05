'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { useAuth } from '@/context/AuthContext';
import { logout } from '@/lib/api';
import { UsersTable } from '@/components/admin/UsersTable';
import { RecruitersTable } from '@/components/admin/RecruitersTable';
import { ReportsTable } from '@/components/admin/ReportsTable';
import { BlogsTable } from '@/components/admin/BlogsTable';

type Tab = 'users' | 'recruiters' | 'reports' | 'blog';

const TABS: { id: Tab; label: string }[] = [
  { id: 'users', label: 'Users' },
  { id: 'recruiters', label: 'Recruiters' },
  { id: 'reports', label: 'Reported Posts' },
  { id: 'blog', label: 'Blog' },
];

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isHydrated, isAdmin, email, sessionToken, logout: authLogout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  const tab = (searchParams.get('tab') as Tab) ?? 'users';

  useEffect(() => {
    if (!isHydrated) return;
    if (!isAdmin) router.replace('/admin/login');
  }, [isHydrated, isAdmin, router]);

  const handleTabChange = (t: Tab) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', t);
    router.push(`/admin/dashboard?${params.toString()}`);
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      if (sessionToken) await logout(sessionToken);
    } catch {
      // ignore
    }
    authLogout();
    router.replace('/admin/login');
  };

  if (!isHydrated || !isAdmin || !sessionToken) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-bg)' }}>
        <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg)' }}>
      {/* Admin topbar */}
      <header className="sticky top-0 z-30 backdrop-blur-xl" style={{ backgroundColor: 'rgba(252,249,245,0.85)', boxShadow: '0 1px 3px rgba(28,28,26,0.04)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-[60px]">
          <div className="flex items-center gap-3">
            <span className="font-heading italic text-2xl" style={{ color: 'var(--color-primary)' }}>
              hirebridge
            </span>
            <span className="text-xs uppercase tracking-widest px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text-muted)' }}>
              admin
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs hidden sm:inline" style={{ color: 'var(--color-text-muted)' }}>{email}</span>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="text-xs font-semibold uppercase tracking-wide px-4 py-2 rounded-full transition-colors hover:bg-surface disabled:opacity-50"
              style={{ color: 'var(--color-text-muted)' }}
            >
              {loggingOut ? 'Signing out…' : 'Sign out'}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page title */}
        <div className="mb-8">
          <h1 className="font-heading text-3xl" style={{ color: 'var(--color-primary)' }}>
            Admin <em>Portal</em>
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
            Manage users, recruiters, reported content, and blog posts.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 p-1 rounded-xl w-fit" style={{ backgroundColor: 'var(--color-surface)' }}>
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => handleTabChange(t.id)}
              className="px-5 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                backgroundColor: tab === t.id ? 'var(--color-surface-lowest)' : 'transparent',
                color: tab === t.id ? 'var(--color-primary)' : 'var(--color-text-muted)',
                boxShadow: tab === t.id ? '0 1px 3px rgba(28,28,26,0.05)' : 'none',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === 'users' && <UsersTable sessionToken={sessionToken} />}
        {tab === 'recruiters' && <RecruitersTable sessionToken={sessionToken} />}
        {tab === 'reports' && <ReportsTable sessionToken={sessionToken} />}
        {tab === 'blog' && <BlogsTable sessionToken={sessionToken} />}
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-bg)' }}>
          <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }} />
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
