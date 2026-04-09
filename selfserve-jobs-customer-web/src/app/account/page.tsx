'use client';
// account dashboard
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { getMyEntities, deleteJob, deleteProfile, deactivateJob, activateJob, deactivateProfile, activateProfile, logout as apiLogout } from '@/lib/api';
import type { AuthEntity } from '@/lib/types';
import { Spinner } from '@/components/ui/Spinner';
import { StatusBanner } from '@/components/shared/StatusBanner';

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    inactive: 'bg-surface text-text-muted',
    pending_verification: 'bg-yellow-100 text-yellow-700',
    expired: 'bg-surface text-text-muted',
    under_review: 'bg-orange-100 text-orange-700',
  };
  const labels: Record<string, string> = {
    active: 'Active',
    inactive: 'Inactive',
    pending_verification: 'Pending',
    expired: 'Expired',
    under_review: 'Under Review',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${styles[status] ?? 'bg-surface text-text-muted'}`}>
      {labels[status] ?? status}
    </span>
  );
}

function EntityCard({
  entity,
  onUpdate,
}: {
  entity: AuthEntity;
  onUpdate: () => void;
}) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isJob = entity.entity_type === 'job';
  const href = isJob ? `/jobs/${entity.code}` : `/profiles/${entity.code}`;
  const editHref = `/manage/${isJob ? 'job' : 'profile'}/${entity.code}?token=${entity.edit_token}`;

  const handle = async (action: string, fn: () => Promise<unknown>) => {
    setLoading(action);
    setError('');
    try {
      await fn();
      onUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed.');
    } finally {
      setLoading(null);
    }
  };

  const canToggle = entity.status === 'active' || entity.status === 'inactive';

  return (
    <div className="bg-surface-lowest rounded-2xl shadow-ambient p-6 flex flex-col gap-4">
      {error && <StatusBanner type="error" message={error} className="text-xs" />}

      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <Link href={href} className="font-heading text-lg text-primary hover:opacity-75 transition-opacity line-clamp-1">
            {entity.title}
          </Link>
          <p className="text-xs text-text-muted mt-0.5 uppercase tracking-wider">
            {isJob ? 'Job' : 'Profile'} · {new Date(entity.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </div>
        <StatusBadge status={entity.status} />
      </div>

      <div className="flex items-center gap-3 text-xs text-text-muted">
        <span>{entity.view_count} view{entity.view_count !== 1 ? 's' : ''}</span>
        <span>·</span>
        <span>Expires {new Date(entity.expires_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border/10">
        <Link
          href={editHref}
          className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-full bg-surface text-text-main hover:bg-surface-lowest transition-colors"
        >
          Edit
        </Link>

        {canToggle && (
          <button
            onClick={() => {
              if (entity.status === 'active') {
                handle('toggle', () => isJob ? deactivateJob(entity.code, entity.edit_token) : deactivateProfile(entity.code, entity.edit_token));
              } else {
                handle('toggle', () => isJob ? activateJob(entity.code, entity.edit_token) : activateProfile(entity.code, entity.edit_token));
              }
            }}
            disabled={loading === 'toggle'}
            className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-full bg-surface text-text-main hover:bg-surface-lowest transition-colors disabled:opacity-50"
          >
            {loading === 'toggle' ? '…' : entity.status === 'active' ? 'Deactivate' : 'Activate'}
          </button>
        )}

        {!confirmDelete ? (
          <button
            onClick={() => setConfirmDelete(true)}
            className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-full text-red-600 hover:bg-red-50 transition-colors ml-auto"
          >
            Delete
          </button>
        ) : (
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs text-text-muted">Sure?</span>
            <button
              onClick={() => handle('delete', () => isJob ? deleteJob(entity.code, entity.edit_token) : deleteProfile(entity.code, entity.edit_token))}
              disabled={loading === 'delete'}
              className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {loading === 'delete' ? '…' : 'Yes, delete'}
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-full bg-surface text-text-main hover:bg-surface-lowest transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AccountPage() {
  const router = useRouter();
  const { isLoggedIn, email, sessionToken, logout } = useAuth();

  const [jobs, setJobs] = useState<AuthEntity[]>([]);
  const [profiles, setProfiles] = useState<AuthEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchEntities = async () => {
    if (!sessionToken) return;
    try {
      const data = await getMyEntities(sessionToken);
      setJobs(data.jobs);
      setProfiles(data.profiles);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load your listings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoggedIn) {
      router.replace('/login');
      return;
    }
    fetchEntities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

  const handleLogout = async () => {
    if (sessionToken) apiLogout(sessionToken).catch(() => {});
    logout();
    router.push('/');
  };

  if (!isLoggedIn) return null;

  return (
    <div className="hero-gradient min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14">

        {/* Page header */}
        <div className="flex items-start justify-between mb-10 gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-1">Account</p>
            <h1 className="font-heading text-4xl text-primary">
              My <em>Listings</em>
            </h1>
            <p className="text-sm text-text-muted mt-1">{email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="shrink-0 px-4 py-2 text-xs font-semibold uppercase tracking-widest rounded-full text-text-muted hover:text-secondary hover:bg-surface transition-colors"
          >
            Sign Out
          </button>
        </div>

        {error && <StatusBanner type="error" message={error} className="mb-6" />}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : (
          <div className="flex flex-col gap-12">
            {/* Jobs section */}
            <section>
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-heading text-2xl text-primary">Jobs</h2>
                <Link
                  href="/jobs/new"
                  className="px-4 py-2 text-xs font-semibold uppercase tracking-widest rounded-full text-white bg-primary hover:bg-primary-hover transition-colors"
                >
                  + Post a Job
                </Link>
              </div>
              {jobs.length === 0 ? (
                <div className="rounded-2xl bg-surface-lowest shadow-ambient p-8 text-center">
                  <p className="text-sm text-text-muted mb-4">No job listings yet.</p>
                  <Link href="/jobs/new" className="text-sm font-medium text-primary hover:opacity-75 transition-opacity underline">
                    Post your first job →
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {jobs.map((j) => (
                    <EntityCard key={j.code} entity={j} onUpdate={fetchEntities} />
                  ))}
                </div>
              )}
            </section>

            {/* Profiles section */}
            <section>
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-heading text-2xl text-primary">Profiles</h2>
                <Link
                  href="/profiles/new"
                  className="px-4 py-2 text-xs font-semibold uppercase tracking-widest rounded-full text-white bg-primary hover:bg-primary-hover transition-colors"
                >
                  + Create Profile
                </Link>
              </div>
              {profiles.length === 0 ? (
                <div className="rounded-2xl bg-surface-lowest shadow-ambient p-8 text-center">
                  <p className="text-sm text-text-muted mb-4">No profiles yet.</p>
                  <Link href="/profiles/new" className="text-sm font-medium text-primary hover:opacity-75 transition-opacity underline">
                    Create your first profile →
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {profiles.map((p) => (
                    <EntityCard key={p.code} entity={p} onUpdate={fetchEntities} />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
