'use client';

import { useState } from 'react';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { SkillTag } from '@/components/shared/SkillTag';
import { COUNTRIES, EMPLOYMENT_TYPES, POPULAR_SKILLS } from '@/lib/constants';
import type { JobFilters, EmploymentType } from '@/lib/types';
import { cn } from '@/lib/utils';

interface JobFiltersProps {
  filters: JobFilters;
  onChange: (filters: JobFilters) => void;
  className?: string;
}

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'deadline', label: 'By deadline' },
];

export function JobFilters({ filters, onChange, className }: JobFiltersProps) {
  const [skillInput, setSkillInput] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);

  const updateFilter = <K extends keyof JobFilters>(key: K, value: JobFilters[K]) => {
    onChange({ ...filters, [key]: value, page: 1 });
  };

  const toggleEmploymentType = (type: EmploymentType) => {
    const current = filters.employment_type ?? [];
    const updated = current.includes(type)
      ? current.filter((t) => t !== type)
      : [...current, type];
    updateFilter('employment_type', updated.length ? updated : undefined);
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
    const current = filters.skills ?? [];
    updateFilter('skills', current.filter((s) => s !== skill).length ? current.filter((s) => s !== skill) : undefined);
  };

  const clearAll = () => {
    onChange({ page: 1 });
  };

  const hasActiveFilters =
    !!filters.country ||
    (filters.employment_type?.length ?? 0) > 0 ||
    (filters.skills?.length ?? 0) > 0;

  const filterContent = (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-sm uppercase tracking-wide text-text-muted">
          Filters
        </h2>
        {hasActiveFilters && (
          <button
            onClick={clearAll}
            className="text-xs font-medium cursor-pointer hover:opacity-70 text-primary"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Sort */}
      <Select
        label="Sort by"
        options={SORT_OPTIONS}
        value={filters.sort ?? 'newest'}
        onChange={(e) => updateFilter('sort', e.target.value as JobFilters['sort'])}
      />

      {/* Country */}
      <Select
        label="Country"
        placeholder="All countries"
        options={COUNTRIES}
        value={filters.country ?? ''}
        onChange={(e) => updateFilter('country', e.target.value || undefined)}
      />

      {/* Employment Type */}
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-text-main">
          Employment type
        </p>
        <div className="flex flex-col gap-1.5">
          {EMPLOYMENT_TYPES.map((et) => (
            <label
              key={et.value}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <input
                type="checkbox"
                checked={(filters.employment_type ?? []).includes(et.value)}
                onChange={() => toggleEmploymentType(et.value)}
                className="rounded border-border text-primary focus:ring-primary cursor-pointer"
              />
              <span className="text-sm group-hover:text-primary transition-colors text-text-main">
                {et.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Skills */}
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-text-main">
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
          className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-text-main"
        />
        {/* Active skill filters */}
        {(filters.skills?.length ?? 0) > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {filters.skills?.map((skill) => (
              <SkillTag
                key={skill}
                skill={skill}
                removable
                onRemove={removeSkill}
              />
            ))}
          </div>
        )}
        {/* Suggestions */}
        <div className="flex flex-wrap gap-1.5 mt-1">
          {POPULAR_SKILLS.slice(0, 8)
            .filter((s) => !(filters.skills ?? []).includes(s))
            .map((skill) => (
              <button
                key={skill}
                type="button"
                onClick={() => addSkill(skill)}
                className="text-xs px-2 py-0.5 rounded-full border border-dashed border-border hover:border-accent hover:bg-accent/10 transition-colors cursor-pointer text-text-muted"
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
      {/* Mobile toggle */}
      <div className={cn('lg:hidden', className)}>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="w-full justify-between"
        >
          <span>Filters {hasActiveFilters && `(active)`}</span>
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
          <div className="mt-3 rounded-xl border border-border bg-surface p-5">
            {filterContent}
          </div>
        )}
      </div>

      {/* Desktop sidebar */}
      <div
        className={cn(
          'hidden lg:block sticky top-24 rounded-xl border border-border bg-surface p-5',
          className
        )}
      >
        {filterContent}
      </div>
    </>
  );
}
