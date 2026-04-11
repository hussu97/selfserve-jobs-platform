'use client';

import { Suspense, useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { ProfileCard } from '@/components/profiles/ProfileCard';
import { ProfileFilters } from '@/components/profiles/ProfileFilters';
import { SearchBar } from '@/components/shared/SearchBar';
import { Pagination } from '@/components/shared/Pagination';
import { ProfileCardSkeleton } from '@/components/ui/Skeleton';
import { StatusBanner } from '@/components/shared/StatusBanner';
import { getProfiles } from '@/lib/api';
import type { ProfileFilters as ProfileFiltersType, ProfileListItem, RelocationPreference } from '@/lib/types';
import { ITEMS_PER_PAGE } from '@/lib/constants';

function parseFiltersFromParams(searchParams: URLSearchParams): ProfileFiltersType {
  const filters: ProfileFiltersType = {};
  const search = searchParams.get('search');
  const country = searchParams.get('country');
  const sort = searchParams.get('sort') as ProfileFiltersType['sort'];
  const page = searchParams.get('page');
  const min_experience = searchParams.get('min_experience');
  const max_experience = searchParams.get('max_experience');
  const relocation_preference = searchParams.get('relocation_preference') as RelocationPreference | null;
  const skills = searchParams.getAll('skills');

  if (search) filters.search = search;
  if (country) filters.country = country;
  if (sort) filters.sort = sort;
  if (page) filters.page = parseInt(page);
  if (min_experience) filters.min_experience = parseInt(min_experience);
  if (max_experience) filters.max_experience = parseInt(max_experience);
  if (relocation_preference) filters.relocation_preference = relocation_preference;
  if (skills.length) filters.skills = skills;

  return filters;
}

function filtersToParams(filters: ProfileFiltersType): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.search) params.set('search', filters.search);
  if (filters.country) params.set('country', filters.country);
  if (filters.sort && filters.sort !== 'newest') params.set('sort', filters.sort);
  if (filters.page && filters.page > 1) params.set('page', String(filters.page));
  if (filters.min_experience !== undefined) params.set('min_experience', String(filters.min_experience));
  if (filters.max_experience !== undefined) params.set('max_experience', String(filters.max_experience));
  if (filters.relocation_preference) params.set('relocation_preference', filters.relocation_preference);
  filters.skills?.forEach((s) => params.append('skills', s));
  return params;
}

export default function ProfilesPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><span className="text-text-muted">Loading…</span></div>}>
      <ProfilesContent />
    </Suspense>
  );
}

function ProfilesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [filters, setFilters] = useState<ProfileFiltersType>(() =>
    parseFiltersFromParams(searchParams)
  );
  const [profiles, setProfiles] = useState<ProfileListItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfiles = useCallback(async (f: ProfileFiltersType) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getProfiles({ ...f, per_page: ITEMS_PER_PAGE });
      setProfiles(result.items);
      setTotalPages(result.total_pages);
      setTotal(result.total);
    } catch {
      setError('Failed to load profiles. Please try again.');
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const applyFilters = useCallback(
    (newFilters: ProfileFiltersType) => {
      setFilters(newFilters);
      const params = filtersToParams(newFilters);
      const qs = params.toString();
      router.replace(`${pathname}${qs ? `?${qs}` : ''}`, { scroll: false });
      fetchProfiles(newFilters);
    },
    [router, pathname, fetchProfiles]
  );

  useEffect(() => {
    fetchProfiles(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearchChange = (value: string) => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    setSearching(true);
    setFilters((prev) => ({ ...prev, search: value || undefined }));
    searchTimerRef.current = setTimeout(() => {
      setSearching(false);
      applyFilters({ ...filters, search: value || undefined, page: 1 });
    }, 350);
  };

  const handleFiltersChange = (newFilters: ProfileFiltersType) => {
    applyFilters(newFilters);
  };

  const handlePageChange = (page: number) => {
    applyFilters({ ...filters, page });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div>
      {/* Page header */}
      <div className="hero-gradient">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-3">
            Talent
          </p>
          <div className="flex items-end justify-between gap-4">
            <h1 className="font-heading text-4xl sm:text-5xl text-primary">
              Discover <span className="italic">Extraordinary</span> Talent
            </h1>
            <span className="text-xs font-semibold uppercase tracking-widest text-text-muted pb-1">
              {loading ? 'Loading…' : `${total.toLocaleString()} profile${total !== 1 ? 's' : ''} found`}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search */}
        <div className="mb-8">
          <SearchBar
            value={filters.search ?? ''}
            onChange={handleSearchChange}
            placeholder="Search by name, title, or skill…"
            searching={searching}
          />
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="w-full lg:w-64 lg:flex-shrink-0">
            <ProfileFilters filters={filters} onChange={handleFiltersChange} />
          </aside>

          {/* Main content */}
          <div className="flex-1 min-w-0" aria-busy={loading} aria-live="polite">
            {error && (
              <StatusBanner type="error" message={error} className="mb-6" />
            )}

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <ProfileCardSkeleton key={i} />
                ))}
              </div>
            ) : profiles.length === 0 ? (
              <div className="text-center py-20 rounded-2xl bg-surface-lowest shadow-ambient">
                <svg
                  className="h-12 w-12 mx-auto mb-4 text-border"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <h3 className="text-lg font-semibold mb-2 font-heading text-text-main">
                  No profiles found
                </h3>
                <p className="text-sm mb-2 text-text-muted">
                  {filters.search || filters.country || filters.relocation_preference || filters.skills?.length
                    ? 'Try broadening your search — remove a filter or use fewer keywords.'
                    : 'No profiles have been posted yet. Check back soon.'}
                </p>
                {(filters.search || filters.country || filters.relocation_preference || filters.skills?.length) && (
                  <button
                    onClick={() => applyFilters({ page: 1 })}
                    className="mt-2 text-sm font-semibold text-primary hover:opacity-70 transition-opacity"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 gap-6">
                  {profiles.map((profile) => (
                    <ProfileCard key={profile.code} profile={profile} />
                  ))}
                </div>

                <div className="mt-10">
                  <Pagination
                    page={filters.page ?? 1}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
