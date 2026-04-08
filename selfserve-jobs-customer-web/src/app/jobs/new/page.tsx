import type { Metadata } from 'next';
import { JobForm } from '@/components/jobs/JobForm';

export const metadata: Metadata = {
  title: 'Post a Job',
  description: 'Post a free job listing on jobs4u. No signup required — just verify your email.',
};

export default function NewJobPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold mb-2 font-heading text-secondary">
          Post a Job
        </h1>
        <p className="text-base text-text-muted">
          Free forever. Just verify your email to publish. No account needed.
        </p>
      </div>

      <JobForm />
    </div>
  );
}
