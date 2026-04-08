import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ProfileDetail } from '@/components/profiles/ProfileDetail';
import { ProfileCard } from '@/components/profiles/ProfileCard';
import { getProfile, getProfiles } from '@/lib/api';
import { truncate } from '@/lib/utils';

interface PageProps {
  params: Promise<{ profileCode: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { profileCode } = await params;
  try {
    const profile = await getProfile(profileCode);
    return {
      title: `${profile.person_name} — ${profile.current_title}`,
      description: truncate(profile.brief, 160),
      openGraph: {
        title: `${profile.person_name} — ${profile.current_title}`,
        description: truncate(profile.brief, 160),
      },
    };
  } catch {
    return {
      title: 'Profile Not Found',
    };
  }
}

export default async function ProfileDetailPage({ params }: PageProps) {
  const { profileCode } = await params;

  let profile;
  try {
    profile = await getProfile(profileCode);
  } catch {
    notFound();
  }

  const recentProfilesResult = await getProfiles({ per_page: 4 }).catch(() => null);
  const recentProfiles =
    recentProfilesResult?.items.filter((p) => p.code !== profileCode).slice(0, 3) ?? [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <ProfileDetail profile={profile} />

      {recentProfiles.length > 0 && (
        <section className="mt-16">
          <div className="flex items-center justify-between mb-6">
            <h2
              className="text-xl font-bold"
              style={{ fontFamily: 'Lora, serif', color: 'var(--color-secondary)' }}
            >
              More Talent
            </h2>
            <Link
              href="/profiles"
              className="text-sm font-medium hover:opacity-70"
              style={{ color: 'var(--color-primary)' }}
            >
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
    </div>
  );
}
