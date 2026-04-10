import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ProfileCard } from '@/components/profiles/ProfileCard';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { JsonLd } from '@/components/seo/JsonLd';
import { collectionPageSchema } from '@/lib/schema';
import { getProfiles } from '@/lib/api';
import { UAE_EMIRATES, TOP_SKILLS, getEmirateBySlug } from '@/lib/seo-constants';

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

  const title = `Tech Talent in ${emirate.name}, UAE`;
  const description = `Browse available tech talent based in ${emirate.name}, UAE. Find software engineers, product managers, designers, and more. No signup required.`;

  return {
    title,
    description,
    openGraph: { title, description, type: 'website' },
    alternates: { canonical: `/profiles/in/${emirateSlug}` },
  };
}

export default async function EmirateTalentPage({ params }: PageProps) {
  const { emirate: emirateSlug } = await params;
  const emirate = getEmirateBySlug(emirateSlug);
  if (!emirate) notFound();

  const profilesResult = await getProfiles({
    country: 'UAE',
    per_page: 20,
  }).catch(() => null);

  const profiles = profilesResult?.items ?? [];
  const total = profilesResult?.total ?? 0;

  const otherEmirates = UAE_EMIRATES.filter((e) => e.slug !== emirateSlug);

  return (
    <>
      <JsonLd
        data={collectionPageSchema({
          name: `Tech Talent in ${emirate.name}, UAE`,
          description: `Professionals available for hire in ${emirate.name}, United Arab Emirates`,
          url: `/profiles/in/${emirateSlug}`,
          numberOfItems: total,
        })}
      />
      <div className="hero-gradient">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-4">
          <Breadcrumbs
            items={[
              { label: 'Talent', href: '/profiles' },
              { label: `${emirate.name} Talent` },
            ]}
          />
          <div className="mb-8">
            <span className="text-xs font-semibold uppercase tracking-widest text-secondary mb-3 block">
              Available for Hire · {emirate.name} · UAE
            </span>
            <h1 className="font-heading text-3xl sm:text-4xl text-primary mb-3">
              Tech Talent in <em>{emirate.name}</em>
            </h1>
            <p className="text-text-muted text-base">
              {total > 0
                ? `${total} ${total === 1 ? 'professional' : 'professionals'} available in ${emirate.name}`
                : `No profiles in ${emirate.name} yet`}
              {' '}· No signup required to browse
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-7 gap-10">

          <div className="lg:col-span-5">
            {profiles.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {profiles.map((profile) => (
                  <ProfileCard key={profile.code} profile={profile} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 rounded-2xl bg-surface-lowest shadow-ambient">
                <p className="font-heading text-xl text-primary mb-2">
                  No talent profiles in {emirate.name} yet
                </p>
                <p className="text-sm text-text-muted mb-6">
                  Are you a professional in {emirate.name}? Create your profile — it&apos;s free.
                </p>
                <Link
                  href="/profiles/new"
                  className="inline-flex items-center justify-center px-6 py-3 rounded-full text-white font-medium text-sm bg-primary-btn hover:bg-primary transition-colors"
                >
                  Create Your Profile
                </Link>
              </div>
            )}
          </div>

          <aside className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl bg-surface-lowest shadow-ambient p-5">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-text-muted mb-4">
                Talent by Skill
              </p>
              <ul className="flex flex-col gap-2">
                {TOP_SKILLS.slice(0, 10).map((skill) => (
                  <li key={skill.slug}>
                    <Link
                      href={`/profiles/skill/${skill.slug}`}
                      className="text-sm text-text-muted hover:text-primary transition-colors"
                    >
                      {skill.name} →
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl bg-surface-lowest shadow-ambient p-5">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-text-muted mb-4">
                Talent by Emirate
              </p>
              <ul className="flex flex-col gap-2">
                {otherEmirates.map((e) => (
                  <li key={e.slug}>
                    <Link
                      href={`/profiles/in/${e.slug}`}
                      className="text-sm text-text-muted hover:text-primary transition-colors"
                    >
                      Talent in {e.name} →
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl bg-primary p-5 text-white">
              <p className="font-heading text-base mb-1">Based in {emirate.name}?</p>
              <p className="text-sm opacity-80 mb-4">Get discovered by employers. Free profile.</p>
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
