import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { JobDetail } from '@/components/jobs/JobDetail';
import { JobCard } from '@/components/jobs/JobCard';
import { getJob, getJobs } from '@/lib/api';
import { truncate } from '@/lib/utils';

interface PageProps {
  params: Promise<{ jobCode: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { jobCode } = await params;
  try {
    const job = await getJob(jobCode);
    return {
      title: `${job.job_title} at ${job.company_name}`,
      description: truncate(job.description, 160),
      openGraph: {
        title: `${job.job_title} at ${job.company_name}`,
        description: truncate(job.description, 160),
      },
    };
  } catch {
    return {
      title: 'Job Not Found',
    };
  }
}

export default async function JobDetailPage({ params }: PageProps) {
  const { jobCode } = await params;

  let job;
  try {
    job = await getJob(jobCode);
  } catch {
    notFound();
  }

  // Fetch similar/recent jobs for sidebar
  const recentJobsResult = await getJobs({ per_page: 4 }).catch(() => null);
  const recentJobs = recentJobsResult?.items.filter((j) => j.code !== jobCode).slice(0, 3) ?? [];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.job_title,
    description: job.description,
    hiringOrganization: {
      '@type': 'Organization',
      name: job.company_name,
    },
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: job.company_city,
        addressCountry: job.company_country,
      },
    },
    employmentType: job.employment_type.toUpperCase(),
    datePosted: job.created_at,
    ...(job.deadline_date && { validThrough: job.deadline_date }),
    ...(job.contact_email && { applicationContact: { '@type': 'ContactPoint', email: job.contact_email } }),
    ...(job.contact_url && { url: job.contact_url }),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="hero-gradient">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <JobDetail job={job} />

        {/* Recent jobs */}
        {recentJobs.length > 0 && (
          <section className="mt-16">
            <div className="flex items-center justify-between mb-6">
              <h2
                className="font-heading text-xl text-primary"
              >
                More Jobs
              </h2>
              <Link
                href="/jobs"
                className="text-sm font-medium hover:opacity-70 text-primary"
              >
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
      </div>
      </div>
    </>
  );
}
