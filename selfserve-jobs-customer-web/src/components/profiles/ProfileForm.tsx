'use client';

import { useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Input } from '@/components/ui/Input';
import { CountrySelect } from '@/components/shared/CountrySelect';
import { CitySelect } from '@/components/shared/CitySelect';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { StatusBanner } from '@/components/shared/StatusBanner';
import { createProfile, getResumeUploadUrl, uploadResumeWithProgress } from '@/lib/api';
import { validateProfileForm } from '@/lib/validation';
import { trackEvent } from '@/lib/analytics';
import { useAuth } from '@/context/AuthContext';
import type { CreateProfileRequest } from '@/lib/types';

const ProfileFormLower = dynamic(() => import('./ProfileFormLower'), {
  loading: () => (
    <div className="flex flex-col gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-surface-lowest shadow-ambient rounded-2xl p-8 animate-pulse">
          <div className="h-6 w-32 bg-surface rounded-lg mb-4" />
          <div className="h-20 w-full bg-surface rounded-xl" />
        </div>
      ))}
    </div>
  ),
  ssr: false,
});

interface ProfileFormProps {
  onSuccess?: (code: string) => void;
}

type UploadState = 'idle' | 'uploading' | 'done' | 'error';
type FormErrors = Partial<Record<keyof CreateProfileRequest | 'general' | 'resume', string>>;

export function ProfileForm({ onSuccess }: ProfileFormProps) {
  const { email: sessionEmail, isLoggedIn } = useAuth();
  const [form, setForm] = useState<Partial<CreateProfileRequest>>({
    notice_period: 'immediate',
    relocation_preference: 'open',
    current_employment_status: 'full_time',
    contact_number: '+971 ',
    email: sessionEmail ?? undefined,
  });
  const [skillInput, setSkillInput] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeKey, setResumeKey] = useState<string | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState<{ code: string; message: string } | null>(null);
  const hasTrackedStart = useRef(false);

  const handleFormStart = () => {
    if (!hasTrackedStart.current) {
      hasTrackedStart.current = true;
      trackEvent('profile-form-start');
    }
  };

  const set = <K extends keyof CreateProfileRequest>(key: K, value: CreateProfileRequest[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const blurField = (key: keyof CreateProfileRequest) => {
    const errs = validateProfileForm(form);
    const fieldError = errs[key as keyof typeof errs];
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

  const handleFileSelect = async (file: File | null) => {
    if (!file) {
      setResumeFile(null);
      setResumeKey(null);
      setUploadState('idle');
      setUploadProgress(0);
      setErrors((prev) => ({ ...prev, resume: undefined }));
      return;
    }

    if (file.type !== 'application/pdf') {
      setErrors((prev) => ({ ...prev, resume: 'Only PDF files are accepted' }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, resume: 'File must be under 5 MB' }));
      return;
    }

    setResumeFile(file);
    setErrors((prev) => ({ ...prev, resume: undefined }));
    setUploadState('uploading');
    setUploadProgress(0);
    setResumeKey(null);

    try {
      const { resume_key: key, upload_url: uploadUrl } = await getResumeUploadUrl();
      if (uploadUrl) {
        await uploadResumeWithProgress(file, uploadUrl, (pct) => setUploadProgress(pct));
      }
      setResumeKey(key);
      setUploadState('done');
      setUploadProgress(100);
    } catch {
      setUploadState('error');
      setErrors((prev) => ({ ...prev, resume: 'Upload failed. Please try again.' }));
    }
  };

  const validate = (): boolean => {
    const errs: FormErrors = {};
    if (!form.person_name?.trim()) errs.person_name = 'Name is required';
    if (!form.email?.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Please enter a valid email';
    if (!form.current_title?.trim()) errs.current_title = 'Current title is required';
    if (!form.current_city?.trim()) errs.current_city = 'City is required';
    if (!form.current_country) errs.current_country = 'Country is required';
    if (form.years_of_experience === undefined || form.years_of_experience < 0) errs.years_of_experience = 'Experience is required';
    if ((form.key_skills?.length ?? 0) === 0) errs.key_skills = 'At least one skill is required';
    const phoneVal = form.contact_number?.replace(/[\s\-()]/g, '') ?? '';
    if (!phoneVal || phoneVal.length < 5) errs.contact_number = 'Contact number is required';
    if (!resumeFile) {
      errs.resume = 'Resume is required';
    } else if (uploadState === 'uploading') {
      errs.resume = 'Please wait for the upload to finish';
    } else if (uploadState === 'error') {
      errs.resume = 'Upload failed — please re-upload your resume';
    }
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      const firstField = Object.keys(errs)[0];
      trackEvent('profile-form-error', { field: firstField });
    }
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const payload: CreateProfileRequest = {
        ...(form as CreateProfileRequest),
        resume_key: resumeKey ?? '',
      };

      const result = await createProfile(payload);
      trackEvent('profile-form-submit', {
        has_resume: !!resumeFile,
        skill_count: form.key_skills?.length ?? 0,
        experience_years: form.years_of_experience ?? 0,
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
    const isLive = successData.message.includes('now live');
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
          {isLive
            ? 'Your profile is now live and visible to employers.'
            : "Check your email and click the verification link to publish your profile. It won't appear publicly until verified. If you don't see it, check your spam or junk folder."}
        </p>
        {!isLive && (
          <StatusBanner
            type="info"
            title="Next steps"
            message="A verification email has been sent to the address you provided. The link expires in 24 hours. If you don't see it, check your spam or junk folder."
          />
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6 max-w-2xl" onFocus={handleFormStart}>
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
            onBlur={() => blurField('person_name')}
            error={errors.person_name}
            required
          />
          <Input
            label={isLoggedIn ? 'Email (from your account)' : 'Email'}
            type="email"
            placeholder="you@email.com"
            value={form.email ?? ''}
            onChange={(e) => set('email', e.target.value)}
            onBlur={() => blurField('email')}
            error={errors.email}
            disabled={isLoggedIn}
            required
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Current title"
            placeholder="e.g. Senior Frontend Engineer"
            value={form.current_title ?? ''}
            onChange={(e) => set('current_title', e.target.value)}
            onBlur={() => blurField('current_title')}
            error={errors.current_title}
            required
          />
          <PhoneInput
            label="Contact number"
            value={form.contact_number ?? '+971 '}
            onChange={(val) => set('contact_number', val)}
            error={errors.contact_number}
            required
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <CountrySelect
            value={form.current_country ?? ''}
            onChange={(e) => {
              set('current_country', e.target.value);
              set('current_city', '');
            }}
            error={errors.current_country}
            required
          />
          <CitySelect
            label="Current city"
            country={form.current_country ?? ''}
            value={form.current_city ?? ''}
            onChange={(city) => set('current_city', city)}
            onBlur={() => blurField('current_city')}
            error={errors.current_city}
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
            onBlur={() => blurField('years_of_experience')}
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

      <ProfileFormLower
        form={form}
        errors={errors}
        set={set}
        skillInput={skillInput}
        setSkillInput={setSkillInput}
        addSkill={addSkill}
        removeSkill={removeSkill}
        resumeFile={resumeFile}
        onFileSelect={handleFileSelect}
        uploadState={uploadState}
        uploadProgress={uploadProgress}
      />

      <button
        type="submit"
        disabled={loading || uploadState === 'uploading'}
        className="self-start bg-secondary text-white px-10 py-4 rounded-xl font-label text-sm uppercase tracking-widest hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer inline-flex items-center gap-2"
      >
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
