'use client';

import { Suspense, useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { ProfileCard } from '@/components/profiles/ProfileCard';
import { ProfileFilters } from '@/components/profiles/ProfileFilters';
import { SearchBar } from '@/components/shared/SearchBar';
import { Pagination } from '@/components/shared/Pagination';
import { ProfileCardSkeleton } from '@/components/ui/Skeleton';
import { StatusBanner } from '@/components/shared/StatusBanner';
import { JobMarketNotes } from '@/components/blog/JobMarketNotes';
import { getProfiles } from '@/lib/api';
import type { ProfileFilters as ProfileFiltersType, ProfileListItem, RelocationPreference, NoticePeriod } from '@/lib/types';
import { ITEMS_PER_PAGE } from '@/lib/constants';
import { CanonicalTag } from '@/components/seo/CanonicalTag';

function parseFiltersFromParams(searchParams: URLSearchParams): ProfileFiltersType {
  const filters: ProfileFiltersType = {};
  const search = searchParams.get('search');
  const country = searchParams.get('country');
  const city = searchParams.get('city');
  const sort = searchParams.get('sort') as ProfileFiltersType['sort'];
  const page = searchParams.get('page');
  const min_experience = searchParams.get('min_experience');
  const max_experience = searchParams.get('max_experience');
  const relocation_preference = searchParams.get('relocation_preference') as RelocationPreference | null;
  const skills = searchParams.getAll('skills');
  const employment_status = searchParams.getAll('employment_status');
  const notice_period = searchParams.getAll('notice_period');

  if (search) filters.search = search;
  if (country) filters.country = country;
  if (city) filters.city = city;
  if (sort) filters.sort = sort;
  if (page) filters.page = parseInt(page);
  if (min_experience) filters.min_experience = parseInt(min_experience);
  if (max_experience) filters.max_experience = parseInt(max_experience);
  if (relocation_preference) filters.relocation_preference = relocation_preference;
  if (skills.length) filters.skills = skills;
  if (employment_status.length) filters.employment_status = employment_status as ProfileFiltersType['employment_status'];
  if (notice_period.length) filters.notice_period = notice_period as NoticePeriod[];

  return filters;
}

function filtersToParams(filters: ProfileFiltersType): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.search) params.set('search', filters.search);
  if (filters.country) params.set('country', filters.country);
  if (filters.city) params.set('city', filters.city);
  if (filters.sort && filters.sort !== 'newest') params.set('sort', filters.sort);
  if (filters.page && filters.page > 1) params.set('page', String(filters.page));
  if (filters.min_experience !== undefined) params.set('min_experience', String(filters.min_experience));
  if (filters.max_experience !== undefined) params.set('max_experience', String(filters.max_experience));
  if (filters.relocation_preference) params.set('relocation_preference', filters.relocation_preference);
  filters.skills?.forEach((s) => params.append('skills', s));
  filters.employment_status?.forEach((s) => params.append('employment_status', s));
  filters.notice_period?.forEach((n) => params.append('notice_period', n));
  return params;
}

function ProfilesPageSkeleton() {
  return (
    <div>
      <div className="hero-gradient">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
          <div className="h-12 w-64 animate-pulse rounded-lg bg-surface mb-2" aria-hidden="true" />
          <div className="h-6 w-24 animate-pulse rounded-lg bg-surface" aria-hidden="true" />
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <ProfileCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ProfilesPage() {
  return (
    <Suspense fallback={<ProfilesPageSkeleton />}>
      <ProfilesContent />
    </Suspense>
  );
}

function ProfilesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialise synchronously so the first render and initial fetch agree
  const isMobileRef = useRef(
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 1023px)').matches : false
  );
  const [isMobile, setIsMobile] = useState(isMobileRef.current);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const nextPageRef = useRef(2);
  const filtersRef = useRef<ProfileFiltersType>({});
  const loadMoreFnRef = useRef<() => void>(() => {});

  const [filters, setFilters] = useState<ProfileFiltersType>(() =>
    parseFiltersFromParams(searchParams)
  );
  const [profiles, setProfiles] = useState<ProfileListItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfiles = useCallback(async (f: ProfileFiltersType, append = false) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      setError(null);
    }
    filtersRef.current = f;
    try {
      const result = await getProfiles({ ...f, per_page: ITEMS_PER_PAGE });
      if (append) {
        setProfiles((prev) => [...prev, ...result.items]);
      } else {
        setProfiles(result.items);
      }
      setTotalPages(result.total_pages);
      setTotal(result.total);
      nextPageRef.current = (f.page ?? 1) + 1;
    } catch {
      if (!append) {
        setError('Failed to load profiles. Please try again.');
        setProfiles([]);
      }
    } finally {
      if (append) {
        setLoadingMore(false);
      } else {
        setLoading(false);
      }
    }
  }, []);

  const applyFilters = useCallback(
    (newFilters: ProfileFiltersType) => {
      const f = isMobileRef.current ? { ...newFilters, page: 1 } : newFilters;
      nextPageRef.current = 2;
      setFilters(f);
      const params = filtersToParams(f);
      const qs = params.toString();
      router.replace(`${pathname}${qs ? `?${qs}` : ''}`, { scroll: false });
      fetchProfiles(f);
    },
    [router, pathname, fetchProfiles]
  );

  // Initial load
  useEffect(() => {
    fetchProfiles(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Track mobile/desktop via matchMedia
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)');
    isMobileRef.current = mq.matches;
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => {
      isMobileRef.current = e.matches;
      setIsMobile(e.matches);
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Keep load-more logic current without recreating the observer
  useEffect(() => {
    loadMoreFnRef.current = () => {
      if (loadingMore || loading || nextPageRef.current > totalPages) return;
      fetchProfiles({ ...filtersRef.current, page: nextPageRef.current }, true);
    };
  }, [loadingMore, loading, totalPages, fetchProfiles]);

  // Infinite scroll — mobile only.
  // Depends on `loading` so the observer re-attaches once the initial fetch
  // completes and the sentinel div enters the DOM (it only renders after load).
  useEffect(() => {
    if (!isMobile || loading) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) loadMoreFnRef.current(); },
      { rootMargin: '300px 0px' }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [isMobile, loading]);

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

  const allLoaded = !loading && !loadingMore && nextPageRef.current > totalPages && profiles.length > 0;

  return (
    <div>
      <CanonicalTag />
      <div className="hero-gradient">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-3">
            Talent
          </p>
          <h1 className="font-heading text-4xl sm:text-5xl text-primary">
            Discover <span className="italic">Extraordinary</span> Talent
          </h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <SearchBar
            value={filters.search ?? ''}
            onChange={handleSearchChange}
            placeholder="Search by name, title, or skill…"
            searching={searching}
          />
        </div>

        <div className="mb-8">
          <JobMarketNotes />
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="w-full lg:w-64 lg:flex-shrink-0">
            <ProfileFilters filters={filters} onChange={handleFiltersChange} resultCount={loading ? null : total} />
          </aside>

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

                {isMobile ? (
                  <>
                    <div ref={sentinelRef} className="h-4 mt-6" />
                    {loadingMore && (
                      <div className="flex justify-center py-6">
                        <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                      </div>
                    )}
                    {allLoaded && (
                      <p className="text-center text-xs text-text-muted uppercase tracking-widest py-6">
                        All {total.toLocaleString()} profiles loaded
                      </p>
                    )}
                  </>
                ) : (
                  <div className="mt-10">
                    <Pagination
                      page={filters.page ?? 1}
                      totalPages={totalPages}
                      onPageChange={handlePageChange}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
