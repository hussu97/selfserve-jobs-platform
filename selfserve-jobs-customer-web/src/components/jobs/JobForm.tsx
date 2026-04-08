'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { SkillTag } from '@/components/shared/SkillTag';
import { CountrySelect } from '@/components/shared/CountrySelect';
import { StatusBanner } from '@/components/shared/StatusBanner';
import { EMPLOYMENT_TYPES } from '@/lib/constants';
import { createJob } from '@/lib/api';
import type { CreateJobRequest } from '@/lib/types';

interface JobFormProps {
  onSuccess?: (code: string) => void;
}

type FormErrors = Partial<Record<keyof CreateJobRequest | 'general', string>>;

export function JobForm({ onSuccess }: JobFormProps) {
  const [form, setForm] = useState<Partial<CreateJobRequest>>({
    contact_method: 'email',
    employment_type: 'full_time',
  });
  const [skillInput, setSkillInput] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const set = <K extends keyof CreateJobRequest>(key: K, value: CreateJobRequest[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
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
    const errs: FormErrors = {};
    if (!form.email?.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Please enter a valid email';
    if (!form.job_title?.trim()) errs.job_title = 'Job title is required';
    if (!form.company_name?.trim()) errs.company_name = 'Company name is required';
    if (!form.company_city?.trim()) errs.company_city = 'City is required';
    if (!form.company_country) errs.company_country = 'Country is required';
    if (!form.description?.trim()) errs.description = 'Description is required';
    if ((form.key_skills?.length ?? 0) === 0) errs.key_skills = 'At least one skill is required';
    if (form.contact_method === 'email' && !form.contact_email?.trim()) {
      errs.contact_email = 'Contact email is required';
    }
    if (form.contact_method === 'url' && !form.contact_url?.trim()) {
      errs.contact_url = 'Application URL is required';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const result = await createJob(form as CreateJobRequest);
      setSuccess(result.code);
      onSuccess?.(result.code);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setErrors({ general: msg });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-lg mx-auto py-12 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl mb-2 text-secondary">
          Job posted!
        </h2>
        <p className="mb-6 text-sm text-text-muted">
          Check your email and click the verification link to publish your listing. It won&apos;t appear publicly until verified.
        </p>
        <StatusBanner
          type="info"
          title="Next steps"
          message="A verification email has been sent to the address you provided. The link expires in 24 hours."
        />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6 max-w-2xl">
      {/* Honeypot */}
      <input type="text" name="website" className="hidden" tabIndex={-1} aria-hidden="true" onChange={(e) => set('honeypot', e.target.value)} />

      {errors.general && (
        <StatusBanner type="error" message={errors.general} />
      )}

      {/* Contact email for verification */}
      <div className="p-4 rounded-xl border border-border bg-surface">
        <p className="text-sm font-medium mb-3 text-text-main">
          Your email (for verification & management)
        </p>
        <Input
          type="email"
          placeholder="you@company.com"
          value={form.email ?? ''}
          onChange={(e) => set('email', e.target.value)}
          error={errors.email}
          required
        />
      </div>

      {/* Job Details */}
      <div className="flex flex-col gap-4">
        <h3 className="font-semibold text-text-main">
          Job details
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Job title"
            placeholder="e.g. Senior Frontend Engineer"
            value={form.job_title ?? ''}
            onChange={(e) => set('job_title', e.target.value)}
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
            error={errors.company_name}
            required
          />
          <Input
            label="City"
            placeholder="San Francisco"
            value={form.company_city ?? ''}
            onChange={(e) => set('company_city', e.target.value)}
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
            onChange={(e) => set('deadline_date', e.target.value || undefined)}
          />
        </div>
      </div>

      {/* Description */}
      <div className="flex flex-col gap-4">
        <Textarea
          label="Job description"
          placeholder="Describe the role, responsibilities, requirements, and benefits. Markdown is supported."
          value={form.description ?? ''}
          onChange={(e) => set('description', e.target.value)}
          error={errors.description}
          rows={10}
          hint="Markdown formatting supported (bold, lists, headings etc.)"
          required
        />
      </div>

      {/* Skills */}
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-text-main">
          Key skills <span className="text-primary">*</span>
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault();
                addSkill(skillInput);
              }
            }}
            placeholder="Type a skill and press Enter"
            className="flex-1 rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-text-main"
          />
          <Button type="button" variant="outline" size="md" onClick={() => addSkill(skillInput)}>
            Add
          </Button>
        </div>
        {errors.key_skills && <p className="text-xs text-red-600">{errors.key_skills}</p>}
        {(form.key_skills?.length ?? 0) > 0 && (
          <div className="flex flex-wrap gap-2 p-3 rounded-lg border border-border">
            {form.key_skills?.map((skill) => (
              <SkillTag key={skill} skill={skill} removable onRemove={removeSkill} size="md" />
            ))}
          </div>
        )}
      </div>

      {/* Contact */}
      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium text-text-main">
          How should candidates apply?
        </p>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="contact_method"
              value="email"
              checked={form.contact_method === 'email'}
              onChange={() => set('contact_method', 'email')}
            />
            <span className="text-sm text-text-main">Via email</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="contact_method"
              value="url"
              checked={form.contact_method === 'url'}
              onChange={() => set('contact_method', 'url')}
            />
            <span className="text-sm text-text-main">Via application URL</span>
          </label>
        </div>
        {form.contact_method === 'email' ? (
          <Input
            label="Contact email"
            type="email"
            placeholder="hiring@company.com"
            value={form.contact_email ?? ''}
            onChange={(e) => set('contact_email', e.target.value)}
            error={errors.contact_email}
            required
          />
        ) : (
          <Input
            label="Application URL"
            type="url"
            placeholder="https://company.com/apply"
            value={form.contact_url ?? ''}
            onChange={(e) => set('contact_url', e.target.value)}
            error={errors.contact_url}
            required
          />
        )}
      </div>

      <Button type="submit" size="lg" loading={loading} className="self-start">
        Post Job
      </Button>
    </form>
  );
}
