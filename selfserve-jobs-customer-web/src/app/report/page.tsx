'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { StatusBanner } from '@/components/shared/StatusBanner';
import { Spinner } from '@/components/ui/Spinner';
import { submitReport } from '@/lib/api';
import { REPORT_REASONS } from '@/lib/constants';
import type { ReportReason, EntityType } from '@/lib/types';

export default function ReportPage() {
  return (
    <div className="hero-gradient min-h-screen">
      <Suspense fallback={
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      }>
        <ReportContent />
      </Suspense>
    </div>
  );
}

function ReportContent() {
  const searchParams = useSearchParams();
  const entityType = (searchParams.get('type') ?? 'jobs') as EntityType;
  const entityCode = searchParams.get('code') ?? '';

  const [reporterEmail, setReporterEmail] = useState('');
  const [reason, setReason] = useState<ReportReason>('spam');
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');

  if (!entityCode) {
    return (
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-20 text-center">
        <h1 className="font-heading text-3xl text-primary mb-3">
          Nothing to report
        </h1>
        <p className="text-sm mb-6 text-text-muted">
          No listing was specified. Please use the report button on a specific listing.
        </p>
        <Link href="/" className="text-sm font-medium hover:opacity-70 text-primary">
          ← Back to home
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError('');
    setError('');

    if (!reporterEmail.trim()) {
      setEmailError('Email is required');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(reporterEmail)) {
      setEmailError('Please enter a valid email');
      return;
    }

    setLoading(true);
    try {
      await submitReport({
        entity_type: entityType,
        entity_code: entityCode,
        reporter_email: reporterEmail.trim(),
        reason,
        details: details.trim() || undefined,
      });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
          <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="font-heading text-3xl text-primary mb-3">
          Report <em>submitted</em>
        </h1>
        <p className="text-sm mb-8 text-text-muted">
          Thank you for your report. We&apos;ll review it shortly and take appropriate action.
        </p>
        <Link
          href={`/${entityType}/${entityCode}`}
          className="inline-flex items-center justify-center px-6 py-3 rounded-full text-white font-semibold transition-opacity hover:opacity-90 bg-primary-btn"
        >
          ← Back to listing
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-16">
      <Link
        href={`/${entityType}/${entityCode}`}
        className="inline-flex items-center gap-1.5 text-sm mb-8 hover:opacity-70 text-text-muted"
      >
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
        </svg>
        Back to listing
      </Link>

      <span className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-4 block">
        Content moderation
      </span>
      <h1 className="font-heading text-4xl text-primary mb-2">
        Report a <em>listing</em>
      </h1>
      <p className="text-sm mb-8 text-text-muted">
        Help us keep jobs4u safe and spam-free. We review all reports manually.
      </p>

      {error && (
        <StatusBanner type="error" message={error} className="mb-6" />
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <Input
          type="email"
          label="Your email"
          placeholder="you@example.com"
          value={reporterEmail}
          onChange={(e) => {
            setReporterEmail(e.target.value);
            setEmailError('');
          }}
          error={emailError}
          hint="We may follow up with you about this report."
          required
        />

        <Select
          label="Reason for report"
          options={REPORT_REASONS}
          value={reason}
          onChange={(e) => setReason(e.target.value as ReportReason)}
          required
        />

        <Textarea
          label="Additional details (optional)"
          placeholder="Please provide any additional context that might help us review this report…"
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          rows={5}
        />

        <div className="rounded-2xl bg-surface p-4 text-sm">
          <p className="text-text-muted">
            <span className="font-medium text-text-main">Listing: </span>
            {entityCode} ({entityType === 'jobs' ? 'job' : 'profile'})
          </p>
        </div>

        <Button type="submit" size="lg" loading={loading} className="self-start rounded-full">
          Submit report
        </Button>
      </form>
    </div>
  );
}
