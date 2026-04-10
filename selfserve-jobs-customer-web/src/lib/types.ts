export type EmploymentType =
  | 'full_time'
  | 'part_time'
  | 'contract'
  | 'consulting'
  | 'freelance'
  | 'internship'
  | 'remote';

export type ContactMethod = 'email' | 'url';

export type NoticePeriod =
  | 'immediate'
  | '1_week'
  | '2_weeks'
  | '1_month'
  | '3_months'
  | '6_months';

export type RelocationPreference = 'yes' | 'no' | 'open';

export type EntityType = 'job' | 'profile';

export type ReportReason =
  | 'spam'
  | 'inappropriate'
  | 'misleading'
  | 'duplicate'
  | 'other';

export type SalaryCurrency = 'AED' | 'USD' | 'EUR' | 'GBP' | 'INR' | 'SAR' | 'QAR' | 'BHD' | 'KWD' | 'OMR' | 'EGP';

export interface Job {
  code: string;
  job_title: string;
  company_name: string;
  company_city: string;
  company_country: string;
  employment_type: EmploymentType;
  description: string;
  key_skills: string[];
  contact_method: ContactMethod;
  contact_email?: string;
  contact_url?: string;
  deadline_date?: string;
  salary_min?: number;
  salary_max?: number;
  salary_currency?: SalaryCurrency;
  recruiter_code?: string;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface JobListItem {
  code: string;
  job_title: string;
  company_name: string;
  company_city: string;
  company_country: string;
  employment_type: EmploymentType;
  key_skills: string[];
  deadline_date?: string;
  salary_min?: number;
  salary_max?: number;
  salary_currency?: SalaryCurrency;
  created_at: string;
}

export interface Profile {
  code: string;
  person_name: string;
  current_title: string;
  current_city: string;
  current_country: string;
  years_of_experience: number;
  brief: string;
  key_skills: string[];
  notice_period: NoticePeriod;
  relocation_preference: RelocationPreference;
  linkedin_profile_link?: string;
  email?: string;
  contact_number?: string;
  has_resume: boolean;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProfileListItem {
  code: string;
  person_name: string;
  current_title: string;
  current_city: string;
  current_country: string;
  years_of_experience: number;
  key_skills: string[];
  notice_period: NoticePeriod;
  relocation_preference: RelocationPreference;
  created_at: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface CreateJobRequest {
  job_title: string;
  company_name: string;
  company_city: string;
  company_country: string;
  employment_type: EmploymentType;
  description: string;
  key_skills: string[];
  contact_method: ContactMethod;
  contact_email?: string;
  contact_url?: string;
  deadline_date?: string;
  salary_min?: number;
  salary_max?: number;
  salary_currency?: SalaryCurrency;
  honeypot?: string;
}

export interface RecruiterRegisterRequest {
  name: string;
  email: string;
  linkedin_profile_url: string;
  website?: string;
}

export interface CreateProfileRequest {
  person_name: string;
  email: string;
  contact_number?: string;
  brief: string;
  current_city: string;
  current_country: string;
  years_of_experience: number;
  current_title: string;
  notice_period: NoticePeriod;
  relocation_preference: RelocationPreference;
  linkedin_profile_link?: string;
  key_skills: string[];
  resume_key?: string;
  honeypot?: string;
}

export interface UpdateJobRequest {
  job_title?: string;
  company_name?: string;
  company_city?: string;
  company_country?: string;
  employment_type?: EmploymentType;
  description?: string;
  key_skills?: string[];
  contact_method?: ContactMethod;
  contact_email?: string;
  contact_url?: string;
  deadline_date?: string;
}

export interface UpdateProfileRequest {
  person_name?: string;
  brief?: string;
  current_city?: string;
  current_country?: string;
  years_of_experience?: number;
  current_title?: string;
  notice_period?: NoticePeriod;
  relocation_preference?: RelocationPreference;
  linkedin_profile_link?: string;
  key_skills?: string[];
}

export interface VerificationResponse {
  success: boolean;
  message: string;
  entity_type?: string;
  code?: string;
  session_token?: string;
  email?: string;
  recruiter_status?: string;
}

// Auth
export interface LoginResponse {
  message: string;
  session_token?: string;
}

export interface LoginVerifyResponse {
  session_token: string;
  email: string;
  user_type?: string;
  recruiter_status?: string;
}

export interface MeResponse {
  email: string;
  user_type?: string;
  recruiter_code?: string;
  recruiter_status?: string;
}

export interface AuthEntity {
  entity_type: 'job' | 'profile';
  code: string;
  title: string;
  status: string;
  edit_token: string;
  view_count: number;
  created_at: string;
  expires_at: string;
}

export interface EntitiesResponse {
  jobs: AuthEntity[];
  profiles: AuthEntity[];
}

export interface ManageValidationResponse {
  valid: boolean;
  entity_type: EntityType;
  code: string;
}

export interface ResumeUrlResponse {
  url: string;
  expires_in: number;
}


export interface StatsResponse {
  active_jobs: number;
  active_profiles: number;
}

export interface ReportRequest {
  entity_type: EntityType;
  entity_code: string;
  reporter_email: string;
  reason: ReportReason;
  details?: string;
}

export interface JobFilters {
  search?: string;
  country?: string;
  city?: string;
  employment_type?: EmploymentType[];
  skills?: string[];
  sort?: 'newest' | 'oldest' | 'deadline';
  page?: number;
  per_page?: number;
}

export interface ProfileFilters {
  search?: string;
  country?: string;
  min_experience?: number;
  max_experience?: number;
  relocation_preference?: RelocationPreference;
  skills?: string[];
  sort?: 'newest' | 'oldest';
  page?: number;
  per_page?: number;
}
