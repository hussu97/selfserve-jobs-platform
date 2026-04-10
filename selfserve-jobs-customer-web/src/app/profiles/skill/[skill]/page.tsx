import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ProfileCard } from '@/components/profiles/ProfileCard';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { JsonLd } from '@/components/seo/JsonLd';
import { collectionPageSchema, faqSchema } from '@/lib/schema';
import { getProfiles } from '@/lib/api';
import { TOP_SKILLS, UAE_EMIRATES, getSkillBySlug } from '@/lib/seo-constants';
import { SKILL_CONTENT } from '@/lib/seo-content';

interface PageProps {
  params: Promise<{ skill: string }>;
}

export async function generateStaticParams() {
  return TOP_SKILLS.map((s) => ({ skill: s.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { skill: skillSlug } = await params;
  const skill = getSkillBySlug(skillSlug);
  if (!skill) return { title: 'Not Found' };

  const title = `${skill.name} Developers & Engineers in UAE`;
  const description = `Find ${skill.name} developers, engineers, and specialists available for hire in the UAE. Browse talent profiles from Dubai, Abu Dhabi, Sharjah, and across the Emirates.`;

  return {
    title,
    description,
    openGraph: { title, description, type: 'website' },
    alternates: { canonical: `/profiles/skill/${skillSlug}` },
  };
}

export default async function SkillTalentPage({ params }: PageProps) {
  const { skill: skillSlug } = await params;
  const skill = getSkillBySlug(skillSlug);
  if (!skill) notFound();

  const skillContent = SKILL_CONTENT[skillSlug];

  const profilesResult = await getProfiles({
    skills: [skill.name],
    per_page: 20,
  }).catch(() => null);

  const profiles = profilesResult?.items ?? [];
  const total = profilesResult?.total ?? 0;

  const otherSkills = TOP_SKILLS.filter((s) => s.slug !== skillSlug).slice(0, 10);

  const schemas = [
    collectionPageSchema({
      name: `${skill.name} Talent in UAE`,
      description: `${skill.name} developers and specialists available for hire in the United Arab Emirates`,
      url: `/profiles/skill/${skillSlug}`,
      numberOfItems: total,
    }),
    ...(skillContent?.faqs?.length ? [faqSchema(skillContent.faqs)] : []),
  ];

  return (
    <>
      <JsonLd data={schemas} />
      <div className="hero-gradient">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-4">
          <Breadcrumbs
            items={[
              { label: 'Talent', href: '/profiles' },
              { label: `${skill.name} Talent` },
            ]}
          />
          <div className="mb-8">
            <span className="text-xs font-semibold uppercase tracking-widest text-secondary mb-3 block">
              {skill.category} · UAE
            </span>
            <h1 className="font-heading text-3xl sm:text-4xl text-primary mb-3">
              <em>{skill.name}</em> Talent in the UAE
            </h1>
            <p className="text-text-muted text-base">
              {total > 0
                ? `${total} ${skill.name} ${total === 1 ? 'professional' : 'professionals'} available`
                : `No ${skill.name} profiles yet`}
              {' '}· No signup required to browse
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-7 gap-10">

          <div className="lg:col-span-5">
            {/* Skill context */}
            {skillContent && (
              <div className="mb-8 p-6 rounded-2xl bg-surface-lowest shadow-ambient">
                <h2 className="font-heading text-lg text-primary mb-3">
                  {skill.name} Demand in the UAE
                </h2>
                <p className="text-sm text-text-muted leading-relaxed mb-3">{skillContent.intro}</p>
                {skillContent.demandDrivers.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-2">
                      Key Demand Drivers
                    </p>
                    <ul className="flex flex-wrap gap-2">
                      {skillContent.demandDrivers.map((d) => (
                        <li
                          key={d}
                          className="text-xs uppercase tracking-wider px-3 py-1 rounded-full bg-surface text-text-muted"
                        >
                          {d}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {profiles.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {profiles.map((profile) => (
                  <ProfileCard key={profile.code} profile={profile} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 rounded-2xl bg-surface-lowest shadow-ambient">
                <p className="font-heading text-xl text-primary mb-2">
                  No {skill.name} profiles yet
                </p>
                <p className="text-sm text-text-muted mb-6">
                  Are you a {skill.name} professional in the UAE? Create your free profile.
                </p>
                <Link
                  href="/profiles/new"
                  className="inline-flex items-center justify-center px-6 py-3 rounded-full text-white font-medium text-sm bg-primary-btn hover:bg-primary transition-colors"
                >
                  Create Your Profile
                </Link>
              </div>
            )}

            {skillContent?.faqs?.length > 0 && (
              <section className="mt-12">
                <h2 className="font-heading text-xl text-primary mb-6">
                  {skill.name} in the UAE — FAQs
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

          <aside className="lg:col-span-2 space-y-6">
            {/* Jobs with same skill */}
            <div className="rounded-2xl bg-surface-lowest shadow-ambient p-5">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-text-muted mb-4">
                {skill.name} Jobs by Emirate
              </p>
              <ul className="flex flex-col gap-2">
                {UAE_EMIRATES.map((e) => (
                  <li key={e.slug}>
                    <Link
                      href={`/jobs/in/${e.slug}/${skillSlug}`}
                      className="text-sm text-text-muted hover:text-primary transition-colors"
                    >
                      {skill.name} jobs in {e.name} →
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl bg-surface-lowest shadow-ambient p-5">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-text-muted mb-4">
                Other Skills
              </p>
              <ul className="flex flex-col gap-2">
                {otherSkills.map((s) => (
                  <li key={s.slug}>
                    <Link
                      href={`/profiles/skill/${s.slug}`}
                      className="text-sm text-text-muted hover:text-primary transition-colors"
                    >
                      {s.name} talent →
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl bg-primary p-5 text-white">
              <p className="font-heading text-base mb-1">A {skill.name} professional?</p>
              <p className="text-sm opacity-80 mb-4">Get found by UAE employers. Free.</p>
              <Link
                href="/profiles/new"
                className="block text-center px-4 py-2 rounded-full bg-white text-primary font-semibold text-sm hover:bg-surface transition-colors"
              >
                Create Profile
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
