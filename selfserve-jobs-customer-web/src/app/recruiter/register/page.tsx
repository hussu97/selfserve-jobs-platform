'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { registerRecruiter } from '@/lib/api';
import { ApiError } from '@/lib/api';
import { trackEvent } from '@/lib/analytics';

interface FormData {
  name: string;
  email: string;
  linkedin_profile_url: string;
  website: string;
}

const EMPTY_FORM: FormData = {
  name: '',
  email: '',
  linkedin_profile_url: '',
  website: '',
};

export default function RecruiterRegisterPage() {
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState('');
  const hasTrackedStart = useRef(false);

  const handleFormStart = () => {
    if (!hasTrackedStart.current) {
      hasTrackedStart.current = true;
      trackEvent('recruiter-register-start');
    }
  };

  function validate(): boolean {
    const next: Partial<FormData> = {};
    if (!form.name.trim()) next.name = 'Name is required';
    if (!form.email.trim()) next.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = 'Invalid email address';
    if (!form.linkedin_profile_url.trim()) next.linkedin_profile_url = 'LinkedIn profile URL is required';
    else if (!form.linkedin_profile_url.includes('linkedin.com')) next.linkedin_profile_url = 'Must be a LinkedIn URL';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setServerError('');
    try {
      await registerRecruiter({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        linkedin_profile_url: form.linkedin_profile_url.trim(),
        website: form.website,
      });
      trackEvent('recruiter-register-submit');
      setSubmitted(true);
    } catch (err) {
      if (err instanceof ApiError) {
        setServerError(err.message);
      } else {
        setServerError('Something went wrong. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center px-4">
        <div className="max-w-lg w-full text-center">
          <div className="w-16 h-16 rounded-full bg-[var(--color-accent)] flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="font-serif text-3xl italic text-[var(--color-text-main)] mb-3">
            Check your inbox
          </h1>
          <p className="text-[var(--color-text-muted)] text-lg mb-2">
            We&apos;ve sent a verification link to <strong>{form.email}</strong>.
          </p>
          <p className="text-[var(--color-text-muted)]">
            Once verified, your application will be reviewed by our team. We&apos;ll notify you when approved — typically within 1–2 business days.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <div className="max-w-2xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="mb-12">
          <p className="text-xs uppercase tracking-widest text-[var(--color-text-muted)] mb-3">
            Recruiter Access
          </p>
          <h1 className="font-serif text-4xl md:text-5xl text-[var(--color-text-main)] mb-4">
            Apply for <em>Recruiter</em> Access
          </h1>
          <p className="text-[var(--color-text-muted)] text-lg leading-relaxed">
            Get verified access to UAE&apos;s talent pool. Post jobs and view full candidate profiles — including contact details and resumes.
          </p>
        </div>

        {/* How it works */}
        <div className="bg-[var(--color-surface)] rounded-2xl p-6 mb-10">
          <p className="text-xs uppercase tracking-widest text-[var(--color-text-muted)] mb-4">How it works</p>
          <div className="space-y-3">
            {[
              { n: '01', t: 'Submit your details below' },
              { n: '02', t: 'Verify your email via the link we send' },
              { n: '03', t: 'Our team reviews your LinkedIn profile' },
              { n: '04', t: 'Once approved, post jobs and browse talent' },
            ].map(({ n, t }) => (
              <div key={n} className="flex items-center gap-4">
                <span className="font-serif italic text-2xl text-[var(--color-accent-dark)] w-10 shrink-0">{n}</span>
                <span className="text-[var(--color-text-muted)]">{t}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-0" noValidate onFocus={handleFormStart}>
          {serverError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {serverError}
            </div>
          )}

          {/* Section 01 — Your Details */}
          <div className="border-l-2 border-[var(--color-accent)] pl-6 mb-10">
            <span className="font-serif italic text-5xl text-[var(--color-surface)] leading-none select-none">01</span>
            <h2 className="font-serif text-2xl text-[var(--color-text-main)] mt-1 mb-6">Your Details</h2>

            <div className="space-y-5">
              <div>
                <label className="block text-xs uppercase tracking-[0.1em] text-[var(--color-text-muted)] mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={`w-full bg-[var(--color-surface)] rounded-xl px-4 py-3 text-[var(--color-text-main)] outline-none focus:ring-2 focus:ring-[var(--color-accent)] ${errors.name ? 'ring-2 ring-red-400' : ''}`}
                  placeholder="Jane Smith"
                  autoComplete="name"
                />
                {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-xs uppercase tracking-[0.1em] text-[var(--color-text-muted)] mb-2">
                  Work Email *
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className={`w-full bg-[var(--color-surface)] rounded-xl px-4 py-3 text-[var(--color-text-main)] outline-none focus:ring-2 focus:ring-[var(--color-accent)] ${errors.email ? 'ring-2 ring-red-400' : ''}`}
                  placeholder="jane@company.com"
                  autoComplete="email"
                />
                {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
              </div>
            </div>
          </div>

          {/* Section 02 — LinkedIn */}
          <div className="border-l-2 border-[var(--color-accent)] pl-6 mb-10">
            <span className="font-serif italic text-5xl text-[var(--color-surface)] leading-none select-none">02</span>
            <h2 className="font-serif text-2xl text-[var(--color-text-main)] mt-1 mb-2">LinkedIn Profile</h2>
            <p className="text-sm text-[var(--color-text-muted)] mb-6">
              We use this to verify you&apos;re a legitimate recruiter. Public profiles only.
            </p>

            <div>
              <label className="block text-xs uppercase tracking-[0.1em] text-[var(--color-text-muted)] mb-2">
                LinkedIn URL *
              </label>
              <input
                type="url"
                value={form.linkedin_profile_url}
                onChange={(e) => setForm({ ...form, linkedin_profile_url: e.target.value })}
                className={`w-full bg-[var(--color-surface)] rounded-xl px-4 py-3 text-[var(--color-text-main)] outline-none focus:ring-2 focus:ring-[var(--color-accent)] ${errors.linkedin_profile_url ? 'ring-2 ring-red-400' : ''}`}
                placeholder="https://linkedin.com/in/janesmith"
              />
              {errors.linkedin_profile_url && (
                <p className="mt-1 text-xs text-red-600">{errors.linkedin_profile_url}</p>
              )}
            </div>
          </div>

          {/* Honeypot */}
          <input
            type="text"
            name="website"
            value={form.website}
            onChange={(e) => setForm({ ...form, website: e.target.value })}
            className="hidden"
            tabIndex={-1}
            autoComplete="off"
          />

          <div className="flex items-center justify-between pt-4">
            <Link
              href="/login"
              className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] transition-colors"
            >
              Already have an account? Log in
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white rounded-full px-8 py-3 font-medium transition-colors disabled:opacity-60"
            >
              {submitting ? 'Submitting…' : 'Apply for Access'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
