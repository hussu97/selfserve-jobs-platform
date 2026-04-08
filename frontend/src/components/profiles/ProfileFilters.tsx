'use client';

import { useState } from 'react';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { SkillTag } from '@/components/shared/SkillTag';
import { COUNTRIES, POPULAR_SKILLS, RELOCATION_PREFERENCES } from '@/lib/constants';
import type { ProfileFilters, RelocationPreference } from '@/lib/types';
import { cn } from '@/lib/utils';

interface ProfileFiltersProps {
  filters: ProfileFilters;
  onChange: (filters: ProfileFilters) => void;
  className?: string;
}

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
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
      const { min_experience: _min, max_experience: _max, ...rest } = filters;
      onChange({ ...rest, page: 1 });
      return;
    }
    if (range === '10+') {
      updateFilter('min_experience', 10);
      const { max_experience: _max, ...rest } = { ...filters, min_experience: 10 };
      onChange({ ...rest, page: 1 });
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
    (filters.skills?.length ?? 0) > 0;

  const FilterContent = () => (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-sm uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>
          Filters
        </h2>
        {hasActiveFilters && (
          <button
            onClick={clearAll}
            className="text-xs font-medium cursor-pointer hover:opacity-70"
            style={{ color: 'var(--color-primary)' }}
          >
            Clear all
          </button>
        )}
      </div>

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
        <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
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
                style={{ accentColor: '#C2703E' }}
              />
              <span className="text-sm group-hover:text-[#C2703E] transition-colors" style={{ color: 'var(--color-text)' }}>
                {rp.label}
              </span>
            </label>
          ))}
          {filters.relocation_preference && (
            <button
              onClick={() => updateFilter('relocation_preference', undefined)}
              className="text-xs text-left cursor-pointer hover:opacity-70"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Clear selection
            </button>
          )}
        </div>
      </div>

      {/* Skills */}
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
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
          className="w-full rounded-lg border border-[#DDD5C8] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C2703E] focus:border-transparent"
          style={{ color: 'var(--color-text)' }}
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
                className="text-xs px-2 py-0.5 rounded-full border border-dashed border-[#DDD5C8] hover:border-[#8BA888] hover:bg-[#8BA888]/10 transition-colors cursor-pointer"
                style={{ color: 'var(--color-text-muted)' }}
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
          className="w-full justify-between"
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
          <div
            className="mt-3 rounded-xl border p-5"
            style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
          >
            <FilterContent />
          </div>
        )}
      </div>

      <div
        className={cn('hidden lg:block sticky top-24 rounded-xl border p-5', className)}
        style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
      >
        <FilterContent />
      </div>
    </>
  );
}
