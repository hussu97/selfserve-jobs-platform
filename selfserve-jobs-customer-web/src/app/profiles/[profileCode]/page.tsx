import { cache } from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ProfileDetail } from '@/components/profiles/ProfileDetail';
import { ProfileCard } from '@/components/profiles/ProfileCard';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { JsonLd } from '@/components/seo/JsonLd';
import { personSchema } from '@/lib/schema';
import { getProfile, getProfiles, ApiError } from '@/lib/api';
import { truncate } from '@/lib/utils';

// Deduplicate the getProfile fetch between generateMetadata and the page component
const getProfileCached = cache(getProfile);

interface PageProps {
  params: Promise<{ profileCode: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { profileCode } = await params;
  try {
    const profile = await getProfileCached(profileCode);
    const title = `${profile.person_name} — ${profile.current_title}`;
    const description = `${profile.current_title} based in ${profile.current_city}, ${profile.current_country}. ${profile.years_of_experience} years of experience. ${truncate(profile.brief, 100)}`;
    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: 'profile',
      },
      alternates: {
        canonical: `/profiles/${profileCode}`,
      },
    };
  } catch (err) {
    if (err instanceof ApiError && err.status === 410) {
      return { title: 'Profile No Longer Available', robots: { index: false } };
    }
    return { title: 'Profile Not Found' };
  }
}

export default async function ProfileDetailPage({ params }: PageProps) {
  const { profileCode } = await params;

  let profile;
  try {
    profile = await getProfileCached(profileCode);
  } catch (err) {
    if (err instanceof ApiError && err.status === 410) {
      return (
        <div className="hero-gradient min-h-[60vh] flex items-center justify-center">
          <div className="max-w-md mx-auto px-4 text-center py-20">
            <p className="text-xs uppercase tracking-widest text-text-muted mb-4">Profile Expired</p>
            <h1 className="font-heading text-3xl text-primary mb-4">This profile is no longer available</h1>
            <p className="text-text-muted mb-8">The listing has expired or been removed by the candidate.</p>
            <Link
              href="/profiles"
              className="inline-block px-6 py-3 rounded-full bg-primary text-white font-medium text-sm hover:bg-primary-hover transition-colors"
            >
              Browse talent
            </Link>
          </div>
        </div>
      );
    }
    notFound();
  }

  const recentProfilesResult = await getProfiles({ per_page: 4 }).catch(() => null);
  const recentProfiles =
    recentProfilesResult?.items.filter((p) => p.code !== profileCode).slice(0, 3) ?? [];

  const citySlug = profile.current_city?.toLowerCase().replace(/\s+/g, '-');

  return (
    <>
      <JsonLd data={personSchema(profile)} />
      <div className="hero-gradient">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <Breadcrumbs
            items={[
              { label: 'Talent', href: '/profiles' },
              ...(profile.current_city ? [{ label: `${profile.current_city} Talent`, href: `/profiles/in/${citySlug}` }] : []),
              { label: profile.person_name },
            ]}
          />
          <ProfileDetail profile={profile} />

          {recentProfiles.length > 0 && (
            <section className="mt-16">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-heading text-xl text-primary">More Talent</h2>
                <Link href="/profiles" prefetch={false} className="text-sm font-medium hover:opacity-70 text-primary">
                  Browse all →
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {recentProfiles.map((p) => (
                  <ProfileCard key={p.code} profile={p} />
                ))}
              </div>
            </section>
          )}

          {/* Contextual links — prefetch disabled to reduce RSC background requests */}
          <div className="mt-12 flex flex-wrap gap-2">
            {profile.current_city && citySlug && (
              <Link
                href={`/profiles/in/${citySlug}`}
                prefetch={false}
                className="text-xs uppercase tracking-wider px-3 py-1.5 rounded-full bg-surface text-text-muted hover:text-text-main hover:bg-surface-container-high transition-colors"
              >
                More talent in {profile.current_city}
              </Link>
            )}
            {profile.key_skills?.slice(0, 3).map((skill) => (
              <Link
                key={skill}
                href={`/profiles/skill/${skill.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                prefetch={false}
                className="text-xs uppercase tracking-wider px-3 py-1.5 rounded-full bg-surface text-text-muted hover:text-text-main hover:bg-surface-container-high transition-colors"
              >
                {skill} talent
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
