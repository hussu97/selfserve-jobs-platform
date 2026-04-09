import type { Metadata } from 'next';
import { JobForm } from '@/components/jobs/JobForm';

export const metadata: Metadata = {
  title: 'Post a Job',
  description: 'Post a free job listing on jobs4u. No signup required — just verify your email.',
};

export default function NewJobPage() {
  return (
    <div className="hero-gradient min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <span className="text-xs font-semibold uppercase tracking-widest text-secondary mb-4 block">
            Free forever · No account needed
          </span>
          <h1 className="font-heading text-4xl sm:text-5xl text-primary mb-4">
            Post a <em>New</em> Job
          </h1>
          <p className="text-base text-text-muted">
            Just verify your email to publish. Reach candidates worldwide.
          </p>
        </div>

        <div className="bg-surface-lowest shadow-ambient rounded-2xl p-8">
          <JobForm />
        </div>
      </div>
    </div>
  );
}
