import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { JobCard } from '@/components/jobs/JobCard';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { JsonLd } from '@/components/seo/JsonLd';
import { collectionPageSchema, faqSchema } from '@/lib/schema';
import { getJobs } from '@/lib/api';
import { EMPLOYMENT_TYPES, UAE_EMIRATES, getEmploymentTypeBySlug } from '@/lib/seo-constants';
import { EMPLOYMENT_TYPE_CONTENT } from '@/lib/seo-content';

interface PageProps {
  params: Promise<{ type: string }>;
}

export async function generateStaticParams() {
  return EMPLOYMENT_TYPES.map((t) => ({ type: t.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { type: typeSlug } = await params;
  const employmentType = getEmploymentTypeBySlug(typeSlug);
  if (!employmentType) return { title: 'Not Found' };

  const title = `${employmentType.labelPlural} in UAE`;
  const description = `Browse active ${employmentType.label.toLowerCase()} jobs in the UAE. Find ${employmentType.label.toLowerCase()} opportunities in Dubai, Abu Dhabi, Sharjah, and across the Emirates. No signup required.`;

  return {
    title,
    description,
    openGraph: { title, description, type: 'website' },
    alternates: { canonical: `/jobs/type/${typeSlug}` },
  };
}

export default async function EmploymentTypePage({ params }: PageProps) {
  const { type: typeSlug } = await params;
  const employmentType = getEmploymentTypeBySlug(typeSlug);
  if (!employmentType) notFound();

  const content = EMPLOYMENT_TYPE_CONTENT[typeSlug];

  const jobsResult = await getJobs({
    employment_type: [employmentType.value as 'full_time' | 'part_time' | 'contract' | 'consulting' | 'internship' | 'freelance' | 'remote'],
    per_page: 20,
  }).catch(() => null);

  const jobs = jobsResult?.items ?? [];
  const total = jobsResult?.total ?? 0;

  const schemas = [
    collectionPageSchema({
      name: `${employmentType.labelPlural} in UAE`,
      description: `Active ${employmentType.label.toLowerCase()} jobs across the United Arab Emirates`,
      url: `/jobs/type/${typeSlug}`,
      numberOfItems: total,
    }),
    ...(content?.faqs?.length ? [faqSchema(content.faqs)] : []),
  ];

  return (
    <>
      <JsonLd data={schemas} />
      <div className="hero-gradient">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-4">
          <Breadcrumbs
            items={[
              { label: 'Jobs', href: '/jobs' },
              { label: employmentType.labelPlural },
            ]}
          />
          <div className="mb-8">
            <span className="text-xs font-semibold uppercase tracking-widest text-secondary mb-3 block">
              {employmentType.label} · UAE
            </span>
            <h1 className="font-heading text-3xl sm:text-4xl text-primary mb-3">
              <em>{employmentType.label}</em> Jobs in the UAE
            </h1>
            <p className="text-text-muted text-base">
              {total > 0
                ? `${total} active ${employmentType.label.toLowerCase()} ${total === 1 ? 'listing' : 'listings'}`
                : `No active ${employmentType.label.toLowerCase()} listings right now`}
              {' '}· No signup required
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-7 gap-10">

          {/* Main content */}
          <div className="lg:col-span-5">
            {/* Editorial intro */}
            {content && (
              <div className="mb-8 p-6 rounded-2xl bg-surface-lowest shadow-ambient">
                <h2 className="font-heading text-lg text-primary mb-3">
                  {employmentType.label} Work in the UAE
                </h2>
                <p className="text-sm text-text-muted leading-relaxed mb-4">{content.intro}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {content.benefits.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-2">Benefits</p>
                      <ul className="space-y-1">
                        {content.benefits.map((b) => (
                          <li key={b} className="text-sm text-text-muted flex gap-2">
                            <span className="text-accent-dark shrink-0">✓</span>
                            {b}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {content.considerations.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-2">Considerations</p>
                      <ul className="space-y-1">
                        {content.considerations.map((c) => (
                          <li key={c} className="text-sm text-text-muted flex gap-2">
                            <span className="text-secondary shrink-0">·</span>
                            {c}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Job listings */}
            {jobs.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {jobs.map((job) => (
                  <JobCard key={job.code} job={job} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 rounded-2xl bg-surface-lowest shadow-ambient">
                <p className="font-heading text-xl text-primary mb-2">
                  No {employmentType.label.toLowerCase()} listings yet
                </p>
                <p className="text-sm text-text-muted mb-6">
                  Be the first to post a {employmentType.label.toLowerCase()} role.
                </p>
                <Link
                  href="/jobs/new"
                  className="inline-flex items-center justify-center px-6 py-3 rounded-full text-white font-medium text-sm bg-primary-btn hover:bg-primary transition-colors"
                >
                  Post a Job
                </Link>
              </div>
            )}

            {/* FAQs */}
            {content?.faqs?.length > 0 && (
              <section className="mt-12">
                <h2 className="font-heading text-xl text-primary mb-6">
                  {employmentType.label} Work in UAE — FAQs
                </h2>
                <div className="space-y-4">
                  {content.faqs.map(({ question, answer }) => (
                    <details key={question} className="group rounded-2xl bg-surface-lowest shadow-ambient p-5">
                      <summary className="font-semibold text-sm text-text-main cursor-pointer list-none flex items-center justify-between gap-3">
                        {question}
                        <span className="text-text-muted group-open:rotate-180 transition-transform shrink-0">▾</span>
                      </summary>
                      <p className="mt-3 text-sm text-text-muted leading-relaxed">{answer}</p>
                    </details>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-2 space-y-6">
            {/* By emirate */}
            <div className="rounded-2xl bg-surface-lowest shadow-ambient p-5">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-text-muted mb-4">
                {employmentType.label} Jobs by Emirate
              </p>
              <ul className="flex flex-col gap-2">
                {UAE_EMIRATES.map((e) => (
                  <li key={e.slug}>
                    <Link
                      href={`/jobs/in/${e.slug}`}
                      className="text-sm text-text-muted hover:text-primary transition-colors"
                    >
                      Jobs in {e.name} →
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Other types */}
            <div className="rounded-2xl bg-surface-lowest shadow-ambient p-5">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-text-muted mb-4">
                Other Job Types
              </p>
              <ul className="flex flex-col gap-2">
                {EMPLOYMENT_TYPES.filter((t) => t.slug !== typeSlug).map((t) => (
                  <li key={t.slug}>
                    <Link
                      href={`/jobs/type/${t.slug}`}
                      className="text-sm text-text-muted hover:text-primary transition-colors"
                    >
                      {t.labelPlural} →
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Post CTA */}
            <div className="rounded-2xl bg-primary p-5 text-white">
              <p className="font-heading text-base mb-1">Posting a {employmentType.label.toLowerCase()} role?</p>
              <p className="text-sm opacity-80 mb-4">Free, no account needed.</p>
              <Link
                href="/jobs/new"
                className="block text-center px-4 py-2 rounded-full bg-white text-primary font-semibold text-sm hover:bg-surface transition-colors"
              >
                Post a Job
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
