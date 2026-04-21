import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { JobCard } from '@/components/jobs/JobCard';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { JsonLd } from '@/components/seo/JsonLd';
import { collectionPageSchema, faqSchema } from '@/lib/schema';
import { getJobs } from '@/lib/api';
import { UAE_EMIRATES, TOP_SKILLS, getEmirateBySlug, getSkillBySlug } from '@/lib/seo-constants';
import { SKILL_CONTENT } from '@/lib/seo-content';

interface PageProps {
  params: Promise<{ emirate: string; skill: string }>;
}

export async function generateStaticParams() {
  const params: { emirate: string; skill: string }[] = [];
  for (const emirate of UAE_EMIRATES) {
    for (const skill of TOP_SKILLS.slice(0, 10)) {
      params.push({ emirate: emirate.slug, skill: skill.slug });
    }
  }
  return params;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { emirate: emirateSlug, skill: skillSlug } = await params;
  const emirate = getEmirateBySlug(emirateSlug);
  const skill = getSkillBySlug(skillSlug);
  if (!emirate || !skill) return { title: 'Not Found' };

  const title = `${skill.name} Jobs in ${emirate.name}, UAE`;
  const description = `Browse active ${skill.name} jobs in ${emirate.name}, UAE. Find ${skill.name} developer and engineer roles in ${emirate.name}. No signup required — apply directly.`;

  return {
    title,
    description,
    openGraph: { title, description, type: 'website' },
    alternates: { canonical: `/jobs/in/${emirateSlug}/${skillSlug}` },
  };
}

export default async function EmirateSkillJobsPage({ params }: PageProps) {
  const { emirate: emirateSlug, skill: skillSlug } = await params;
  const emirate = getEmirateBySlug(emirateSlug);
  const skill = getSkillBySlug(skillSlug);
  if (!emirate || !skill) notFound();

  const skillContent = SKILL_CONTENT[skillSlug];

  const jobsResult = await getJobs({
    city: emirate.city,
    country: 'UAE',
    skills: [skill.name],
    per_page: 20,
  }).catch(() => null);

  const jobs = jobsResult?.items ?? [];
  const total = jobsResult?.total ?? 0;

  // If no exact matches, fetch broader jobs for related listings
  const relatedJobsResult = total === 0
    ? await getJobs({ city: emirate.city, country: 'UAE', per_page: 6 }).catch(() => null)
    : null;
  const relatedJobs = relatedJobsResult?.items ?? [];

  const schemas = [
    collectionPageSchema({
      name: `${skill.name} Jobs in ${emirate.name}, UAE`,
      description: `Active ${skill.name} jobs in ${emirate.name}, United Arab Emirates`,
      url: `/jobs/in/${emirateSlug}/${skillSlug}`,
      numberOfItems: total,
    }),
    ...(skillContent?.faqs?.length ? [faqSchema(skillContent.faqs)] : []),
  ];

  const otherSkills = TOP_SKILLS.filter((s) => s.slug !== skillSlug).slice(0, 8);
  const otherEmirates = UAE_EMIRATES.filter((e) => e.slug !== emirateSlug);

  return (
    <>
      <JsonLd data={schemas} />
      <div className="hero-gradient">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-4">
          <Breadcrumbs
            items={[
              { label: 'Jobs', href: '/jobs' },
              { label: `${emirate.name} Jobs`, href: `/jobs/in/${emirateSlug}` },
              { label: `${skill.name} Jobs` },
            ]}
          />
          <div className="mb-8">
            <span className="text-xs font-semibold uppercase tracking-widest text-secondary mb-3 block">
              {skill.category} · {emirate.name} · UAE
            </span>
            <h1 className="font-heading text-3xl sm:text-4xl text-primary mb-3">
              <em>{skill.name}</em> Jobs in {emirate.name}
            </h1>
            <p className="text-text-muted text-base">
              {total > 0
                ? `${total} active ${skill.name} ${total === 1 ? 'listing' : 'listings'} in ${emirate.name}`
                : `No active ${skill.name} listings in ${emirate.name} right now`}
              {' '}· No signup required
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-7 gap-10">

          {/* Main content */}
          <div className="lg:col-span-5">
            {/* Skill intro */}
            {skillContent && (
              <div className="mb-8 p-6 rounded-2xl bg-surface-lowest shadow-ambient">
                <h2 className="font-heading text-lg text-primary mb-3">
                  {skill.name} in {emirate.name}
                </h2>
                <p className="text-sm text-text-muted leading-relaxed">{skillContent.intro}</p>
              </div>
            )}

            {/* Job listings or empty state */}
            {jobs.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {jobs.map((job) => (
                    <JobCard key={job.code} job={job} />
                  ))}
                </div>
              </>
            ) : (
              <div className="rounded-2xl bg-surface-lowest shadow-ambient p-8 text-center mb-8">
                <p className="font-heading text-xl text-primary mb-2">
                  No {skill.name} listings in {emirate.name} right now
                </p>
                <p className="text-sm text-text-muted mb-6">
                  New jobs are added daily. Check back soon, or browse all {emirate.name} jobs.
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  <Link
                    href={`/jobs/in/${emirateSlug}`}
                    className="inline-flex items-center justify-center px-5 py-2.5 rounded-full text-primary font-medium text-sm bg-surface hover:bg-surface-container-high transition-colors"
                  >
                    All {emirate.name} jobs
                  </Link>
                  <Link
                    href="/jobs/new"
                    className="inline-flex items-center justify-center px-5 py-2.5 rounded-full text-white font-medium text-sm bg-primary-btn hover:bg-primary transition-colors"
                  >
                    Post a {skill.name} job
                  </Link>
                </div>
              </div>
            )}

            {/* Related jobs (shown when no exact match) */}
            {relatedJobs.length > 0 && (
              <section className="mt-8">
                <h2 className="font-heading text-lg text-primary mb-4">
                  Other jobs in {emirate.name}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {relatedJobs.map((job) => (
                    <JobCard key={job.code} job={job} />
                  ))}
                </div>
              </section>
            )}

            {/* FAQs */}
            {skillContent?.faqs?.length > 0 && (
              <section className="mt-12">
                <h2 className="font-heading text-xl text-primary mb-6">
                  {skill.name} Jobs in UAE — FAQs
                </h2>
                <div className="space-y-4">
                  {skillContent.faqs.map(({ question, answer }) => (
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
            {/* Other skills in same emirate */}
            <div className="rounded-2xl bg-surface-lowest shadow-ambient p-5">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-text-muted mb-4">
                More Skills in {emirate.name}
              </p>
              <ul className="flex flex-col gap-2">
                {otherSkills.map((s) => (
                  <li key={s.slug}>
                    <Link
                      href={`/jobs/in/${emirateSlug}/${s.slug}`}
                      className="text-sm text-text-muted hover:text-primary transition-colors"
                    >
                      {s.name} →
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Same skill, other emirates */}
            <div className="rounded-2xl bg-surface-lowest shadow-ambient p-5">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-text-muted mb-4">
                {skill.name} Jobs by Emirate
              </p>
              <ul className="flex flex-col gap-2">
                {otherEmirates.map((e) => (
                  <li key={e.slug}>
                    <Link
                      href={`/jobs/in/${e.slug}/${skillSlug}`}
                      className="text-sm text-text-muted hover:text-primary transition-colors"
                    >
                      {skill.name} in {e.name} →
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl bg-primary p-5 text-white">
              <p className="font-heading text-base mb-1">Hiring {skill.name} talent?</p>
              <p className="text-sm opacity-80 mb-4">Post free. No signup.</p>
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
