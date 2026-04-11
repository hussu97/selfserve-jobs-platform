'use client';

import { Suspense, useState, useEffect, useRef } from 'react';
import { useSearchParams, useParams } from 'next/navigation';
import Link from 'next/link';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { MarkdownEditor } from '@/components/ui/MarkdownEditor';
import { Select } from '@/components/ui/Select';
import { StatusBanner } from '@/components/shared/StatusBanner';
import { SkillTag } from '@/components/shared/SkillTag';
import { CountrySelect } from '@/components/shared/CountrySelect';
import { useToast } from '@/context/ToastContext';
import {
  validateToken,
  getJob,
  getProfile,
  updateJob,
  updateProfile,
  deleteJob,
  deleteProfile,
  renewJob,
  renewProfile,
  requestManagementLinks,
} from '@/lib/api';
import { EMPLOYMENT_TYPES, NOTICE_PERIODS, RELOCATION_PREFERENCES } from '@/lib/constants';
import type { Job, Profile, UpdateJobRequest, UpdateProfileRequest } from '@/lib/types';

type PageState = 'loading' | 'invalid' | 'valid' | 'deleted';

export default function ManagePage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><span className="text-text-muted">Loading…</span></div>}>
      <ManageContent />
    </Suspense>
  );
}

function ManageContent() {
  const params = useParams<{ entityType: string; code: string }>();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const { entityType, code } = params;
  const { addToast } = useToast();

  const [pageState, setPageState] = useState<PageState>('loading');
  const [tokenError, setTokenError] = useState('');

  // Request new links form
  const [requestEmail, setRequestEmail] = useState('');
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestMessage, setRequestMessage] = useState('');
  const [requestError, setRequestError] = useState('');

  // Data
  const [job, setJob] = useState<Job | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  // Edit state
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Job edit fields
  const [jobForm, setJobForm] = useState<UpdateJobRequest>({});
  const [jobSkillInput, setJobSkillInput] = useState('');

  // Profile edit fields
  const [profileForm, setProfileForm] = useState<UpdateProfileRequest>({});
  const [profileSkillInput, setProfileSkillInput] = useState('');

  // Renew
  const [renewLoading, setRenewLoading] = useState(false);
  const [renewError, setRenewError] = useState('');

  // Delete confirm modal
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    if (!token) {
      setTokenError('No management token found in the URL.');
      setPageState('invalid');
      return;
    }

    validateToken(entityType, code, token)
      .then(async () => {
        try {
          if (entityType === 'job') {
            const j = await getJob(code);
            setJob(j);
            setJobForm({
              job_title: j.job_title,
              company_name: j.company_name,
              company_city: j.company_city,
              company_country: j.company_country,
              employment_type: j.employment_type,
              description: j.description,
              key_skills: [...j.key_skills],
              contact_method: j.contact_method,
              contact_email: j.contact_email,
              contact_url: j.contact_url,
              deadline_date: j.deadline_date,
            });
          } else {
            const p = await getProfile(code);
            setProfile(p);
            setProfileForm({
              person_name: p.person_name,
              brief: p.brief,
              current_city: p.current_city,
              current_country: p.current_country,
              years_of_experience: p.years_of_experience,
              current_title: p.current_title,
              notice_period: p.notice_period,
              relocation_preference: p.relocation_preference,
              linkedin_profile_link: p.linkedin_profile_link,
              key_skills: [...p.key_skills],
            });
          }
          setPageState('valid');
        } catch {
          setTokenError('Failed to load your listing data.');
          setPageState('invalid');
        }
      })
      .catch(() => {
        setTokenError('This management link is invalid or has expired.');
        setPageState('invalid');
      });
  }, [entityType, code, token]);

  const handleRequestLinks = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestEmail.trim()) return;
    setRequestLoading(true);
    setRequestError('');
    setRequestMessage('');
    try {
      const res = await requestManagementLinks(requestEmail.trim());
      setRequestMessage(res.message || 'Management links sent to your email.');
    } catch (err) {
      setRequestError(err instanceof Error ? err.message : 'Failed to send. Try again.');
    } finally {
      setRequestLoading(false);
    }
  };

  // -- Job helpers --
  const setJobField = <K extends keyof UpdateJobRequest>(key: K, value: UpdateJobRequest[K]) => {
    setJobForm((prev) => ({ ...prev, [key]: value }));
  };

  const addJobSkill = (skill: string) => {
    const t = skill.trim();
    if (!t) return;
    const current = jobForm.key_skills ?? [];
    if (!current.includes(t)) setJobField('key_skills', [...current, t]);
    setJobSkillInput('');
  };

  const removeJobSkill = (skill: string) => {
    setJobField('key_skills', (jobForm.key_skills ?? []).filter((s) => s !== skill));
  };

  const handleSaveJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveError('');
    try {
      const updated = await updateJob(code, jobForm, token);
      setJob(updated);
      addToast('Changes saved successfully.', 'success');
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  // -- Profile helpers --
  const setProfileField = <K extends keyof UpdateProfileRequest>(key: K, value: UpdateProfileRequest[K]) => {
    setProfileForm((prev) => ({ ...prev, [key]: value }));
  };

  const addProfileSkill = (skill: string) => {
    const t = skill.trim();
    if (!t) return;
    const current = profileForm.key_skills ?? [];
    if (!current.includes(t)) setProfileField('key_skills', [...current, t]);
    setProfileSkillInput('');
  };

  const removeProfileSkill = (skill: string) => {
    setProfileField('key_skills', (profileForm.key_skills ?? []).filter((s) => s !== skill));
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveError('');
    try {
      const updated = await updateProfile(code, profileForm, token);
      setProfile(updated);
      addToast('Changes saved successfully.', 'success');
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  // -- Renew --
  const handleRenew = async () => {
    setRenewLoading(true);
    setRenewError('');
    try {
      if (entityType === 'job') {
        const updated = await renewJob(code, token);
        setJob(updated);
      } else {
        const updated = await renewProfile(code, token);
        setProfile(updated);
      }
      addToast('Listing renewed! Active for another 60 days.', 'success');
    } catch (err) {
      setRenewError(err instanceof Error ? err.message : 'Failed to renew. Try again.');
    } finally {
      setRenewLoading(false);
    }
  };

  // -- Delete --
  const handleDelete = async () => {
    setDeleteLoading(true);
    setDeleteError('');
    try {
      if (entityType === 'job') {
        await deleteJob(code, token);
      } else {
        await deleteProfile(code, token);
      }
      setPageState('deleted');
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete. Try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  if (pageState === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Spinner size="lg" />
          <p className="text-sm text-text-muted">Verifying access…</p>
        </div>
      </div>
    );
  }

  if (pageState === 'deleted') {
    return (
      <div className="hero-gradient min-h-screen">
        <div className="max-w-lg mx-auto px-4 sm:px-6 py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
            <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="font-heading text-3xl text-primary mb-3">
            Listing <em>removed</em>
          </h1>
          <p className="text-sm mb-8 text-text-muted">
            Your listing has been permanently deleted.
          </p>
          <Link
            href={`/${entityType === 'job' ? 'jobs' : 'profiles'}`}
            className="inline-flex items-center justify-center px-6 py-3 rounded-full text-white font-semibold transition-opacity hover:opacity-90 bg-primary-btn"
          >
            ← Browse {entityType === 'job' ? 'Jobs' : 'Profiles'}
          </Link>
        </div>
      </div>
    );
  }

  if (pageState === 'invalid') {
    return (
      <div className="hero-gradient min-h-screen">
        <div className="max-w-lg mx-auto px-4 sm:px-6 py-16">
          <div className="text-center mb-10">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 bg-yellow-100">
              <svg className="h-8 w-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="font-heading text-3xl text-primary mb-3">
              Invalid management <em>link</em>
            </h1>
            <p className="text-sm text-text-muted">
              {tokenError || 'This management link is invalid or has expired.'}
            </p>
          </div>

          {/* Request new link */}
          <div className="rounded-2xl bg-surface-lowest shadow-ambient p-6">
            <h2 className="font-heading text-xl text-primary mb-1">
              Request a new link
            </h2>
            <p className="text-sm mb-5 text-text-muted">
              Enter your email to receive new management links for all your listings.
            </p>

            {requestMessage && (
              <StatusBanner type="success" message={requestMessage} className="mb-4" />
            )}
            {requestError && (
              <StatusBanner type="error" message={requestError} className="mb-4" />
            )}

            <form onSubmit={handleRequestLinks} className="flex flex-col gap-4">
              <Input
                type="email"
                label="Email address"
                placeholder="you@example.com"
                value={requestEmail}
                onChange={(e) => setRequestEmail(e.target.value)}
                required
              />
              <Button type="submit" loading={requestLoading} className="self-start rounded-full">
                Send management links
              </Button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Valid — show edit form
  const listingHref = `/${entityType === 'job' ? 'jobs' : 'profiles'}/${code}`;
  const isJobs = entityType === 'job';

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center gap-3 mb-2">
        <Link
          href={listingHref}
          className="text-sm hover:opacity-70 flex items-center gap-1 text-text-muted"
        >
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
          </svg>
          View listing
        </Link>
      </div>
      <span className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-4 block">
        Listing management
      </span>
      <h1 className="font-heading text-3xl sm:text-4xl text-primary mb-2">
        Manage {isJobs ? <em>Job Listing</em> : <em>Profile</em>}
      </h1>
      <p className="text-sm mb-10 text-text-muted">
        {isJobs
          ? `Editing: ${job?.job_title} at ${job?.company_name}`
          : `Editing: ${profile?.person_name} — ${profile?.current_title}`}
      </p>

      {saveError && (
        <StatusBanner type="error" message={saveError} className="mb-6" />
      )}

      {/* Job edit form */}
      {isJobs && (
        <form onSubmit={handleSaveJob} className="flex flex-col gap-6">
          {/* Section 01 */}
          <div>
            <div className="flex items-center gap-4 border-l-2 border-primary/20 pl-4 mb-6">
              <span className="font-heading text-2xl italic text-secondary">01</span>
              <h2 className="font-heading text-xl text-primary">Role Details</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Job title"
                value={jobForm.job_title ?? ''}
                onChange={(e) => setJobField('job_title', e.target.value)}
                required
              />
              <Select
                label="Employment type"
                options={EMPLOYMENT_TYPES}
                value={jobForm.employment_type ?? 'full_time'}
                onChange={(e) => setJobField('employment_type', e.target.value as UpdateJobRequest['employment_type'])}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <Input
                label="Company name"
                value={jobForm.company_name ?? ''}
                onChange={(e) => setJobField('company_name', e.target.value)}
                required
              />
              <Input
                label="City"
                value={jobForm.company_city ?? ''}
                onChange={(e) => setJobField('company_city', e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <CountrySelect
                value={jobForm.company_country ?? ''}
                onChange={(e) => setJobField('company_country', e.target.value)}
              />
              <Input
                label="Application deadline (optional)"
                type="date"
                value={jobForm.deadline_date ?? ''}
                onChange={(e) => setJobField('deadline_date', e.target.value || undefined)}
              />
            </div>
          </div>

          {/* Section 02 */}
          <div>
            <div className="flex items-center gap-4 border-l-2 border-primary/20 pl-4 mb-6">
              <span className="font-heading text-2xl italic text-secondary">02</span>
              <h2 className="font-heading text-xl text-primary">Description & Skills</h2>
            </div>
            <MarkdownEditor
              label="Job description"
              value={jobForm.description ?? ''}
              onChange={(val) => setJobField('description', val)}
              hint="Markdown formatting supported."
              required
            />
            <div className="flex flex-col gap-2 mt-4">
              <p className="text-sm font-medium text-text-main">Key skills</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={jobSkillInput}
                  onChange={(e) => setJobSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault();
                      addJobSkill(jobSkillInput);
                    }
                  }}
                  placeholder="Type a skill and press Enter"
                  className="flex-1 rounded-lg bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary text-text-main"
                />
                <Button type="button" variant="outline" size="md" onClick={() => addJobSkill(jobSkillInput)}>
                  Add
                </Button>
              </div>
              {(jobForm.key_skills?.length ?? 0) > 0 && (
                <div className="flex flex-wrap gap-2 p-3 rounded-xl bg-surface">
                  {jobForm.key_skills?.map((skill) => (
                    <SkillTag key={skill} skill={skill} removable onRemove={removeJobSkill} size="md" />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Section 03 */}
          <div>
            <div className="flex items-center gap-4 border-l-2 border-primary/20 pl-4 mb-6">
              <span className="font-heading text-2xl italic text-secondary">03</span>
              <h2 className="font-heading text-xl text-primary">Contact Method</h2>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="contact_method"
                    value="email"
                    checked={jobForm.contact_method === 'email'}
                    onChange={() => setJobField('contact_method', 'email')}
                    className="accent-primary"
                  />
                  <span className="text-sm text-text-main">Via email</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="contact_method"
                    value="url"
                    checked={jobForm.contact_method === 'url'}
                    onChange={() => setJobField('contact_method', 'url')}
                    className="accent-primary"
                  />
                  <span className="text-sm text-text-main">Via URL</span>
                </label>
              </div>
              {jobForm.contact_method === 'email' ? (
                <Input
                  label="Contact email"
                  type="email"
                  value={jobForm.contact_email ?? ''}
                  onChange={(e) => setJobField('contact_email', e.target.value)}
                />
              ) : (
                <Input
                  label="Application URL"
                  type="url"
                  value={jobForm.contact_url ?? ''}
                  onChange={(e) => setJobField('contact_url', e.target.value)}
                />
              )}
            </div>
          </div>

          <Button type="submit" size="lg" loading={saving} className="self-start rounded-full">
            Save changes
          </Button>
        </form>
      )}

      {/* Profile edit form */}
      {!isJobs && (
        <form onSubmit={handleSaveProfile} className="flex flex-col gap-6">
          {/* Section 01 */}
          <div>
            <div className="flex items-center gap-4 border-l-2 border-primary/20 pl-4 mb-6">
              <span className="font-heading text-2xl italic text-secondary">01</span>
              <h2 className="font-heading text-xl text-primary">Personal Details</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full name"
                value={profileForm.person_name ?? ''}
                onChange={(e) => setProfileField('person_name', e.target.value)}
                required
              />
              <Input
                label="Current title"
                value={profileForm.current_title ?? ''}
                onChange={(e) => setProfileField('current_title', e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <Input
                label="Current city"
                value={profileForm.current_city ?? ''}
                onChange={(e) => setProfileField('current_city', e.target.value)}
                required
              />
              <CountrySelect
                value={profileForm.current_country ?? ''}
                onChange={(e) => setProfileField('current_country', e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <Input
                label="Years of experience"
                type="number"
                min={0}
                max={50}
                value={profileForm.years_of_experience !== undefined ? String(profileForm.years_of_experience) : ''}
                onChange={(e) => setProfileField('years_of_experience', parseInt(e.target.value) || 0)}
              />
              <Input
                label="LinkedIn profile (optional)"
                type="url"
                value={profileForm.linkedin_profile_link ?? ''}
                onChange={(e) => setProfileField('linkedin_profile_link', e.target.value || undefined)}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <Select
                label="Notice period"
                options={NOTICE_PERIODS}
                value={profileForm.notice_period ?? 'immediate'}
                onChange={(e) => setProfileField('notice_period', e.target.value as UpdateProfileRequest['notice_period'])}
              />
              <Select
                label="Open to relocation?"
                options={RELOCATION_PREFERENCES}
                value={profileForm.relocation_preference ?? 'open'}
                onChange={(e) => setProfileField('relocation_preference', e.target.value as UpdateProfileRequest['relocation_preference'])}
              />
            </div>
          </div>

          {/* Section 02 */}
          <div>
            <div className="flex items-center gap-4 border-l-2 border-primary/20 pl-4 mb-6">
              <span className="font-heading text-2xl italic text-secondary">02</span>
              <h2 className="font-heading text-xl text-primary">Professional Brief & Skills</h2>
            </div>
            <MarkdownEditor
              label="Professional brief"
              value={profileForm.brief ?? ''}
              onChange={(val) => setProfileField('brief', val)}
              hint="Markdown formatting supported."
              required
            />
            <div className="flex flex-col gap-2 mt-4">
              <p className="text-sm font-medium text-text-main">Key skills</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={profileSkillInput}
                  onChange={(e) => setProfileSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault();
                      addProfileSkill(profileSkillInput);
                    }
                  }}
                  placeholder="Type a skill and press Enter"
                  className="flex-1 rounded-lg bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary text-text-main"
                />
                <Button type="button" variant="outline" size="md" onClick={() => addProfileSkill(profileSkillInput)}>
                  Add
                </Button>
              </div>
              {(profileForm.key_skills?.length ?? 0) > 0 && (
                <div className="flex flex-wrap gap-2 p-3 rounded-xl bg-surface">
                  {profileForm.key_skills?.map((skill) => (
                    <SkillTag key={skill} skill={skill} removable onRemove={removeProfileSkill} size="md" />
                  ))}
                </div>
              )}
            </div>
          </div>

          <Button type="submit" size="lg" loading={saving} className="self-start rounded-full">
            Save changes
          </Button>
        </form>
      )}

      {/* Renew section */}
      {(() => {
        const currentEntity = isJobs ? job : profile;
        const renewalCount = currentEntity?.renewal_count ?? 0;
        const MAX_RENEWALS = 2;
        const canRenew = renewalCount < MAX_RENEWALS && currentEntity?.status !== 'removed';
        if (!canRenew && renewalCount >= MAX_RENEWALS) return null;
        return (
          <div className="mt-12 bg-surface rounded-2xl p-8">
            <h2 className="font-heading text-xl text-primary mb-2">
              Renew Listing
            </h2>
            <p className="text-sm mb-2 text-text-muted">
              Extend your listing by 60 days. You can renew up to {MAX_RENEWALS} times.
            </p>
            <p className="text-xs mb-5 text-text-muted">
              Renewals used: {renewalCount} / {MAX_RENEWALS}
            </p>

            {renewError && (
              <StatusBanner type="error" message={renewError} className="mb-4" />
            )}

            <Button
              variant="outline"
              loading={renewLoading}
              onClick={handleRenew}
              className="rounded-full"
              disabled={!canRenew}
            >
              Renew for 60 days
            </Button>
          </div>
        );
      })()}

      {/* Delete section */}
      <div className="mt-8 pt-12 bg-surface rounded-2xl p-8">
        <h2 className="font-heading text-xl text-red-600 mb-2">
          Delete Listing
        </h2>
        <p className="text-sm mb-6 text-text-muted">
          This action is permanent and cannot be undone. Your listing will be immediately removed from the platform.
        </p>

        {deleteError && (
          <StatusBanner type="error" message={deleteError} className="mb-4" />
        )}

        <Button variant="danger" onClick={() => setShowDeleteConfirm(true)} className="rounded-full">
          Delete this listing
        </Button>
      </div>

      {/* Delete confirmation modal */}
      <Modal
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Delete listing"
        size="sm"
        role="alertdialog"
      >
        <p className="text-sm text-text-muted mb-6">
          Are you sure you want to permanently delete this listing? This cannot be undone.
        </p>
        <div className="flex gap-3 justify-end">
          <Button
            variant="ghost"
            onClick={() => setShowDeleteConfirm(false)}
            className="rounded-full"
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            loading={deleteLoading}
            onClick={handleDelete}
            className="rounded-full"
          >
            Yes, delete permanently
          </Button>
        </div>
      </Modal>
    </div>
  );
}
