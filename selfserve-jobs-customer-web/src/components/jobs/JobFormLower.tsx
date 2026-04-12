'use client';

import { Input } from '@/components/ui/Input';
import { MarkdownEditor } from '@/components/ui/MarkdownEditor';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { SkillTag } from '@/components/shared/SkillTag';
import type { CreateJobRequest, SalaryCurrency } from '@/lib/types';

type FormErrors = Partial<Record<keyof CreateJobRequest | 'general' | 'salary', string>>;

const SALARY_CURRENCIES: { value: SalaryCurrency; label: string }[] = [
  { value: 'AED', label: 'AED — UAE Dirham' },
  { value: 'USD', label: 'USD — US Dollar' },
  { value: 'EUR', label: 'EUR — Euro' },
  { value: 'GBP', label: 'GBP — British Pound' },
  { value: 'INR', label: 'INR — Indian Rupee' },
  { value: 'SAR', label: 'SAR — Saudi Riyal' },
  { value: 'QAR', label: 'QAR — Qatari Riyal' },
  { value: 'BHD', label: 'BHD — Bahraini Dinar' },
  { value: 'KWD', label: 'KWD — Kuwaiti Dinar' },
  { value: 'OMR', label: 'OMR — Omani Rial' },
  { value: 'EGP', label: 'EGP — Egyptian Pound' },
];

interface JobFormLowerProps {
  form: Partial<CreateJobRequest>;
  errors: FormErrors;
  set: <K extends keyof CreateJobRequest>(key: K, value: CreateJobRequest[K]) => void;
  blurField: (key: keyof CreateJobRequest | 'salary') => void;
  skillInput: string;
  setSkillInput: (v: string) => void;
  addSkill: (s: string) => void;
  removeSkill: (s: string) => void;
}

export default function JobFormLower({
  form,
  errors,
  set,
  blurField,
  skillInput,
  setSkillInput,
  addSkill,
  removeSkill,
}: JobFormLowerProps) {
  return (
    <>
      {/* Section 02 — Description */}
      <div className="bg-surface-lowest shadow-ambient rounded-2xl p-8 flex flex-col gap-4">
        <div className="flex items-center gap-4 border-l-2 border-primary/20 pl-4 mb-2">
          <span className="font-heading text-2xl italic text-secondary">02</span>
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

      {/* Section 03 — Skills */}
      <div className="bg-surface-lowest shadow-ambient rounded-2xl p-8 flex flex-col gap-4">
        <div className="flex items-center gap-4 border-l-2 border-primary/20 pl-4 mb-2">
          <span className="font-heading text-2xl italic text-secondary">03</span>
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
        {(() => {
          const suggestions = ['Project Management', 'Communication', 'Sales', 'Customer Service', 'Leadership', 'Data Analysis', 'Business Development', 'Financial Analysis', 'Operations Management', 'Marketing', 'Account Management', 'Negotiation', 'Strategic Planning', 'Microsoft Excel', 'Supply Chain Management'];
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

      {/* Section 04 — Salary (Optional) */}
      <div className="bg-surface-lowest shadow-ambient rounded-2xl p-8 flex flex-col gap-4">
        <div className="flex items-center gap-4 border-l-2 border-primary/20 pl-4 mb-2">
          <span className="font-heading text-2xl italic text-secondary">04</span>
          <div>
            <h2 className="font-heading text-xl text-primary">Salary Range</h2>
            <p className="text-xs text-text-muted mt-0.5">Optional — listings with salary ranges get more applications</p>
          </div>
        </div>
        {errors.salary && <p className="text-xs text-red-600">{errors.salary}</p>}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs uppercase tracking-[0.1em] text-text-muted mb-2">Currency</label>
            <select
              value={form.salary_currency ?? ''}
              onChange={(e) => set('salary_currency', (e.target.value || undefined) as SalaryCurrency | undefined)}
              onBlur={() => blurField('salary')}
              className="w-full bg-surface rounded-xl px-3 py-2.5 text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Select…</option>
              {SALARY_CURRENCIES.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs uppercase tracking-[0.1em] text-text-muted mb-2">Min / Month</label>
            <input
              type="number"
              min={0}
              step={500}
              value={form.salary_min ?? ''}
              onChange={(e) => set('salary_min', e.target.value ? Number(e.target.value) : undefined)}
              onBlur={() => blurField('salary')}
              placeholder="e.g. 15000"
              className="w-full bg-surface rounded-xl px-3 py-2.5 text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-[0.1em] text-text-muted mb-2">Max / Month</label>
            <input
              type="number"
              min={0}
              step={500}
              value={form.salary_max ?? ''}
              onChange={(e) => set('salary_max', e.target.value ? Number(e.target.value) : undefined)}
              onBlur={() => blurField('salary')}
              placeholder="e.g. 25000"
              className="w-full bg-surface rounded-xl px-3 py-2.5 text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
      </div>

      {/* Section 05 — How to Apply */}
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
            onBlur={() => blurField('contact_email')}
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
            onBlur={() => blurField('contact_url')}
            error={errors.contact_url}
            required
          />
        )}
      </div>
    </>
  );
}
