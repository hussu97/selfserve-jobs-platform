'use client';

import { MarkdownEditor } from '@/components/ui/MarkdownEditor';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { SkillTag } from '@/components/shared/SkillTag';
import { EMPLOYMENT_STATUSES, NOTICE_PERIODS, RELOCATION_PREFERENCES } from '@/lib/constants';
import type { CreateProfileRequest } from '@/lib/types';

type UploadState = 'idle' | 'uploading' | 'done' | 'error';
type FormErrors = Partial<Record<keyof CreateProfileRequest | 'general' | 'resume', string>>;

interface ProfileFormLowerProps {
  form: Partial<CreateProfileRequest>;
  errors: FormErrors;
  set: <K extends keyof CreateProfileRequest>(key: K, value: CreateProfileRequest[K]) => void;
  skillInput: string;
  setSkillInput: (v: string) => void;
  addSkill: (s: string) => void;
  removeSkill: (s: string) => void;
  resumeFile: File | null;
  onFileSelect: (file: File | null) => void;
  uploadState: UploadState;
  uploadProgress: number;
}

export default function ProfileFormLower({
  form,
  errors,
  set,
  skillInput,
  setSkillInput,
  addSkill,
  removeSkill,
  resumeFile,
  onFileSelect,
  uploadState,
  uploadProgress,
}: ProfileFormLowerProps) {
  return (
    <>
      {/* Section 02 — Availability */}
      <div className="bg-surface-lowest shadow-ambient rounded-2xl p-8 flex flex-col gap-4">
        <div className="flex items-center gap-4 border-l-2 border-primary/20 pl-4 mb-2">
          <span className="font-heading text-2xl italic text-secondary">02</span>
          <h2 className="font-heading text-xl text-primary">Availability</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Current employment status"
            options={EMPLOYMENT_STATUSES}
            value={form.current_employment_status ?? 'full_time'}
            onChange={(e) => set('current_employment_status', e.target.value as CreateProfileRequest['current_employment_status'])}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Notice period"
            options={NOTICE_PERIODS}
            value={form.notice_period ?? 'immediate'}
            onChange={(e) => set('notice_period', e.target.value as CreateProfileRequest['notice_period'])}
            required
          />
        </div>
      </div>

      {/* Section 03 — Brief */}
      <div className="bg-surface-lowest shadow-ambient rounded-2xl p-8 flex flex-col gap-4">
        <div className="flex items-center gap-4 border-l-2 border-primary/20 pl-4 mb-2">
          <span className="font-heading text-2xl italic text-secondary">03</span>
          <h2 className="font-heading text-xl text-primary">Professional brief</h2>
        </div>
        <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-text-muted -mt-2">
          Optional — Markdown supported
        </p>
        <MarkdownEditor
          label="Professional brief"
          placeholder="Tell hiring teams about yourself, your experience, and what you're looking for. Markdown is supported."
          value={form.brief ?? ''}
          onChange={(val) => set('brief', val)}
          hint="Markdown formatting is rendered when hiring teams view your profile."
        />
      </div>

      {/* Section 04 — Skills */}
      <div className="bg-surface-lowest shadow-ambient rounded-2xl p-8 flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4 border-l-2 border-primary/20 pl-4 mb-2">
          <div className="flex items-center gap-4">
            <span className="font-heading text-2xl italic text-secondary">04</span>
            <h2 className="font-heading text-xl text-primary">Key skills</h2>
          </div>
          <span className="text-xs text-text-muted tabular-nums ml-auto">
            {form.key_skills?.length ?? 0}/8
          </span>
        </div>
        <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-text-muted -mt-2">
          Required <span className="text-primary">*</span> — Max 8 skills
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
            disabled={(form.key_skills?.length ?? 0) >= 8}
            className="flex-1 rounded-xl bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary text-text-main disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <Button type="button" variant="outline" size="md" className="rounded-full" disabled={(form.key_skills?.length ?? 0) >= 8} onClick={() => addSkill(skillInput)}>
            Add
          </Button>
        </div>
        {(form.key_skills?.length ?? 0) < 8 && (() => {
          const suggestions = ['Microsoft Office', 'Project Management', 'Data Analysis', 'Communication', 'Customer Service', 'Leadership', 'Sales', 'Problem Solving', 'Teamwork', 'Bilingual (AR/EN)'];
          const remaining = suggestions.filter((s) => !(form.key_skills ?? []).map((k) => k.toLowerCase()).includes(s.toLowerCase()));
          if (remaining.length === 0) return null;
          return (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-text-muted shrink-0">Quick add</span>
              {remaining.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => addSkill(s)}
                  className="px-3 py-1 rounded-full text-[11px] font-medium uppercase tracking-wider bg-surface text-accent-dark border border-accent/40 hover:bg-accent/10 hover:border-accent transition-colors"
                >
                  + {s}
                </button>
              ))}
            </div>
          );
        })()}
        {errors.key_skills && <p className="text-xs text-red-600">{errors.key_skills}</p>}
        {(form.key_skills?.length ?? 0) > 0 && (
          <div className="flex flex-wrap gap-2 bg-surface rounded-2xl p-4">
            {form.key_skills?.map((skill) => (
              <SkillTag key={skill} skill={skill} removable onRemove={removeSkill} size="md" />
            ))}
          </div>
        )}
      </div>

      {/* Section 05 — Resume */}
      <div className="bg-surface-lowest shadow-ambient rounded-2xl p-8 flex flex-col gap-4">
        <div className="flex items-center gap-4 border-l-2 border-primary/20 pl-4 mb-2">
          <span className="font-heading text-2xl italic text-secondary">05</span>
          <h2 className="font-heading text-xl text-primary">Resume</h2>
        </div>
        <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-text-muted -mt-2">
          Required <span className="text-primary">*</span> — PDF only, max 5 MB
        </p>

        {/* Dropzone */}
        <div
          className={`bg-surface rounded-2xl p-8 border-2 border-dashed text-center transition-colors ${
            uploadState === 'done'
              ? 'border-primary'
              : uploadState === 'error' || errors.resume
              ? 'border-red-400'
              : uploadState === 'uploading'
              ? 'border-primary/50'
              : 'border-border hover:border-primary/50'
          }`}
        >
          {uploadState === 'uploading' && resumeFile ? (
            /* Uploading — progress bar */
            <div className="flex flex-col items-center gap-3">
              <svg className="h-5 w-5 text-primary animate-pulse" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium text-text-main truncate max-w-xs">{resumeFile.name}</span>
              <div className="w-full max-w-xs">
                <div className="h-1.5 w-full bg-surface-lowest rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-200"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-[11px] text-text-muted mt-1.5 uppercase tracking-wider">{uploadProgress}% uploaded</p>
              </div>
            </div>
          ) : uploadState === 'done' && resumeFile ? (
            /* Done — success state */
            <div className="flex items-center justify-center gap-3">
              <svg className="h-5 w-5 text-primary flex-shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium text-text-main truncate max-w-xs">{resumeFile.name}</span>
              <button
                type="button"
                onClick={() => onFileSelect(null)}
                className="text-xs hover:opacity-70 text-text-muted flex-shrink-0"
              >
                Remove
              </button>
            </div>
          ) : (
            /* Idle / error — file picker */
            <label className="cursor-pointer">
              <div className="flex flex-col items-center gap-2">
                <svg className="h-8 w-8 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                </svg>
                <span className="text-sm font-medium text-text-main">
                  {uploadState === 'error' ? 'Try again — click to re-upload' : 'Click to upload PDF'}
                </span>
                <span className="text-xs text-text-muted">PDF only, max 5 MB</span>
              </div>
              <input
                type="file"
                accept=".pdf,application/pdf"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  onFileSelect(file);
                  // reset input so the same file can be re-selected after an error
                  e.target.value = '';
                }}
              />
            </label>
          )}
        </div>

        {errors.resume && <p className="text-xs text-red-600">{errors.resume}</p>}
      </div>
    </>
  );
}
