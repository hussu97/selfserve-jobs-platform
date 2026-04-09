import type { Metadata } from 'next';
import { ProfileForm } from '@/components/profiles/ProfileForm';

export const metadata: Metadata = {
  title: 'Create a Profile',
  description: 'Create a talent profile on jobs4u. Let employers find you. No signup required.',
};

export default function NewProfilePage() {
  return (
    <div className="hero-gradient min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <span className="text-xs font-semibold uppercase tracking-widest text-secondary mb-4 block">
            No account needed · No middlemen
          </span>
          <h1 className="font-heading text-4xl sm:text-5xl text-primary mb-4">
            Curate Your <em>Professional</em> Identity
          </h1>
          <p className="text-base text-text-muted">
            Let employers discover you. Just verify your email to go live.
          </p>
        </div>

        <div className="bg-surface-lowest shadow-ambient rounded-2xl p-8">
          <ProfileForm />
        </div>
      </div>
    </div>
  );
}
