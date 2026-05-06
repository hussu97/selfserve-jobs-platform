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

export type EmploymentStatus =
  | 'open_to_work'
  | 'part_time'
  | 'full_time'
  | 'remote'
  | 'contract'
  | 'freelance';

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
  company_logo_url?: string | null;
  recruiter_code?: string;
  status: string;
  view_count: number;
  renewal_count: number;
  expires_at: string;
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
  current_employment_status: EmploymentStatus;
  linkedin_profile_link?: string;
  email?: string;
  contact_number?: string;
  has_resume: boolean;
  status: string;
  view_count: number;
  renewal_count: number;
  expires_at: string;
  is_verified: boolean;
  is_active: boolean;
  is_owner: boolean;
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
  current_employment_status: EmploymentStatus;
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
  current_employment_status: EmploymentStatus;
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
  current_employment_status?: EmploymentStatus;
  linkedin_profile_link?: string;
  key_skills?: string[];
  // Explicitly null → remove resume. GCS path string → replace resume. Omit → no change.
  resume_key?: string | null;
}

export interface VerificationResponse {
  success: boolean;
  message: string;
  entity_type?: string;
  code?: string;
  session_token?: string;
  email?: string;
  recruiter_status?: string;
  user_type?: string;
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
  city?: string;
  min_experience?: number;
  max_experience?: number;
  relocation_preference?: RelocationPreference;
  employment_status?: EmploymentStatus[];
  notice_period?: NoticePeriod[];
  skills?: string[];
  sort?: 'newest' | 'oldest';
  page?: number;
  per_page?: number;
}

// Admin portal types
export interface AdminListResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface AdminUserItem {
  profile_code: string;
  person_name: string;
  email: string;
  email_verified: boolean;
  status: string;
  current_title: string | null;
  created_at: string;
  view_count: number;
}

export interface AdminUserEmailUpdateResponse {
  profile_code: string;
  user_code: string;
  old_email: string;
  email: string;
  profiles_updated: number;
  jobs_updated: number;
  contact_email_updates: number;
}

export interface AdminRecruiterItem {
  recruiter_code: string;
  name: string;
  email: string;
  linkedin_profile_url: string;
  status: string;
  rejection_reason_code: string | null;
  rejection_comment: string | null;
  created_at: string;
}

export interface AdminReportItem {
  report_code: string;
  entity_type: string;
  entity_code: string;
  reporter_email: string;
  reason: string;
  details: string | null;
  status: string;
  created_at: string;
  entity_title: string | null;
}

export interface RejectionReason {
  code: string;
  name: string;
}

export interface AdminListFilters {
  search?: string;
  status?: string;
  page?: number;
  per_page?: number;
}

export interface AdminReportFilters extends AdminListFilters {
  entity_type?: string;
}

// Blog types
export interface LinkPreview {
  url: string;
  title?: string | null;
  description?: string | null;
  image?: string | null;
  domain?: string | null;
}

export interface BlogPostListItem {
  post_code: string;
  title: string;
  slug: string;
  excerpt: string;
  author: string;
  tags: string[];
  status: string;
  featured_image_url?: string | null;
  reading_minutes: number;
  created_at: string;
  updated_at: string;
}

export interface BlogPost {
  post_code: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author: string;
  tags: string[];
  status: string;
  featured_image_url?: string | null;
  reading_minutes: number;
  view_count: number;
  link_preview?: LinkPreview | null;
  created_at: string;
  updated_at: string;
}

export interface AdminBlogPost extends BlogPostListItem {
  content: string;
  view_count: number;
  link_click_count: number;
  link_preview?: LinkPreview | null;
}

export interface BlogListFilters {
  search?: string;
  tag?: string;
  page?: number;
  per_page?: number;
}

export interface AdminBlogListFilters {
  search?: string;
  status?: string;
  page?: number;
  per_page?: number;
}

export interface CreateBlogPostRequest {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author: string;
  tags: string[];
  status: 'draft' | 'published' | 'archived';
  featured_image_url?: string | null;
  reading_minutes?: number;
  link_preview_url?: string | null;
}

export interface UpdateBlogPostRequest {
  title?: string;
  slug?: string;
  excerpt?: string;
  content?: string;
  author?: string;
  tags?: string[];
  status?: 'draft' | 'published' | 'archived';
  featured_image_url?: string | null;
  reading_minutes?: number;
  link_preview_url?: string;
  link_preview?: LinkPreview | null;
}

export interface AdminEmailLogItem {
  email_type: string;
  recipient_email: string;
  entity_type: string | null;
  entity_code: string | null;
  success: boolean;
  resend_id: string | null;
  error_message: string | null;
  created_at: string;
}

export interface AdminEmailLogFilters {
  search?: string;
  email_type?: string;
  success?: boolean;
  page?: number;
  per_page?: number;
}

// Passkey types
export interface PasskeyBeginResponse {
  session_key: string;
  options: Record<string, unknown>;
}

export interface PasskeyAuthCompleteResponse {
  session_token: string;
  email: string;
  user_type: string | null;
  recruiter_code: string | null;
  recruiter_status: string | null;
}

export interface PasskeyAvailabilityResponse {
  has_passkey: boolean;
}

export interface PasskeyItem {
  credential_id_b64: string;
  label: string | null;
  created_at: string;
}

export interface PasskeyListResponse {
  items: PasskeyItem[];
}
