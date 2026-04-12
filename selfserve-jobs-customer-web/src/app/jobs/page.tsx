'use client';

import { Suspense, useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { JobCard } from '@/components/jobs/JobCard';
import { JobFilters } from '@/components/jobs/JobFilters';
import { SearchBar } from '@/components/shared/SearchBar';
import { Pagination } from '@/components/shared/Pagination';
import { JobCardSkeleton } from '@/components/ui/Skeleton';
import { StatusBanner } from '@/components/shared/StatusBanner';
import { getJobs } from '@/lib/api';
import type { JobFilters as JobFiltersType, JobListItem } from '@/lib/types';
import { ITEMS_PER_PAGE } from '@/lib/constants';
import { CanonicalTag } from '@/components/seo/CanonicalTag';

function parseFiltersFromParams(searchParams: URLSearchParams): JobFiltersType {
  const filters: JobFiltersType = {};
  const search = searchParams.get('search');
  const country = searchParams.get('country');
  const sort = searchParams.get('sort') as JobFiltersType['sort'];
  const page = searchParams.get('page');
  const employment_type = searchParams.getAll('employment_type') as NonNullable<JobFiltersType['employment_type']>;
  const skills = searchParams.getAll('skills');

  if (search) filters.search = search;
  if (country) filters.country = country;
  if (sort) filters.sort = sort;
  if (page) filters.page = parseInt(page);
  if (employment_type.length) filters.employment_type = employment_type;
  if (skills.length) filters.skills = skills;

  return filters;
}

function filtersToParams(filters: JobFiltersType): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.search) params.set('search', filters.search);
  if (filters.country) params.set('country', filters.country);
  if (filters.sort && filters.sort !== 'newest') params.set('sort', filters.sort);
  if (filters.page && filters.page > 1) params.set('page', String(filters.page));
  filters.employment_type?.forEach((t) => params.append('employment_type', t));
  filters.skills?.forEach((s) => params.append('skills', s));
  return params;
}

function JobsPageSkeleton() {
  return (
    <div>
      <div className="hero-gradient">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
          <div className="h-12 w-48 animate-pulse rounded-lg bg-surface mb-2" aria-hidden="true" />
          <div className="h-6 w-24 animate-pulse rounded-lg bg-surface" aria-hidden="true" />
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <JobCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function JobsPage() {
  return (
    <Suspense fallback={<JobsPageSkeleton />}>
      <JobsContent />
    </Suspense>
  );
}

function JobsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [filters, setFilters] = useState<JobFiltersType>(() =>
    parseFiltersFromParams(searchParams)
  );
  const [jobs, setJobs] = useState<JobListItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = useCallback(async (f: JobFiltersType) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getJobs({ ...f, per_page: ITEMS_PER_PAGE });
      setJobs(result.items);
      setTotalPages(result.total_pages);
      setTotal(result.total);
    } catch {
      setError('Failed to load jobs. Please try again.');
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Sync filters to URL and fetch
  const applyFilters = useCallback(
    (newFilters: JobFiltersType) => {
      setFilters(newFilters);
      const params = filtersToParams(newFilters);
      const qs = params.toString();
      router.replace(`${pathname}${qs ? `?${qs}` : ''}`, { scroll: false });
      fetchJobs(newFilters);
    },
    [router, pathname, fetchJobs]
  );

  // Initial load
  useEffect(() => {
    fetchJobs(filters);
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

  const handleFiltersChange = (newFilters: JobFiltersType) => {
    applyFilters(newFilters);
  };

  const handlePageChange = (page: number) => {
    applyFilters({ ...filters, page });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div>
      <CanonicalTag />
      {/* Page header */}
      <div className="hero-gradient">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-3">
            Opportunities
          </p>
          <div className="flex items-end justify-between gap-4">
            <h1 className="font-heading text-4xl sm:text-5xl text-primary">
              Browse <span className="italic">Jobs</span>
            </h1>
            <span className="text-xs font-semibold uppercase tracking-widest text-text-muted pb-1">
              {loading ? 'Loading…' : `${total.toLocaleString()} job${total !== 1 ? 's' : ''} found`}
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
            placeholder="Search by title, company, or skill…"
            searching={searching}
          />
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar filters */}
          <aside className="w-full lg:w-64 lg:flex-shrink-0">
            <JobFilters filters={filters} onChange={handleFiltersChange} />
          </aside>

          {/* Main content */}
          <div className="flex-1 min-w-0" aria-busy={loading} aria-live="polite">
            {error && (
              <StatusBanner type="error" message={error} className="mb-6" />
            )}

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <JobCardSkeleton key={i} />
                ))}
              </div>
            ) : jobs.length === 0 ? (
              <div className="text-center py-20 rounded-2xl bg-surface-lowest shadow-ambient">
                <svg
                  className="h-12 w-12 mx-auto mb-4 text-border"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <h3 className="text-lg font-semibold mb-2 font-heading text-text-main">
                  No jobs found
                </h3>
                <p className="text-sm mb-2 text-text-muted">
                  {filters.search || filters.country || filters.employment_type?.length || filters.skills?.length
                    ? 'Try broadening your search — remove a filter or use fewer keywords.'
                    : 'No jobs have been posted yet. Check back soon.'}
                </p>
                {(filters.search || filters.country || filters.employment_type?.length || filters.skills?.length) && (
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
                  {jobs.map((job) => (
                    <JobCard key={job.code} job={job} />
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
