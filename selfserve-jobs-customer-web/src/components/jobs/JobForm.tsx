'use client';

import { useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { CountrySelect } from '@/components/shared/CountrySelect';
import { StatusBanner } from '@/components/shared/StatusBanner';
import { EMPLOYMENT_TYPES } from '@/lib/constants';
import { createJob } from '@/lib/api';
import { validateJobForm } from '@/lib/validation';
import { useAuth } from '@/context/AuthContext';
import { trackEvent } from '@/lib/analytics';
import type { CreateJobRequest } from '@/lib/types';

const JobFormLower = dynamic(() => import('./JobFormLower'), {
  loading: () => (
    <div className="flex flex-col gap-8">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-surface-lowest shadow-ambient rounded-2xl p-8 animate-pulse">
          <div className="h-6 w-32 bg-surface rounded-lg mb-4" />
          <div className="h-24 w-full bg-surface rounded-xl" />
        </div>
      ))}
    </div>
  ),
  ssr: false,
});

interface JobFormProps {
  onSuccess?: (code: string) => void;
}

type FormErrors = Partial<Record<keyof CreateJobRequest | 'general' | 'salary', string>>;

export function JobForm({ onSuccess }: JobFormProps) {
  const { sessionToken, isActiveRecruiter } = useAuth();
  const [form, setForm] = useState<Partial<CreateJobRequest>>({
    contact_method: 'email',
    employment_type: 'full_time',
  });
  const [skillInput, setSkillInput] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState<{ code: string; message: string } | null>(null);
  const hasTrackedStart = useRef(false);

  const source = isActiveRecruiter ? 'recruiter' : 'direct';

  const handleFormStart = () => {
    if (!hasTrackedStart.current) {
      hasTrackedStart.current = true;
      trackEvent(`job-form-start-${source}`);
    }
  };

  const set = <K extends keyof CreateJobRequest>(key: K, value: CreateJobRequest[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined, salary: undefined }));
  };

  const blurField = (key: keyof CreateJobRequest | 'salary') => {
    const errs = validateJobForm(form);
    const fieldError = key === 'salary' ? errs.salary : errs[key as keyof CreateJobRequest];
    if (fieldError) {
      setErrors((prev) => ({ ...prev, [key]: fieldError }));
    }
  };

  const addSkill = (skill: string) => {
    const trimmed = skill.trim();
    if (!trimmed) return;
    const current = form.key_skills ?? [];
    if (!current.includes(trimmed)) {
      set('key_skills', [...current, trimmed]);
    }
    setSkillInput('');
  };

  const removeSkill = (skill: string) => {
    set('key_skills', (form.key_skills ?? []).filter((s) => s !== skill));
  };

  const validate = (): boolean => {
    const errs = validateJobForm(form);
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      const firstField = Object.keys(errs)[0];
      trackEvent('job-form-error', { field: firstField });
    }
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const payload: CreateJobRequest = {
        job_title: form.job_title!,
        company_name: form.company_name!,
        company_city: form.company_city!,
        company_country: form.company_country!,
        employment_type: form.employment_type!,
        description: form.description!,
        key_skills: form.key_skills!,
        contact_method: form.contact_method!,
        contact_email: form.contact_email,
        contact_url: form.contact_url,
        deadline_date: form.deadline_date,
        salary_min: form.salary_min,
        salary_max: form.salary_max,
        salary_currency: form.salary_currency,
        honeypot: form.honeypot,
      };
      const result = await createJob(payload, sessionToken!);
      trackEvent(`job-form-submit-${source}`, {
        employment_type: form.employment_type ?? 'full_time',
        has_salary: !!(form.salary_min || form.salary_max),
        skill_count: form.key_skills?.length ?? 0,
      });
      setSuccessData({ code: result.code, message: result.message });
      onSuccess?.(result.code);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setErrors({ general: msg });
    } finally {
      setLoading(false);
    }
  };

  if (successData) {
    return (
      <div className="max-w-lg mx-auto py-12 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-4">
          <svg className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="font-heading text-2xl mb-2 text-secondary">Job posted!</h2>
        <p className="mb-6 text-sm text-text-muted">
          Your listing is now live and visible to candidates.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-8 max-w-2xl" onFocus={handleFormStart}>
      {/* Honeypot */}
      <input type="text" name="website" className="hidden" tabIndex={-1} aria-hidden="true" onChange={(e) => set('honeypot', e.target.value)} />

      {errors.general && (
        <StatusBanner type="error" message={errors.general} />
      )}

      {/* Section 01 — Job Details */}
      <div className="bg-surface-lowest shadow-ambient rounded-2xl p-8 flex flex-col gap-4">
        <div className="flex items-center gap-4 border-l-2 border-primary/20 pl-4 mb-2">
          <span className="font-heading text-2xl italic text-secondary">01</span>
          <h2 className="font-heading text-xl text-primary">Job Details</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Job title"
            placeholder="e.g. Senior Frontend Engineer"
            value={form.job_title ?? ''}
            onChange={(e) => set('job_title', e.target.value)}
            onBlur={() => blurField('job_title')}
            error={errors.job_title}
            required
          />
          <Select
            label="Employment type"
            options={EMPLOYMENT_TYPES}
            value={form.employment_type ?? 'full_time'}
            onChange={(e) => set('employment_type', e.target.value as CreateJobRequest['employment_type'])}
            required
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Company name"
            placeholder="Acme Inc."
            value={form.company_name ?? ''}
            onChange={(e) => set('company_name', e.target.value)}
            onBlur={() => blurField('company_name')}
            error={errors.company_name}
            required
          />
          <Input
            label="City"
            placeholder="Dubai"
            value={form.company_city ?? ''}
            onChange={(e) => set('company_city', e.target.value)}
            onBlur={() => blurField('company_city')}
            error={errors.company_city}
            required
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <CountrySelect
            value={form.company_country ?? ''}
            onChange={(e) => set('company_country', e.target.value)}
            error={errors.company_country}
            required
          />
          <Input
            label="Application deadline (optional)"
            type="date"
            value={form.deadline_date ?? ''}
            min={new Date().toISOString().split('T')[0]}
            max={new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
            onChange={(e) => set('deadline_date', e.target.value || undefined)}
          />
        </div>
      </div>

      <JobFormLower
        form={form}
        errors={errors}
        set={set}
        blurField={blurField}
        skillInput={skillInput}
        setSkillInput={setSkillInput}
        addSkill={addSkill}
        removeSkill={removeSkill}
      />

      <button type="submit" disabled={loading} className="self-start bg-secondary text-white px-10 py-4 rounded-xl font-label text-sm uppercase tracking-widest hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer inline-flex items-center gap-2">
        {loading && (
          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        Post Job
      </button>
    </form>
  );
}
