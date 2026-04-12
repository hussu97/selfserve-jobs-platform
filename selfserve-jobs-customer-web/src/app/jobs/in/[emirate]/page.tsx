import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { JobCard } from '@/components/jobs/JobCard';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { JsonLd } from '@/components/seo/JsonLd';
import { collectionPageSchema, faqSchema } from '@/lib/schema';
import { getJobs } from '@/lib/api';
import { UAE_EMIRATES, TOP_SKILLS, getEmirateBySlug } from '@/lib/seo-constants';
import { EMIRATE_CONTENT } from '@/lib/seo-content';

interface PageProps {
  params: Promise<{ emirate: string }>;
}

export async function generateStaticParams() {
  return UAE_EMIRATES.map((e) => ({ emirate: e.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { emirate: emirateSlug } = await params;
  const emirate = getEmirateBySlug(emirateSlug);
  if (!emirate) return { title: 'Not Found' };

  const title = `Jobs in ${emirate.name}, UAE`;
  const description = `Browse active jobs in ${emirate.name}, UAE. Find full-time, remote, contract, and freelance opportunities across all industries. No signup required — apply directly to employers.`;

  return {
    title,
    description,
    openGraph: { title, description, type: 'website' },
    alternates: { canonical: `/jobs/in/${emirateSlug}` },
  };
}

export default async function EmirateJobsPage({ params }: PageProps) {
  const { emirate: emirateSlug } = await params;
  const emirate = getEmirateBySlug(emirateSlug);
  if (!emirate) notFound();

  const content = EMIRATE_CONTENT[emirateSlug];

  const [jobsResult] = await Promise.allSettled([
    getJobs({ city: emirate.city, country: 'UAE', per_page: 20 }),
  ]);
  const jobs = jobsResult.status === 'fulfilled' ? jobsResult.value.items : [];
  const total = jobsResult.status === 'fulfilled' ? jobsResult.value.total : 0;

  const pageUrl = `/jobs/in/${emirateSlug}`;
  const schemas = [
    collectionPageSchema({
      name: `Jobs in ${emirate.name}, UAE`,
      description: `Active jobs in ${emirate.name}, United Arab Emirates`,
      url: pageUrl,
      numberOfItems: total,
    }),
    ...(content?.faqs?.length ? [faqSchema(content.faqs)] : []),
  ];

  const otherEmirates = UAE_EMIRATES.filter((e) => e.slug !== emirateSlug);

  return (
    <>
      <JsonLd data={schemas} />
      <div className="hero-gradient">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-4">
          <Breadcrumbs
            items={[
              { label: 'Jobs', href: '/jobs' },
              { label: `${emirate.name} Jobs` },
            ]}
          />
          <div className="mb-8">
            <span className="text-xs font-semibold uppercase tracking-widest text-secondary mb-3 block">
              {emirate.name} · UAE
            </span>
            <h1 className="font-heading text-3xl sm:text-4xl text-primary mb-3">
              Jobs in <em>{emirate.name}</em>
            </h1>
            <p className="text-text-muted text-base">
              {total > 0
                ? `${total} active ${total === 1 ? 'listing' : 'listings'} in ${emirate.name}`
                : `No active listings in ${emirate.name} right now`}
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
                  Working in {emirate.name}
                </h2>
                <p className="text-sm text-text-muted leading-relaxed mb-4">{content.intro}</p>
                {content.highlights.length > 0 && (
                  <ul className="flex flex-wrap gap-2">
                    {content.highlights.map((h) => (
                      <li
                        key={h}
                        className="text-xs uppercase tracking-wider px-3 py-1 rounded-full bg-surface text-text-muted"
                      >
                        {h}
                      </li>
                    ))}
                  </ul>
                )}
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
                <p className="font-heading text-xl text-primary mb-2">No listings yet in {emirate.name}</p>
                <p className="text-sm text-text-muted mb-6">
                  Be the first to post a job in {emirate.name}.
                </p>
                <Link
                  href="/jobs/new"
                  className="inline-flex items-center justify-center px-6 py-3 rounded-full text-white font-medium text-sm bg-primary-btn hover:bg-primary transition-colors"
                >
                  Post a Job
                </Link>
              </div>
            )}

            {/* FAQ section */}
            {content?.faqs?.length > 0 && (
              <section className="mt-12">
                <h2 className="font-heading text-xl text-primary mb-6">
                  Working in {emirate.name} — FAQs
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
            {/* By skill */}
            <div className="rounded-2xl bg-surface-lowest shadow-ambient p-5">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-text-muted mb-4">
                {emirate.name} Jobs by Skill
              </p>
              <ul className="flex flex-col gap-2">
                {TOP_SKILLS.slice(0, 10).map((skill) => (
                  <li key={skill.slug}>
                    <Link
                      href={`/jobs/in/${emirateSlug}/${skill.slug}`}
                      className="text-sm text-text-muted hover:text-primary transition-colors"
                    >
                      {skill.name} jobs in {emirate.name} →
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Other emirates */}
            <div className="rounded-2xl bg-surface-lowest shadow-ambient p-5">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-text-muted mb-4">
                Other Emirates
              </p>
              <ul className="flex flex-col gap-2">
                {otherEmirates.map((e) => (
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

            {/* Post CTA */}
            <div className="rounded-2xl bg-primary p-5 text-white">
              <p className="font-heading text-base mb-1">Hiring in {emirate.name}?</p>
              <p className="text-sm opacity-80 mb-4">Post a job free. No account needed.</p>
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
