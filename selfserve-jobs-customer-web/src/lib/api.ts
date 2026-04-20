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
  MeResponse,
  EntitiesResponse,
  RecruiterRegisterRequest,
  AdminListResponse,
  AdminUserItem,
  AdminRecruiterItem,
  AdminReportItem,
  RejectionReason,
  AdminListFilters,
  AdminReportFilters,
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

// ---------------------------------------------------------------------------
// Client-side GET cache (60 s TTL) — avoids redundant fetches on navigation
// ---------------------------------------------------------------------------
const CLIENT_CACHE_TTL_MS = 60_000;

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const _cache = new Map<string, CacheEntry<unknown>>();

function _cacheGet<T>(key: string): T | undefined {
  const entry = _cache.get(key) as CacheEntry<T> | undefined;
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    _cache.delete(key);
    return undefined;
  }
  return entry.data;
}

function _cacheSet<T>(key: string, data: T): void {
  _cache.set(key, { data, expiresAt: Date.now() + CLIENT_CACHE_TTL_MS });
}

async function request<T>(
  path: string,
  options: RequestInit & { next?: { revalidate?: number | false; tags?: string[] }; clientCache?: boolean } = {}
): Promise<T> {
  const { next, clientCache, headers: optionHeaders, ...restOptions } = options;
  const url = `${API_URL}/api/v1${path}`;

  // Client-side GET cache — only in browser, only for explicit opt-in GET requests
  const isGet = !restOptions.method || restOptions.method === 'GET';
  if (clientCache && isGet && typeof window !== 'undefined') {
    const cached = _cacheGet<T>(url);
    if (cached !== undefined) return cached;
  }

  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...optionHeaders,
    },
    ...(next ? { next } : {}),
    ...restOptions,
  });

  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.detail ?? errorData.message ?? errorMessage;
    } catch {
      // ignore JSON parse errors
    }
    // Signal auth listeners to clear session on 401 so stale localStorage tokens are purged
    if (response.status === 401 && typeof window !== 'undefined') {
      window.dispatchEvent(new Event('auth:unauthorized'));
    }
    throw new ApiError(response.status, errorMessage);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const data = await response.json();

  if (clientCache && isGet && typeof window !== 'undefined') {
    _cacheSet(url, data);
  }

  return data;
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
    clientCache: true,
  });
}

export async function getJob(code: string): Promise<Job> {
  return request<Job>(`/jobs/${code}`);
}

export async function createJob(data: CreateJobRequest, sessionToken: string): Promise<{ code: string; message: string }> {
  return request<{ code: string; message: string }>('/jobs', {
    method: 'POST',
    headers: { Authorization: `Bearer ${sessionToken}` },
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

export async function renewJob(code: string, editToken: string): Promise<Job> {
  return request<Job>(`/jobs/${code}/renew`, {
    method: 'POST',
    headers: { 'X-Edit-Token': editToken },
  });
}

// Profiles
export async function getProfiles(filters: ProfileFilters = {}): Promise<PaginatedResponse<ProfileListItem>> {
  const params: Record<string, string | string[] | number | boolean | undefined | null> = {
    page: filters.page ?? 1,
    per_page: filters.per_page ?? 12,
  };
  if (filters.search) params.search = filters.search;
  if (filters.country) params.country = filters.country;
  if (filters.city) params.city = filters.city;
  if (filters.min_experience !== undefined) params.min_experience = filters.min_experience;
  if (filters.max_experience !== undefined) params.max_experience = filters.max_experience;
  if (filters.relocation_preference) params.relocation_preference = filters.relocation_preference;
  if (filters.skills?.length) params.skills = filters.skills;
  if (filters.employment_status?.length) params.employment_status = filters.employment_status;
  if (filters.notice_period?.length) params.notice_period = filters.notice_period;
  if (filters.sort) params.sort = filters.sort;

  return request<PaginatedResponse<ProfileListItem>>(`/profiles${buildQueryString(params)}`, {
    next: { revalidate: 120 },
    clientCache: true,
  });
}

let _topSkillsCache: string[] | null = null;
export async function getTopSkills(): Promise<string[]> {
  if (_topSkillsCache) return _topSkillsCache;
  const result = await request<string[]>('/profiles/top-skills?limit=6');
  _topSkillsCache = result;
  return result;
}

export async function getProfile(code: string, sessionToken?: string): Promise<Profile> {
  return request<Profile>(`/profiles/${code}`, {
    headers: sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {},
  });
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

export async function renewProfile(code: string, editToken: string): Promise<Profile> {
  return request<Profile>(`/profiles/${code}/renew`, {
    method: 'POST',
    headers: { 'X-Edit-Token': editToken },
  });
}

// Resume
export async function getResumeUrl(profileCode: string, sessionToken: string): Promise<ResumeUrlResponse> {
  return request<ResumeUrlResponse>(`/profiles/${profileCode}/resume`, {
    headers: { Authorization: `Bearer ${sessionToken}` },
  });
}

export async function getResumeUploadUrl(): Promise<{ resume_key: string; upload_url: string | null }> {
  return request<{ resume_key: string; upload_url: string | null }>('/upload/resume/signed-url', {
    method: 'POST',
  });
}

/** Upload a file directly to GCS using XHR so upload progress can be tracked. */
export function uploadResumeWithProgress(
  file: File,
  uploadUrl: string,
  onProgress: (percent: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    });
    xhr.addEventListener('error', () => reject(new Error('Upload failed')));
    xhr.addEventListener('abort', () => reject(new Error('Upload cancelled')));
    xhr.open('PUT', uploadUrl);
    xhr.setRequestHeader('Content-Type', 'application/pdf');
    xhr.send(file);
  });
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
export async function getMe(sessionToken: string): Promise<MeResponse> {
  return request<MeResponse>('/auth/me', {
    headers: { Authorization: `Bearer ${sessionToken}` },
  });
}

export async function registerRecruiter(data: RecruiterRegisterRequest): Promise<{ code: string; message: string }> {
  return request<{ code: string; message: string }>('/recruiters/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function loginRequest(email: string): Promise<LoginResponse> {
  return request<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function loginVerify(token: string): Promise<LoginVerifyResponse> {
  return request<LoginVerifyResponse>(`/auth/verify?token=${encodeURIComponent(token)}`, {
    method: 'POST',
  });
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

// Admin
export async function adminLogin(email: string): Promise<{ message: string; url?: string }> {
  return request<{ message: string; url?: string }>('/admin/login', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function adminGetUsers(
  filters: AdminListFilters,
  sessionToken: string
): Promise<AdminListResponse<AdminUserItem>> {
  const params: Record<string, string | number | undefined> = {
    page: filters.page ?? 1,
    per_page: filters.per_page ?? 20,
  };
  if (filters.search) params.search = filters.search;
  if (filters.status) params.status = filters.status;
  return request<AdminListResponse<AdminUserItem>>(`/admin/users${buildQueryString(params)}`, {
    headers: { Authorization: `Bearer ${sessionToken}` },
  });
}

export async function adminGetRecruiters(
  filters: AdminListFilters,
  sessionToken: string
): Promise<AdminListResponse<AdminRecruiterItem>> {
  const params: Record<string, string | number | undefined> = {
    page: filters.page ?? 1,
    per_page: filters.per_page ?? 20,
  };
  if (filters.search) params.search = filters.search;
  if (filters.status) params.status = filters.status;
  return request<AdminListResponse<AdminRecruiterItem>>(`/admin/recruiters${buildQueryString(params)}`, {
    headers: { Authorization: `Bearer ${sessionToken}` },
  });
}

export async function adminApproveRecruiter(
  code: string,
  sessionToken: string
): Promise<{ recruiter_code: string; status: string }> {
  return request(`/admin/recruiters/${code}/approve`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${sessionToken}` },
  });
}

export async function adminRejectRecruiter(
  code: string,
  reasonCode: string,
  comment: string | null,
  sessionToken: string
): Promise<{ recruiter_code: string; status: string }> {
  return request(`/admin/recruiters/${code}/reject`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${sessionToken}` },
    body: JSON.stringify({ reason_code: reasonCode, comment }),
  });
}

export async function adminGetReports(
  filters: AdminReportFilters,
  sessionToken: string
): Promise<AdminListResponse<AdminReportItem>> {
  const params: Record<string, string | number | undefined> = {
    page: filters.page ?? 1,
    per_page: filters.per_page ?? 20,
  };
  if (filters.search) params.search = filters.search;
  if (filters.status) params.status = filters.status;
  if (filters.entity_type) params.entity_type = filters.entity_type;
  return request<AdminListResponse<AdminReportItem>>(`/admin/reports${buildQueryString(params)}`, {
    headers: { Authorization: `Bearer ${sessionToken}` },
  });
}

export async function adminGetRejectionReasons(sessionToken: string): Promise<RejectionReason[]> {
  return request<RejectionReason[]>('/admin/rejection-reasons', {
    headers: { Authorization: `Bearer ${sessionToken}` },
  });
}

export { ApiError };
