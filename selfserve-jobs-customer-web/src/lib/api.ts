import type {
  Job,
  JobListItem,
  Profile,
  ProfileListItem,
  PaginatedResponse,
  CreateJobRequest,
  CreateProfileRequest,
  UpdateJobRequest,
  UpdateProfileRequest,
  VerificationResponse,
  ManageValidationResponse,
  ResumeUrlResponse,
  StatsResponse,
  ReportRequest,
  JobFilters,
  ProfileFilters,
  LoginResponse,
  LoginVerifyResponse,
  EntitiesResponse,
} from './types';
import { buildQueryString } from './utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(
  path: string,
  options: RequestInit & { next?: { revalidate?: number | false; tags?: string[] } } = {}
): Promise<T> {
  const { next, ...fetchOptions } = options;
  const url = `${API_URL}/api/v1${path}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    },
    ...(next ? { next } : {}),
    ...fetchOptions,
  });

  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.detail ?? errorData.message ?? errorMessage;
    } catch {
      // ignore JSON parse errors
    }
    throw new ApiError(response.status, errorMessage);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

// Stats
export async function getStats(): Promise<StatsResponse> {
  return request<StatsResponse>('/stats', { next: { revalidate: 60 } });
}

// Jobs
export async function getJobs(filters: JobFilters = {}): Promise<PaginatedResponse<JobListItem>> {
  const params: Record<string, string | string[] | number | boolean | undefined | null> = {
    page: filters.page ?? 1,
    per_page: filters.per_page ?? 12,
  };
  if (filters.search) params.search = filters.search;
  if (filters.country) params.country = filters.country;
  if (filters.city) params.city = filters.city;
  if (filters.employment_type?.length) params.employment_type = filters.employment_type;
  if (filters.skills?.length) params.skills = filters.skills;
  if (filters.sort) params.sort = filters.sort;

  return request<PaginatedResponse<JobListItem>>(`/jobs${buildQueryString(params)}`, {
    next: { revalidate: 120 },
  });
}

export async function getJob(code: string): Promise<Job> {
  return request<Job>(`/jobs/${code}`);
}

export async function createJob(data: CreateJobRequest): Promise<{ code: string; message: string }> {
  return request<{ code: string; message: string }>('/jobs', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateJob(code: string, data: UpdateJobRequest, editToken: string): Promise<Job> {
  return request<Job>(`/jobs/${code}`, {
    method: 'PUT',
    headers: { 'X-Edit-Token': editToken },
    body: JSON.stringify(data),
  });
}

export async function deleteJob(code: string, editToken: string): Promise<void> {
  return request<void>(`/jobs/${code}`, {
    method: 'DELETE',
    headers: { 'X-Edit-Token': editToken },
  });
}

export async function trackJobView(code: string): Promise<void> {
  return request<void>(`/jobs/${code}/view`, { method: 'POST' });
}

// Profiles
export async function getProfiles(filters: ProfileFilters = {}): Promise<PaginatedResponse<ProfileListItem>> {
  const params: Record<string, string | string[] | number | boolean | undefined | null> = {
    page: filters.page ?? 1,
    per_page: filters.per_page ?? 12,
  };
  if (filters.search) params.search = filters.search;
  if (filters.country) params.country = filters.country;
  if (filters.min_experience !== undefined) params.min_experience = filters.min_experience;
  if (filters.max_experience !== undefined) params.max_experience = filters.max_experience;
  if (filters.relocation_preference) params.relocation_preference = filters.relocation_preference;
  if (filters.skills?.length) params.skills = filters.skills;
  if (filters.sort) params.sort = filters.sort;

  return request<PaginatedResponse<ProfileListItem>>(`/profiles${buildQueryString(params)}`);
}

export async function getProfile(code: string): Promise<Profile> {
  return request<Profile>(`/profiles/${code}`);
}

export async function createProfile(data: CreateProfileRequest): Promise<{ code: string; message: string }> {
  return request<{ code: string; message: string }>('/profiles', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateProfile(code: string, data: UpdateProfileRequest, editToken: string): Promise<Profile> {
  return request<Profile>(`/profiles/${code}`, {
    method: 'PUT',
    headers: { 'X-Edit-Token': editToken },
    body: JSON.stringify(data),
  });
}

export async function deleteProfile(code: string, editToken: string): Promise<void> {
  return request<void>(`/profiles/${code}`, {
    method: 'DELETE',
    headers: { 'X-Edit-Token': editToken },
  });
}

export async function trackProfileView(code: string): Promise<void> {
  return request<void>(`/profiles/${code}/view`, { method: 'POST' });
}

// Resume
export async function getResumeUrl(profileCode: string): Promise<ResumeUrlResponse> {
  return request<ResumeUrlResponse>(`/profiles/${profileCode}/resume`);
}

export async function getResumeUploadUrl(): Promise<{ resume_key: string; upload_url: string | null }> {
  return request<{ resume_key: string; upload_url: string | null }>('/upload/resume/signed-url', {
    method: 'POST',
  });
}

/** Upload a file directly to GCS using a signed PUT URL. */
export async function uploadResumeDirect(file: File, uploadUrl: string): Promise<void> {
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/pdf' },
    body: file,
  });
  if (!response.ok) {
    throw new Error(`Direct upload failed with status ${response.status}`);
  }
}

// Verification
export async function verifyEmail(code: string): Promise<VerificationResponse> {
  return request<VerificationResponse>('/verify', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
}

export async function resendVerification(email: string, entityType: string): Promise<{ message: string }> {
  return request<{ message: string }>('/verify/resend', {
    method: 'POST',
    body: JSON.stringify({ email, entity_type: entityType }),
  });
}

// Management
export async function validateToken(
  entityType: string,
  code: string,
  token: string
): Promise<ManageValidationResponse> {
  return request<ManageValidationResponse>(
    `/manage/validate-token${buildQueryString({ entity_type: entityType, code, token })}`
  );
}

export async function requestManagementLinks(email: string): Promise<{ message: string }> {
  return request<{ message: string }>('/manage/request-links', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

// Countries & Skills
export async function getCountries(): Promise<{ code: string; name: string }[]> {
  return request<{ code: string; name: string }[]>('/countries');
}

export async function getSkills(): Promise<string[]> {
  return request<string[]>('/skills');
}

// Reports
export async function submitReport(data: ReportRequest): Promise<{ message: string }> {
  return request<{ message: string }>('/reports', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// Auth
export async function loginRequest(email: string): Promise<LoginResponse> {
  return request<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function loginVerify(token: string): Promise<LoginVerifyResponse> {
  const url = `${API_URL}/api/v1/auth/verify?token=${encodeURIComponent(token)}`;
  const response = await fetch(url, { method: 'POST' });
  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.detail ?? errorData.message ?? errorMessage;
    } catch { /* ignore */ }
    throw new ApiError(response.status, errorMessage);
  }
  return response.json();
}

export async function logout(sessionToken: string): Promise<void> {
  return request<void>('/auth/logout', {
    method: 'POST',
    headers: { Authorization: `Bearer ${sessionToken}` },
  });
}

export async function getMyEntities(sessionToken: string): Promise<EntitiesResponse> {
  return request<EntitiesResponse>('/auth/entities', {
    headers: { Authorization: `Bearer ${sessionToken}` },
  });
}

// Activate / Deactivate
export async function deactivateJob(code: string, editToken: string): Promise<Job> {
  return request<Job>(`/jobs/${code}/deactivate`, {
    method: 'POST',
    headers: { 'X-Edit-Token': editToken },
  });
}

export async function activateJob(code: string, editToken: string): Promise<Job> {
  return request<Job>(`/jobs/${code}/activate`, {
    method: 'POST',
    headers: { 'X-Edit-Token': editToken },
  });
}

export async function deactivateProfile(code: string, editToken: string): Promise<Profile> {
  return request<Profile>(`/profiles/${code}/deactivate`, {
    method: 'POST',
    headers: { 'X-Edit-Token': editToken },
  });
}

export async function activateProfile(code: string, editToken: string): Promise<Profile> {
  return request<Profile>(`/profiles/${code}/activate`, {
    method: 'POST',
    headers: { 'X-Edit-Token': editToken },
  });
}

export { ApiError };
