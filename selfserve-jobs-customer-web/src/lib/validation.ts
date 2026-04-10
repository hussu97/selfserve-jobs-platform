/**
 * Pure validation functions for job and profile form fields.
 * Extracted from form components so they can be unit-tested without
 * rendering the full component tree.
 */

import type { CreateJobRequest, CreateProfileRequest } from './types';

export type JobFormErrors = Partial<
  Record<keyof CreateJobRequest | 'general' | 'salary', string>
>;

export type ProfileFormErrors = Partial<
  Record<keyof CreateProfileRequest | 'general', string>
>;

/**
 * Validate a partial job form payload.
 * Returns an error map; empty map means the form is valid.
 */
export function validateJobForm(form: Partial<CreateJobRequest>): JobFormErrors {
  const errs: JobFormErrors = {};

  if (!form.job_title?.trim()) errs.job_title = 'Job title is required';
  if (!form.company_name?.trim()) errs.company_name = 'Company name is required';
  if (!form.company_city?.trim()) errs.company_city = 'City is required';
  if (!form.company_country) errs.company_country = 'Country is required';
  if (!form.description?.trim()) errs.description = 'Description is required';
  if ((form.key_skills?.length ?? 0) === 0) errs.key_skills = 'At least one skill is required';

  if (form.contact_method === 'email' && !form.contact_email?.trim()) {
    errs.contact_email = 'Contact email is required';
  }
  if (form.contact_method === 'url' && !form.contact_url?.trim()) {
    errs.contact_url = 'Application URL is required';
  }

  const hasMin = form.salary_min != null && form.salary_min > 0;
  const hasMax = form.salary_max != null && form.salary_max > 0;
  if ((hasMin || hasMax) && !form.salary_currency) {
    errs.salary = 'Currency is required when specifying salary';
  }
  if (hasMin && hasMax && form.salary_min! > form.salary_max!) {
    errs.salary = 'Minimum salary cannot exceed maximum';
  }

  return errs;
}

/** Returns true when the form is valid (no errors). */
export function isJobFormValid(form: Partial<CreateJobRequest>): boolean {
  return Object.keys(validateJobForm(form)).length === 0;
}

/**
 * Validate a partial profile form payload.
 * Returns an error map; empty map means the form is valid.
 */
export function validateProfileForm(form: Partial<CreateProfileRequest>): ProfileFormErrors {
  const errs: ProfileFormErrors = {};

  if (!form.person_name?.trim()) errs.person_name = 'Full name is required';
  if (!form.email?.trim()) errs.email = 'Email is required';
  if (!form.current_title?.trim()) errs.current_title = 'Current title is required';
  if (!form.current_city?.trim()) errs.current_city = 'City is required';
  if (!form.current_country?.trim()) errs.current_country = 'Country is required';
  if (!form.brief?.trim()) errs.brief = 'Professional brief is required';
  if ((form.key_skills?.length ?? 0) === 0) errs.key_skills = 'At least one skill is required';
  if (form.years_of_experience == null || form.years_of_experience < 0) {
    errs.years_of_experience = 'Years of experience is required';
  }
  if (!form.notice_period) errs.notice_period = 'Notice period is required';
  if (!form.relocation_preference) errs.relocation_preference = 'Relocation preference is required';

  return errs;
}

/** Returns true when the profile form is valid (no errors). */
export function isProfileFormValid(form: Partial<CreateProfileRequest>): boolean {
  return Object.keys(validateProfileForm(form)).length === 0;
}
