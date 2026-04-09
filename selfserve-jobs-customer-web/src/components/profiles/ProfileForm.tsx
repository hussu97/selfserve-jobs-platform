'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { SkillTag } from '@/components/shared/SkillTag';
import { CountrySelect } from '@/components/shared/CountrySelect';
import { StatusBanner } from '@/components/shared/StatusBanner';
import { NOTICE_PERIODS, RELOCATION_PREFERENCES } from '@/lib/constants';
import { createProfile, uploadResume } from '@/lib/api';
import type { CreateProfileRequest } from '@/lib/types';

interface ProfileFormProps {
  onSuccess?: (code: string) => void;
}

type FormErrors = Partial<Record<keyof CreateProfileRequest | 'general' | 'resume', string>>;

export function ProfileForm({ onSuccess }: ProfileFormProps) {
  const [form, setForm] = useState<Partial<CreateProfileRequest>>({
    notice_period: 'immediate',
    relocation_preference: 'open',
  });
  const [skillInput, setSkillInput] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const set = <K extends keyof CreateProfileRequest>(key: K, value: CreateProfileRequest[K]) => {
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
    if (!form.person_name?.trim()) errs.person_name = 'Name is required';
    if (!form.email?.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Please enter a valid email';
    if (!form.current_title?.trim()) errs.current_title = 'Current title is required';
    if (!form.brief?.trim()) errs.brief = 'Brief is required';
    if (!form.current_city?.trim()) errs.current_city = 'City is required';
    if (!form.current_country) errs.current_country = 'Country is required';
    if (form.years_of_experience === undefined || form.years_of_experience < 0) errs.years_of_experience = 'Experience is required';
    if ((form.key_skills?.length ?? 0) === 0) errs.key_skills = 'At least one skill is required';
    if (resumeFile && resumeFile.type !== 'application/pdf') errs.resume = 'Only PDF files are accepted';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      let resumeKey: string | undefined;
      if (resumeFile) {
        const uploadResult = await uploadResume(resumeFile);
        resumeKey = uploadResult.resume_key;
      }

      const payload: CreateProfileRequest = {
        ...(form as CreateProfileRequest),
        resume_key: resumeKey,
      };

      const result = await createProfile(payload);
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
        <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-4">
          <svg className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="font-heading text-2xl mb-2 text-secondary">
          Profile created!
        </h2>
        <p className="mb-6 text-sm text-text-muted">
          Check your email and click the verification link to publish your profile. It won&apos;t appear publicly until verified.
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

      {errors.general && <StatusBanner type="error" message={errors.general} />}

      {/* Personal info */}
      <div className="bg-surface-lowest shadow-ambient rounded-2xl p-8 flex flex-col gap-4">
        <div className="flex items-center gap-4 border-l-2 border-primary/20 pl-4 mb-6">
          <span className="font-heading text-2xl italic text-secondary">01</span>
          <h2 className="font-heading text-xl text-primary">Personal information</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Full name"
            placeholder="Jane Smith"
            value={form.person_name ?? ''}
            onChange={(e) => set('person_name', e.target.value)}
            error={errors.person_name}
            required
          />
          <Input
            label="Email"
            type="email"
            placeholder="you@email.com"
            value={form.email ?? ''}
            onChange={(e) => set('email', e.target.value)}
            error={errors.email}
            required
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Current title"
            placeholder="e.g. Senior Frontend Engineer"
            value={form.current_title ?? ''}
            onChange={(e) => set('current_title', e.target.value)}
            error={errors.current_title}
            required
          />
          <Input
            label="Contact number (optional)"
            type="tel"
            placeholder="+1 555 000 0000"
            value={form.contact_number ?? ''}
            onChange={(e) => set('contact_number', e.target.value || undefined)}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Current city"
            placeholder="San Francisco"
            value={form.current_city ?? ''}
            onChange={(e) => set('current_city', e.target.value)}
            error={errors.current_city}
            required
          />
          <CountrySelect
            value={form.current_country ?? ''}
            onChange={(e) => set('current_country', e.target.value)}
            error={errors.current_country}
            required
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Years of experience"
            type="number"
            min={0}
            max={50}
            placeholder="5"
            value={form.years_of_experience !== undefined ? String(form.years_of_experience) : ''}
            onChange={(e) => set('years_of_experience', parseInt(e.target.value) || 0)}
            error={errors.years_of_experience}
            required
          />
          <Input
            label="LinkedIn profile (optional)"
            type="url"
            placeholder="https://linkedin.com/in/yourname"
            value={form.linkedin_profile_link ?? ''}
            onChange={(e) => set('linkedin_profile_link', e.target.value || undefined)}
          />
        </div>
      </div>

      {/* Availability */}
      <div className="bg-surface-lowest shadow-ambient rounded-2xl p-8 flex flex-col gap-4">
      <div className="flex items-center gap-4 border-l-2 border-primary/20 pl-4 mb-2">
        <span className="font-heading text-2xl italic text-secondary">02</span>
        <h2 className="font-heading text-xl text-primary">Availability</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="Notice period"
          options={NOTICE_PERIODS}
          value={form.notice_period ?? 'immediate'}
          onChange={(e) => set('notice_period', e.target.value as CreateProfileRequest['notice_period'])}
          required
        />
        <Select
          label="Open to relocation?"
          options={RELOCATION_PREFERENCES}
          value={form.relocation_preference ?? 'open'}
          onChange={(e) => set('relocation_preference', e.target.value as CreateProfileRequest['relocation_preference'])}
          required
        />
      </div>
      </div>

      {/* Brief */}
      <div className="bg-surface-lowest shadow-ambient rounded-2xl p-8 flex flex-col gap-4">
        <div className="flex items-center gap-4 border-l-2 border-primary/20 pl-4 mb-2">
          <span className="font-heading text-2xl italic text-secondary">03</span>
          <h2 className="font-heading text-xl text-primary">Professional brief</h2>
        </div>
        <Textarea
          label="Professional brief"
          placeholder="Tell employers about yourself, your experience, and what you're looking for. Markdown is supported."
          value={form.brief ?? ''}
          onChange={(e) => set('brief', e.target.value)}
          error={errors.brief}
          rows={8}
          hint="Markdown formatting supported."
          required
        />
      </div>

      {/* Skills */}
      <div className="bg-surface-lowest shadow-ambient rounded-2xl p-8 flex flex-col gap-4">
        <div className="flex items-center gap-4 border-l-2 border-primary/20 pl-4 mb-2">
          <span className="font-heading text-2xl italic text-secondary">04</span>
          <h2 className="font-heading text-xl text-primary">Key skills</h2>
        </div>
        <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-text-muted -mt-2">
          Required <span className="text-primary">*</span>
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
            className="flex-1 rounded-xl bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary text-text-main"
          />
          <Button type="button" variant="outline" size="md" className="rounded-full" onClick={() => addSkill(skillInput)}>
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

      {/* Resume */}
      <div className="bg-surface-lowest shadow-ambient rounded-2xl p-8 flex flex-col gap-4">
        <div className="flex items-center gap-4 border-l-2 border-primary/20 pl-4 mb-2">
          <span className="font-heading text-2xl italic text-secondary">05</span>
          <h2 className="font-heading text-xl text-primary">Resume</h2>
        </div>
        <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-text-muted -mt-2">
          Optional — PDF only
        </p>
        <div
          className={`bg-surface rounded-2xl p-8 border-2 border-dashed text-center transition-colors hover:border-primary/50 ${resumeFile ? 'border-primary' : 'border-border'}`}
        >
          {resumeFile ? (
            <div className="flex items-center justify-center gap-3">
              <svg className="h-5 w-5 text-primary" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium text-text-main">
                {resumeFile.name}
              </span>
              <button
                type="button"
                onClick={() => setResumeFile(null)}
                className="text-xs hover:opacity-70 text-text-muted"
              >
                Remove
              </button>
            </div>
          ) : (
            <label className="cursor-pointer">
              <div className="flex flex-col items-center gap-2">
                <svg className="h-8 w-8 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                </svg>
                <span className="text-sm font-medium text-text-main">
                  Click to upload PDF
                </span>
                <span className="text-xs text-text-muted">
                  PDF only, max 10MB
                </span>
              </div>
              <input
                type="file"
                accept=".pdf,application/pdf"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setResumeFile(file);
                }}
              />
            </label>
          )}
        </div>
        {errors.resume && <p className="text-xs text-red-600">{errors.resume}</p>}
      </div>

      <button type="submit" disabled={loading} className="self-start bg-secondary text-white px-10 py-4 rounded-xl font-label text-sm uppercase tracking-widest hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer inline-flex items-center gap-2">
        {loading && (
          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        Create Profile
      </button>
    </form>
  );
}
