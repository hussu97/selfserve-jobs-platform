import type { Metadata } from 'next';
import { ProfileForm } from '@/components/profiles/ProfileForm';

export const metadata: Metadata = {
  title: 'Create a Profile',
  description: 'Create a free talent profile on jobs4u. Let employers find you. No signup required.',
};

export default function NewProfilePage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10">
        <h1
          className="text-3xl sm:text-4xl font-bold mb-2 font-heading text-secondary"
        >
          Create a Profile
        </h1>
        <p className="text-base text-text-muted">
          Let employers discover you. Free forever. Just verify your email to publish.
        </p>
      </div>

      <ProfileForm />
    </div>
  );
}
