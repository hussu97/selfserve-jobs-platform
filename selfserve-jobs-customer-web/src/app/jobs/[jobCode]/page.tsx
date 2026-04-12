import { cache } from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { JobDetail } from '@/components/jobs/JobDetail';
import { JobCard } from '@/components/jobs/JobCard';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { JsonLd } from '@/components/seo/JsonLd';
import { jobPostingSchema } from '@/lib/schema';
import { getJob, getJobs, ApiError } from '@/lib/api';
import { truncate } from '@/lib/utils';

// Deduplicate the getJob fetch between generateMetadata and the page component
const getJobCached = cache(getJob);

interface PageProps {
  params: Promise<{ jobCode: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { jobCode } = await params;
  try {
    const job = await getJobCached(jobCode);
    const title = `${job.job_title} at ${job.company_name}`;
    const description = `${job.job_title} position at ${job.company_name} in ${job.company_city}, ${job.company_country}. ${truncate(job.description, 120)}`;
    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: 'article',
      },
      alternates: {
        canonical: `/jobs/${jobCode}`,
      },
    };
  } catch (err) {
    if (err instanceof ApiError && err.status === 410) {
      return { title: 'Job No Longer Available', robots: { index: false } };
    }
    return { title: 'Job Not Found' };
  }
}

export default async function JobDetailPage({ params }: PageProps) {
  const { jobCode } = await params;

  let job;
  try {
    job = await getJobCached(jobCode);
  } catch (err) {
    if (err instanceof ApiError && err.status === 410) {
      return (
        <div className="hero-gradient min-h-[60vh] flex items-center justify-center">
          <div className="max-w-md mx-auto px-4 text-center py-20">
            <p className="text-xs uppercase tracking-widest text-text-muted mb-4">Listing Expired</p>
            <h1 className="font-heading text-3xl text-primary mb-4">This job is no longer available</h1>
            <p className="text-text-muted mb-8">The listing has expired or been removed by the poster.</p>
            <Link
              href="/jobs"
              className="inline-block px-6 py-3 rounded-full bg-primary text-white font-medium text-sm hover:bg-primary-hover transition-colors"
            >
              Browse open roles
            </Link>
          </div>
        </div>
      );
    }
    notFound();
  }

  const recentJobsResult = await getJobs({ per_page: 4 }).catch(() => null);
  const recentJobs = recentJobsResult?.items.filter((j) => j.code !== jobCode).slice(0, 3) ?? [];

  const citySlug = job.company_city?.toLowerCase().replace(/\s+/g, '-');

  return (
    <>
      <JsonLd data={jobPostingSchema(job)} />
      <div className="hero-gradient">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <Breadcrumbs
            items={[
              { label: 'Jobs', href: '/jobs' },
              ...(job.company_city ? [{ label: `${job.company_city} Jobs`, href: `/jobs/in/${citySlug}` }] : []),
              { label: job.job_title },
            ]}
          />
          <JobDetail job={job} />

          {recentJobs.length > 0 && (
            <section className="mt-16">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-heading text-xl text-primary">More Jobs</h2>
                <Link href="/jobs" className="text-sm font-medium hover:opacity-70 text-primary">
                  Browse all →
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {recentJobs.map((j) => (
                  <JobCard key={j.code} job={j} />
                ))}
              </div>
            </section>
          )}

          {/* Contextual landing page links */}
          <div className="mt-12 flex flex-wrap gap-2">
            {job.company_city && citySlug && (
              <Link
                href={`/jobs/in/${citySlug}`}
                className="text-xs uppercase tracking-wider px-3 py-1.5 rounded-full bg-surface text-text-muted hover:text-text-main hover:bg-surface-container-high transition-colors"
              >
                More jobs in {job.company_city}
              </Link>
            )}
            {job.key_skills?.slice(0, 3).map((skill) => (
              <Link
                key={skill}
                href={`/jobs/in/${citySlug ?? 'dubai'}/${skill.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                className="text-xs uppercase tracking-wider px-3 py-1.5 rounded-full bg-surface text-text-muted hover:text-text-main hover:bg-surface-container-high transition-colors"
              >
                {skill} jobs
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
