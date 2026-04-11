'use client';

import { MarkdownEditor } from '@/components/ui/MarkdownEditor';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { SkillTag } from '@/components/shared/SkillTag';
import { NOTICE_PERIODS, RELOCATION_PREFERENCES } from '@/lib/constants';
import type { CreateProfileRequest } from '@/lib/types';

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
  setResumeFile: (f: File | null) => void;
  setErrors: React.Dispatch<React.SetStateAction<FormErrors>>;
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
  setResumeFile,
  setErrors,
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
          placeholder="Tell employers about yourself, your experience, and what you're looking for. Markdown is supported."
          value={form.brief ?? ''}
          onChange={(val) => set('brief', val)}
          hint="Markdown formatting is rendered when employers view your profile."
        />
      </div>

      {/* Section 04 — Skills */}
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

      {/* Section 05 — Resume */}
      <div className="bg-surface-lowest shadow-ambient rounded-2xl p-8 flex flex-col gap-4">
        <div className="flex items-center gap-4 border-l-2 border-primary/20 pl-4 mb-2">
          <span className="font-heading text-2xl italic text-secondary">05</span>
          <h2 className="font-heading text-xl text-primary">Resume</h2>
        </div>
        <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-text-muted -mt-2">
          Required <span className="text-primary">*</span> — PDF only, max 5 MB
        </p>
        <div
          className={`bg-surface rounded-2xl p-8 border-2 border-dashed text-center transition-colors hover:border-primary/50 ${resumeFile ? 'border-primary' : errors.resume ? 'border-red-400' : 'border-border'}`}
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
                  PDF only, max 5 MB
                </span>
              </div>
              <input
                type="file"
                accept=".pdf,application/pdf"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setResumeFile(file);
                    setErrors((prev) => ({ ...prev, resume: undefined }));
                  }
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
