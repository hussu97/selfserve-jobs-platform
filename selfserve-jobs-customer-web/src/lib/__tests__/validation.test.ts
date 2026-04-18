import { describe, it, expect } from 'vitest';
import { validateJobForm, isJobFormValid, validateProfileForm, isProfileFormValid } from '../validation';
import type { CreateJobRequest, CreateProfileRequest } from '../types';

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

const validJob: CreateJobRequest = {
  job_title: 'Software Engineer',
  company_name: 'Acme Corp',
  company_city: 'London',
  company_country: 'United Kingdom',
  employment_type: 'full_time',
  description: 'A great opportunity.',
  key_skills: ['Python'],
  contact_method: 'email',
  contact_email: 'hiring@acme.com',
};

const validProfile: CreateProfileRequest = {
  person_name: 'Jane Smith',
  email: 'jane@example.com',
  current_title: 'Senior Engineer',
  current_city: 'Manchester',
  current_country: 'United Kingdom',
  brief: 'Experienced software engineer.',
  key_skills: ['Python'],
  years_of_experience: 8,
  notice_period: 'immediate',
  relocation_preference: 'open',
  current_employment_status: 'full_time',
};

// ---------------------------------------------------------------------------
// validateJobForm — required fields
// ---------------------------------------------------------------------------

describe('validateJobForm — required fields', () => {
  it('returns no errors for a fully valid payload', () => {
    expect(validateJobForm(validJob)).toEqual({});
  });

  it('flags missing job_title', () => {
    const errs = validateJobForm({ ...validJob, job_title: '' });
    expect(errs.job_title).toBeTruthy();
  });

  it('flags missing company_name', () => {
    const errs = validateJobForm({ ...validJob, company_name: '' });
    expect(errs.company_name).toBeTruthy();
  });

  it('flags missing company_city', () => {
    const errs = validateJobForm({ ...validJob, company_city: '   ' });
    expect(errs.company_city).toBeTruthy();
  });

  it('flags missing company_country', () => {
    const errs = validateJobForm({ ...validJob, company_country: '' });
    expect(errs.company_country).toBeTruthy();
  });

  it('flags missing description', () => {
    const errs = validateJobForm({ ...validJob, description: '' });
    expect(errs.description).toBeTruthy();
  });

  it('flags empty key_skills array', () => {
    const errs = validateJobForm({ ...validJob, key_skills: [] });
    expect(errs.key_skills).toBeTruthy();
  });

  it('flags missing key_skills when undefined', () => {
    const { key_skills: _, ...rest } = validJob;
    const errs = validateJobForm(rest);
    expect(errs.key_skills).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// validateJobForm — contact method
// ---------------------------------------------------------------------------

describe('validateJobForm — contact method', () => {
  it('flags missing contact_email when method is email', () => {
    const errs = validateJobForm({ ...validJob, contact_method: 'email', contact_email: '' });
    expect(errs.contact_email).toBeTruthy();
  });

  it('does not flag contact_email when method is url', () => {
    const errs = validateJobForm({
      ...validJob,
      contact_method: 'url',
      contact_email: undefined,
      contact_url: 'https://apply.example.com',
    });
    expect(errs.contact_email).toBeUndefined();
  });

  it('flags missing contact_url when method is url', () => {
    const errs = validateJobForm({
      ...validJob,
      contact_method: 'url',
      contact_url: '',
    });
    expect(errs.contact_url).toBeTruthy();
  });

  it('does not flag contact_url when method is email', () => {
    const errs = validateJobForm({ ...validJob, contact_method: 'email', contact_url: undefined });
    expect(errs.contact_url).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// validateJobForm — salary validation
// ---------------------------------------------------------------------------

describe('validateJobForm — salary', () => {
  it('no error when salary fields are all absent', () => {
    const errs = validateJobForm({ ...validJob, salary_min: undefined, salary_max: undefined, salary_currency: undefined });
    expect(errs.salary).toBeUndefined();
  });

  it('flags missing currency when salary_min is set', () => {
    const errs = validateJobForm({ ...validJob, salary_min: 5000, salary_currency: undefined });
    expect(errs.salary).toMatch(/currency/i);
  });

  it('flags missing currency when salary_max is set', () => {
    const errs = validateJobForm({ ...validJob, salary_max: 10000, salary_currency: undefined });
    expect(errs.salary).toMatch(/currency/i);
  });

  it('no salary error when both min and max set with currency', () => {
    const errs = validateJobForm({
      ...validJob,
      salary_min: 5000,
      salary_max: 10000,
      salary_currency: 'AED',
    });
    expect(errs.salary).toBeUndefined();
  });

  it('flags salary_min > salary_max', () => {
    const errs = validateJobForm({
      ...validJob,
      salary_min: 10000,
      salary_max: 5000,
      salary_currency: 'AED',
    });
    expect(errs.salary).toMatch(/minimum/i);
  });

  it('no error when salary_min === salary_max', () => {
    const errs = validateJobForm({
      ...validJob,
      salary_min: 5000,
      salary_max: 5000,
      salary_currency: 'USD',
    });
    expect(errs.salary).toBeUndefined();
  });

  it('does not require currency when salary values are 0', () => {
    // 0 or null is treated as "not set"
    const errs = validateJobForm({ ...validJob, salary_min: 0, salary_max: 0, salary_currency: undefined });
    expect(errs.salary).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// isJobFormValid
// ---------------------------------------------------------------------------

describe('isJobFormValid', () => {
  it('returns true for a valid payload', () => {
    expect(isJobFormValid(validJob)).toBe(true);
  });

  it('returns false when required field is missing', () => {
    expect(isJobFormValid({ ...validJob, job_title: '' })).toBe(false);
  });

  it('returns false on salary_min > salary_max', () => {
    expect(isJobFormValid({ ...validJob, salary_min: 100, salary_max: 50, salary_currency: 'AED' })).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// validateProfileForm — required fields
// ---------------------------------------------------------------------------

describe('validateProfileForm — required fields', () => {
  it('returns no errors for a valid payload', () => {
    expect(validateProfileForm(validProfile)).toEqual({});
  });

  it('flags missing person_name', () => {
    const errs = validateProfileForm({ ...validProfile, person_name: '' });
    expect(errs.person_name).toBeTruthy();
  });

  it('flags missing email', () => {
    const errs = validateProfileForm({ ...validProfile, email: '' });
    expect(errs.email).toBeTruthy();
  });

  it('flags missing current_title', () => {
    const errs = validateProfileForm({ ...validProfile, current_title: '   ' });
    expect(errs.current_title).toBeTruthy();
  });

  it('flags missing current_city', () => {
    const errs = validateProfileForm({ ...validProfile, current_city: '' });
    expect(errs.current_city).toBeTruthy();
  });

  it('flags missing current_country', () => {
    const errs = validateProfileForm({ ...validProfile, current_country: '' });
    expect(errs.current_country).toBeTruthy();
  });

  it('flags missing brief', () => {
    const errs = validateProfileForm({ ...validProfile, brief: '' });
    expect(errs.brief).toBeTruthy();
  });

  it('flags empty key_skills', () => {
    const errs = validateProfileForm({ ...validProfile, key_skills: [] });
    expect(errs.key_skills).toBeTruthy();
  });

  it('flags negative years_of_experience', () => {
    const errs = validateProfileForm({ ...validProfile, years_of_experience: -1 });
    expect(errs.years_of_experience).toBeTruthy();
  });

  it('flags missing years_of_experience (undefined)', () => {
    const { years_of_experience: _, ...rest } = validProfile;
    const errs = validateProfileForm(rest);
    expect(errs.years_of_experience).toBeTruthy();
  });

  it('accepts zero years_of_experience (entry level)', () => {
    const errs = validateProfileForm({ ...validProfile, years_of_experience: 0 });
    expect(errs.years_of_experience).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// isProfileFormValid
// ---------------------------------------------------------------------------

describe('isProfileFormValid', () => {
  it('returns true for a valid payload', () => {
    expect(isProfileFormValid(validProfile)).toBe(true);
  });

  it('returns false when required field is missing', () => {
    expect(isProfileFormValid({ ...validProfile, email: '' })).toBe(false);
  });
});
