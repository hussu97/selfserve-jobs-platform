'use client';

import { useState } from 'react';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { SkillTag } from '@/components/shared/SkillTag';
import { COUNTRIES, EMPLOYMENT_STATUSES, NOTICE_PERIODS, POPULAR_SKILLS, RELOCATION_PREFERENCES } from '@/lib/constants';
import type { EmploymentStatus, NoticePeriod, ProfileFilters, RelocationPreference } from '@/lib/types';
import { cn } from '@/lib/utils';

interface ProfileFiltersProps {
  filters: ProfileFilters;
  onChange: (filters: ProfileFilters) => void;
  className?: string;
}

const SORT_OPTIONS = [
  { value: 'newest', label: 'Recommended' },
  { value: 'oldest', label: 'Oldest first' },
];

const EXPERIENCE_OPTIONS = [
  { value: '', label: 'Any experience' },
  { value: '0-2', label: '0–2 years' },
  { value: '3-5', label: '3–5 years' },
  { value: '6-10', label: '6–10 years' },
  { value: '10+', label: '10+ years' },
];

export function ProfileFilters({ filters, onChange, className }: ProfileFiltersProps) {
  const [skillInput, setSkillInput] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);

  const updateFilter = <K extends keyof ProfileFilters>(key: K, value: ProfileFilters[K]) => {
    onChange({ ...filters, [key]: value, page: 1 });
  };

  const setExperienceRange = (range: string) => {
    if (!range) {
      const next = { ...filters };
      delete next.min_experience;
      delete next.max_experience;
      onChange({ ...next, page: 1 });
      return;
    }
    if (range === '10+') {
      const next = { ...filters, min_experience: 10 };
      delete next.max_experience;
      onChange({ ...next, page: 1 });
      return;
    }
    const [min, max] = range.split('-').map(Number);
    onChange({ ...filters, min_experience: min, max_experience: max, page: 1 });
  };

  const getExperienceValue = () => {
    const { min_experience, max_experience } = filters;
    if (min_experience === undefined) return '';
    if (min_experience === 10) return '10+';
    return `${min_experience}-${max_experience}`;
  };

  const isImmediateAndOpenToWork =
    (filters.employment_status ?? []).includes('open_to_work') &&
    (filters.notice_period ?? []).includes('immediate');

  const toggleImmediateAndOpenToWork = () => {
    if (isImmediateAndOpenToWork) {
      const newStatus = (filters.employment_status ?? []).filter((s) => s !== 'open_to_work');
      const newNotice = (filters.notice_period ?? []).filter((n) => n !== 'immediate');
      onChange({
        ...filters,
        employment_status: newStatus.length ? newStatus : undefined,
        notice_period: newNotice.length ? newNotice : undefined,
        page: 1,
      });
    } else {
      const newStatus = [...new Set([...(filters.employment_status ?? []), 'open_to_work' as EmploymentStatus])];
      const newNotice = [...new Set([...(filters.notice_period ?? []), 'immediate' as NoticePeriod])];
      onChange({ ...filters, employment_status: newStatus, notice_period: newNotice, page: 1 });
    }
  };

  const toggleEmploymentStatus = (status: EmploymentStatus) => {
    const current = filters.employment_status ?? [];
    const updated = current.includes(status)
      ? current.filter((s) => s !== status)
      : [...current, status];
    updateFilter('employment_status', updated.length ? updated : undefined);
  };

  const toggleNoticePeriod = (period: NoticePeriod) => {
    const current = filters.notice_period ?? [];
    const updated = current.includes(period)
      ? current.filter((p) => p !== period)
      : [...current, period];
    updateFilter('notice_period', updated.length ? updated : undefined);
  };

  const addSkill = (skill: string) => {
    const trimmed = skill.trim();
    if (!trimmed) return;
    const current = filters.skills ?? [];
    if (!current.includes(trimmed)) {
      updateFilter('skills', [...current, trimmed]);
    }
    setSkillInput('');
  };

  const removeSkill = (skill: string) => {
    const updated = (filters.skills ?? []).filter((s) => s !== skill);
    updateFilter('skills', updated.length ? updated : undefined);
  };

  const clearAll = () => {
    onChange({ page: 1 });
  };

  const hasActiveFilters =
    !!filters.country ||
    !!filters.relocation_preference ||
    filters.min_experience !== undefined ||
    (filters.skills?.length ?? 0) > 0 ||
    (filters.employment_status?.length ?? 0) > 0 ||
    (filters.notice_period?.length ?? 0) > 0;

  const filterContent = (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-lg text-primary">
          Filters
        </h2>
        {hasActiveFilters && (
          <button
            onClick={clearAll}
            className="text-xs font-medium cursor-pointer hover:opacity-70 text-primary rounded-full px-3 py-1 bg-surface"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Immediate & Open to Work — quick filter */}
      <button
        type="button"
        onClick={toggleImmediateAndOpenToWork}
        className={cn(
          'w-full rounded-full px-4 py-2.5 text-left transition-colors cursor-pointer',
          isImmediateAndOpenToWork
            ? 'bg-primary text-white'
            : 'bg-surface text-text-main hover:bg-primary/10'
        )}
      >
        <span className="block text-sm font-semibold">Immediate &amp; Open to Work</span>
        <span className={cn('block text-xs mt-0.5', isImmediateAndOpenToWork ? 'text-white/70' : 'text-text-muted')}>
          Available to start right away
        </span>
      </button>

      <Select
        label="Sort by"
        options={SORT_OPTIONS}
        value={filters.sort ?? 'newest'}
        onChange={(e) => updateFilter('sort', e.target.value as ProfileFilters['sort'])}
      />

      <Select
        label="Country"
        placeholder="All countries"
        options={COUNTRIES}
        value={filters.country ?? ''}
        onChange={(e) => updateFilter('country', e.target.value || undefined)}
      />

      <Select
        label="Experience"
        options={EXPERIENCE_OPTIONS}
        value={getExperienceValue()}
        onChange={(e) => setExperienceRange(e.target.value)}
      />

      {/* Relocation */}
      <div className="flex flex-col gap-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-text-muted">
          Relocation
        </p>
        <div className="flex flex-col gap-1.5">
          {RELOCATION_PREFERENCES.map((rp) => (
            <label key={rp.value} className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="radio"
                name="relocation"
                value={rp.value}
                checked={filters.relocation_preference === rp.value}
                onChange={() => updateFilter('relocation_preference', rp.value as RelocationPreference)}
                className="cursor-pointer"
              />
              <span className="text-sm group-hover:text-primary transition-colors text-text-main">
                {rp.label}
              </span>
            </label>
          ))}
          {filters.relocation_preference && (
            <button
              onClick={() => updateFilter('relocation_preference', undefined)}
              className="text-xs text-left cursor-pointer hover:opacity-70 text-text-muted"
            >
              Clear selection
            </button>
          )}
        </div>
      </div>

      {/* Employment Status */}
      <div className="flex flex-col gap-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-text-muted">
          Employment status
        </p>
        <div className="flex flex-col gap-1.5">
          {EMPLOYMENT_STATUSES.map((es) => (
            <label
              key={es.value}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <input
                type="checkbox"
                checked={(filters.employment_status ?? []).includes(es.value)}
                onChange={() => toggleEmploymentStatus(es.value)}
                className="rounded text-primary focus:ring-primary cursor-pointer"
              />
              <span className="text-sm group-hover:text-primary transition-colors text-text-main">
                {es.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Notice Period */}
      <div className="flex flex-col gap-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-text-muted">
          Notice period
        </p>
        <div className="flex flex-col gap-1.5">
          {NOTICE_PERIODS.map((np) => (
            <label
              key={np.value}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <input
                type="checkbox"
                checked={(filters.notice_period ?? []).includes(np.value)}
                onChange={() => toggleNoticePeriod(np.value)}
                className="rounded text-primary focus:ring-primary cursor-pointer"
              />
              <span className="text-sm group-hover:text-primary transition-colors text-text-main">
                {np.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Skills */}
      <div className="flex flex-col gap-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-text-muted">
          Skills
        </p>
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
          placeholder="Type and press Enter"
          className="w-full rounded-xl bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary text-text-main"
        />
        {(filters.skills?.length ?? 0) > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {filters.skills?.map((skill) => (
              <SkillTag key={skill} skill={skill} removable onRemove={removeSkill} />
            ))}
          </div>
        )}
        <div className="flex flex-wrap gap-1.5 mt-1">
          {POPULAR_SKILLS.slice(0, 8)
            .filter((s) => !(filters.skills ?? []).includes(s))
            .map((skill) => (
              <button
                key={skill}
                type="button"
                onClick={() => addSkill(skill)}
                className="text-xs px-2.5 py-0.5 rounded-full uppercase tracking-wider bg-surface hover:bg-accent/10 transition-colors cursor-pointer text-text-muted"
              >
                {skill}
              </button>
            ))}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className={cn('lg:hidden', className)}>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="w-full justify-between rounded-full"
        >
          <span>Filters {hasActiveFilters && '(active)'}</span>
          <svg
            className={cn('h-4 w-4 transition-transform', mobileOpen && 'rotate-180')}
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
          </svg>
        </Button>
        {mobileOpen && (
          <div className="mt-3 bg-surface-lowest rounded-2xl shadow-ambient p-5">
            {filterContent}
          </div>
        )}
      </div>

      <div
        className={cn('hidden lg:block sticky top-24 bg-surface-lowest shadow-ambient rounded-2xl p-5', className)}
      >
        {filterContent}
      </div>
    </>
  );
}
