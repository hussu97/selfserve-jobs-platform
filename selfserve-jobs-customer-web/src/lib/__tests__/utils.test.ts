import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  formatDate,
  timeAgo,
  formatDeadline,
  getEmploymentTypeLabel,
  getNoticePeriodLabel,
  getRelocationLabel,
  getCountryLabel,
  slugify,
  truncate,
  cn,
  buildQueryString,
  formatExperience,
} from '../utils';

describe('formatDate', () => {
  it('formats a date string into a human-readable date', () => {
    const result = formatDate('2024-01-15T00:00:00Z');
    expect(result).toMatch(/January/);
    expect(result).toMatch(/2024/);
  });
});

describe('timeAgo', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "Today" for the same day', () => {
    expect(timeAgo('2024-06-15T08:00:00Z')).toBe('Today');
  });

  it('returns "Yesterday" for 1 day ago', () => {
    expect(timeAgo('2024-06-14T12:00:00Z')).toBe('Yesterday');
  });

  it('returns days ago for 2-6 days', () => {
    expect(timeAgo('2024-06-10T12:00:00Z')).toBe('5 days ago');
  });

  it('returns "1 week ago" for 7-13 days', () => {
    expect(timeAgo('2024-06-08T12:00:00Z')).toBe('1 week ago');
  });

  it('returns weeks ago for 14-29 days', () => {
    expect(timeAgo('2024-05-25T12:00:00Z')).toBe('3 weeks ago');
  });

  it('returns "1 month ago" for 30-59 days', () => {
    expect(timeAgo('2024-05-15T12:00:00Z')).toBe('1 month ago');
  });

  it('returns months ago for 60-364 days', () => {
    expect(timeAgo('2024-01-15T12:00:00Z')).toBe('5 months ago');
  });

  it('returns years ago for 365+ days', () => {
    expect(timeAgo('2023-01-15T12:00:00Z')).toBe('1 years ago');
  });
});

describe('formatDeadline', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "Expired" for past dates', () => {
    expect(formatDeadline('2024-06-10T12:00:00Z')).toBe('Expired');
  });

  it('returns "Today" for today', () => {
    // diffDays = ceil(diffMs / msPerDay). When deadline equals now, diffMs=0, ceil(0)=0 → "Today"
    expect(formatDeadline('2024-06-15T12:00:00Z')).toBe('Today');
  });

  it('returns "Tomorrow" for 1 day ahead', () => {
    expect(formatDeadline('2024-06-16T12:00:00Z')).toBe('Tomorrow');
  });

  it('returns days left for 2-6 days ahead', () => {
    expect(formatDeadline('2024-06-19T12:00:00Z')).toBe('4 days left');
  });

  it('returns weeks left for 7-29 days ahead', () => {
    expect(formatDeadline('2024-06-29T12:00:00Z')).toBe('2 weeks left');
  });
});

describe('getEmploymentTypeLabel', () => {
  it('returns label for full_time', () => {
    expect(getEmploymentTypeLabel('full_time')).toBe('Full-time');
  });

  it('returns label for contract', () => {
    expect(getEmploymentTypeLabel('contract')).toBe('Contract');
  });

  it('returns label for remote', () => {
    expect(getEmploymentTypeLabel('remote')).toBe('Remote');
  });

  it('returns raw value if not found', () => {
    expect(getEmploymentTypeLabel('unknown' as never)).toBe('unknown');
  });
});

describe('getNoticePeriodLabel', () => {
  it('returns label for immediate', () => {
    expect(getNoticePeriodLabel('immediate')).toBe('Immediate');
  });

  it('returns label for 1_month', () => {
    expect(getNoticePeriodLabel('1_month')).toBe('1 Month');
  });

  it('returns label for 3_months', () => {
    expect(getNoticePeriodLabel('3_months')).toBe('3 Months');
  });
});

describe('getRelocationLabel', () => {
  it('returns label for yes', () => {
    expect(getRelocationLabel('yes')).toBe('Open to relocation');
  });

  it('returns label for no', () => {
    expect(getRelocationLabel('no')).toBe('Not relocating');
  });

  it('returns label for open', () => {
    expect(getRelocationLabel('open')).toBe('Open to discussing');
  });
});

describe('getCountryLabel', () => {
  it('returns label for US', () => {
    expect(getCountryLabel('US')).toBe('United States');
  });

  it('returns label for GB', () => {
    expect(getCountryLabel('GB')).toBe('United Kingdom');
  });

  it('returns raw code if not found', () => {
    expect(getCountryLabel('XX')).toBe('XX');
  });
});

describe('slugify', () => {
  it('lowercases and replaces spaces with hyphens', () => {
    expect(slugify('Hello World')).toBe('hello-world');
  });

  it('removes special characters', () => {
    expect(slugify('Hello, World!')).toBe('hello-world');
  });

  it('collapses multiple spaces/hyphens', () => {
    expect(slugify('hello   world')).toBe('hello-world');
  });

  it('trims leading and trailing hyphens', () => {
    expect(slugify('  hello  ')).toBe('hello');
  });

  it('handles an empty string', () => {
    expect(slugify('')).toBe('');
  });
});

describe('truncate', () => {
  it('returns full text when shorter than limit', () => {
    expect(truncate('Hello', 10)).toBe('Hello');
  });

  it('returns full text when exactly at limit', () => {
    expect(truncate('Hello', 5)).toBe('Hello');
  });

  it('truncates text longer than limit and appends ellipsis', () => {
    const result = truncate('Hello, World!', 5);
    expect(result).toBe('Hello…');
  });
});

describe('cn', () => {
  it('joins class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('filters out falsy values', () => {
    expect(cn('foo', null, undefined, false, 'bar')).toBe('foo bar');
  });

  it('returns empty string when all falsy', () => {
    expect(cn(null, undefined, false)).toBe('');
  });
});

describe('buildQueryString', () => {
  it('returns empty string for empty params', () => {
    expect(buildQueryString({})).toBe('');
  });

  it('returns empty string when all values are null/undefined', () => {
    expect(buildQueryString({ a: null, b: undefined })).toBe('');
  });

  it('builds a simple query string', () => {
    const qs = buildQueryString({ page: 1, per_page: 12 });
    expect(qs).toBe('?page=1&per_page=12');
  });

  it('handles array values by appending multiple entries', () => {
    const qs = buildQueryString({ skills: ['React', 'TypeScript'] });
    expect(qs).toBe('?skills=React&skills=TypeScript');
  });

  it('skips empty string values', () => {
    const qs = buildQueryString({ search: '', page: 2 });
    expect(qs).toBe('?page=2');
  });

  it('handles boolean values', () => {
    const qs = buildQueryString({ active: true });
    expect(qs).toBe('?active=true');
  });
});

describe('formatExperience', () => {
  it('returns "Entry level" for 0 years', () => {
    expect(formatExperience(0)).toBe('Entry level');
  });

  it('returns "1 year" for 1 year', () => {
    expect(formatExperience(1)).toBe('1 year');
  });

  it('returns plural years for 2+', () => {
    expect(formatExperience(5)).toBe('5 years');
  });
});
