'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { MarkdownEditor } from '@/components/ui/MarkdownEditor';
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
  const [successData, setSuccessData] = useState<{ code: string; message: string } | null>(null);

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
    const isLive = successData.message.includes('now live');
    return (
      <div className="max-w-lg mx-auto py-12 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-4">
          <svg className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="font-heading text-2xl mb-2 text-secondary">
          Job posted!
        </h2>
        <p className="mb-6 text-sm text-text-muted">
          {isLive
            ? 'Your listing is now live and visible to candidates.'
            : "Check your email and click the verification link to publish your listing. It won't appear publicly until verified."}
        </p>
        {!isLive && (
          <StatusBanner
            type="info"
            title="Next steps"
            message="A verification email has been sent to the address you provided. The link expires in 24 hours."
          />
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-8 max-w-2xl">
      {/* Honeypot */}
      <input type="text" name="website" className="hidden" tabIndex={-1} aria-hidden="true" onChange={(e) => set('honeypot', e.target.value)} />

      {errors.general && (
        <StatusBanner type="error" message={errors.general} />
      )}

      {/* Section 01 — Verification */}
      <div className="bg-surface-lowest shadow-ambient rounded-2xl p-8 flex flex-col gap-4">
        <div className="flex items-center gap-4 border-l-2 border-primary/20 pl-4 mb-2">
          <span className="font-heading text-2xl italic text-secondary">01</span>
          <h2 className="font-heading text-xl text-primary">Your Email</h2>
        </div>
        <p className="text-sm text-text-muted -mt-2">
          Used for verification and managing your listing — never shown publicly.
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

      {/* Section 02 — Job Details */}
      <div className="bg-surface-lowest shadow-ambient rounded-2xl p-8 flex flex-col gap-4">
        <div className="flex items-center gap-4 border-l-2 border-primary/20 pl-4 mb-2">
          <span className="font-heading text-2xl italic text-secondary">02</span>
          <h2 className="font-heading text-xl text-primary">Job Details</h2>
        </div>
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
            placeholder="Dubai"
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
            min={new Date().toISOString().split('T')[0]}
            max={new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
            onChange={(e) => set('deadline_date', e.target.value || undefined)}
          />
        </div>
      </div>

      {/* Section 03 — Description */}
      <div className="bg-surface-lowest shadow-ambient rounded-2xl p-8 flex flex-col gap-4">
        <div className="flex items-center gap-4 border-l-2 border-primary/20 pl-4 mb-2">
          <span className="font-heading text-2xl italic text-secondary">03</span>
          <h2 className="font-heading text-xl text-primary">Description</h2>
        </div>
        <MarkdownEditor
          label="Job description"
          placeholder="Describe the role, responsibilities, requirements, and benefits. Markdown is supported."
          value={form.description ?? ''}
          onChange={(val) => set('description', val)}
          error={errors.description}
          hint="Markdown formatting supported (bold, lists, headings etc.)"
          required
        />
      </div>

      {/* Section 04 — Skills */}
      <div className="bg-surface-lowest shadow-ambient rounded-2xl p-8 flex flex-col gap-4">
        <div className="flex items-center gap-4 border-l-2 border-primary/20 pl-4 mb-2">
          <span className="font-heading text-2xl italic text-secondary">04</span>
          <h2 className="font-heading text-xl text-primary">Key Skills</h2>
        </div>
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
            className="flex-1 rounded-xl bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary text-text-main"
          />
          <Button type="button" variant="outline" size="md" onClick={() => addSkill(skillInput)}>
            Add
          </Button>
        </div>
        {errors.key_skills && <p className="text-xs text-red-600">{errors.key_skills}</p>}
        {(form.key_skills?.length ?? 0) > 0 && (
          <div className="flex flex-wrap gap-2 bg-surface rounded-2xl p-4">
            {form.key_skills?.map((skill) => (
              <SkillTag key={skill} skill={skill} removable onRemove={removeSkill} size="md" />
            ))}
          </div>
        )}
      </div>

      {/* Section 05 — Contact */}
      <div className="bg-surface-lowest shadow-ambient rounded-2xl p-8 flex flex-col gap-4">
        <div className="flex items-center gap-4 border-l-2 border-primary/20 pl-4 mb-2">
          <span className="font-heading text-2xl italic text-secondary">05</span>
          <h2 className="font-heading text-xl text-primary">How to Apply</h2>
        </div>
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
