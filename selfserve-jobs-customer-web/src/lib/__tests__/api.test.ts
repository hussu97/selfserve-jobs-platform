import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  adminDeactivateProfile,
  adminResendUserVerification,
  adminUpdateUserEmail,
  passkeyAvailability,
  getJob,
  getJobs,
  deleteJob,
  updateJob,
  verifyEmail,
  ApiError,
} from '../api';

const mockFetch = vi.fn();

beforeEach(() => {
  vi.stubGlobal('fetch', mockFetch);
});

afterEach(() => {
  vi.unstubAllGlobals();
  mockFetch.mockReset();
});

function mockOkResponse(data: unknown) {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    status: 200,
    json: async () => data,
  });
}

function mockErrorResponse(status: number, body: unknown = { detail: 'Not found' }) {
  mockFetch.mockResolvedValueOnce({
    ok: false,
    status,
    json: async () => body,
  });
}

describe('getJob', () => {
  it('constructs the correct URL for a job code', async () => {
    mockOkResponse({ code: 'abc123', job_title: 'Engineer' });
    await getJob('abc123');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/jobs/abc123'),
      expect.any(Object)
    );
  });

  it('returns the job data on success', async () => {
    const jobData = { code: 'abc123', job_title: 'Software Engineer' };
    mockOkResponse(jobData);
    const result = await getJob('abc123');
    expect(result).toEqual(jobData);
  });

  it('throws ApiError on non-ok response', async () => {
    mockErrorResponse(404, { detail: 'Job not found' });
    await expect(getJob('nonexistent')).rejects.toThrow(ApiError);
  });

  it('throws ApiError with the correct status code', async () => {
    mockErrorResponse(404, { detail: 'Job not found' });
    let error: ApiError | null = null;
    try {
      await getJob('nonexistent');
    } catch (e) {
      error = e as ApiError;
    }
    expect(error?.status).toBe(404);
  });

  it('uses the detail field from error response as error message', async () => {
    mockErrorResponse(404, { detail: 'Job not found' });
    let error: ApiError | null = null;
    try {
      await getJob('nonexistent');
    } catch (e) {
      error = e as ApiError;
    }
    expect(error?.message).toBe('Job not found');
  });
});

describe('getJobs', () => {
  it('constructs the correct URL with default pagination', async () => {
    mockOkResponse({ items: [], total: 0, page: 1, per_page: 30, total_pages: 0 });
    await getJobs();
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/jobs?page=1&per_page=30'),
      expect.any(Object)
    );
  });

  it('includes search param in query string when provided', async () => {
    mockOkResponse({ items: [], total: 0, page: 1, per_page: 30, total_pages: 0 });
    await getJobs({ search: 'engineer' });
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('search=engineer'),
      expect.any(Object)
    );
  });

  it('includes multiple employment_type params for array filters', async () => {
    mockOkResponse({ items: [], total: 0, page: 1, per_page: 30, total_pages: 0 });
    await getJobs({ employment_type: ['full_time', 'remote'] });
    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain('employment_type=full_time');
    expect(calledUrl).toContain('employment_type=remote');
  });
});

describe('deleteJob', () => {
  it('sends DELETE request with X-Edit-Token header', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, status: 204, json: async () => undefined });
    await deleteJob('abc123', 'my-secret-token');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/jobs/abc123'),
      expect.objectContaining({
        method: 'DELETE',
        headers: expect.objectContaining({ 'X-Edit-Token': 'my-secret-token' }),
      })
    );
  });
});

describe('updateJob', () => {
  it('sends PUT request with X-Edit-Token header and JSON body', async () => {
    const updatedJob = { code: 'abc123', job_title: 'Senior Engineer' };
    mockOkResponse(updatedJob);
    await updateJob('abc123', { job_title: 'Senior Engineer' }, 'edit-token-64chars');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/jobs/abc123'),
      expect.objectContaining({
        method: 'PUT',
        headers: expect.objectContaining({ 'X-Edit-Token': 'edit-token-64chars' }),
        body: JSON.stringify({ job_title: 'Senior Engineer' }),
      })
    );
  });
});

describe('verifyEmail', () => {
  it('sends POST to /verify with the verification code', async () => {
    mockOkResponse({ success: true, message: 'Verified' });
    await verifyEmail('verification-code-here');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/verify'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ code: 'verification-code-here' }),
      })
    );
  });
});

describe('adminDeactivateProfile', () => {
  it('sends POST request with bearer token', async () => {
    mockOkResponse({ profile_code: 'prof123', status: 'inactive' });
    await adminDeactivateProfile('prof123', 'admin-session-token');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/admin/profiles/prof123/deactivate'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer admin-session-token' }),
      })
    );
  });
});

describe('adminResendUserVerification', () => {
  it('sends POST request with bearer token', async () => {
    mockOkResponse({ message: 'Verification email sent.' });
    await adminResendUserVerification('prof123', 'admin-session-token');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/admin/users/prof123/resend-verification'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer admin-session-token' }),
      })
    );
  });
});

describe('adminUpdateUserEmail', () => {
  it('sends PATCH request with bearer token and new email body', async () => {
    mockOkResponse({
      profile_code: 'prof123',
      user_code: 'user123',
      old_email: 'old@example.com',
      email: 'new@example.com',
      profiles_updated: 1,
      jobs_updated: 2,
      contact_email_updates: 1,
    });
    await adminUpdateUserEmail('prof123', 'new@example.com', 'admin-session-token');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/admin/users/prof123/email'),
      expect.objectContaining({
        method: 'PATCH',
        headers: expect.objectContaining({ Authorization: 'Bearer admin-session-token' }),
        body: JSON.stringify({ email: 'new@example.com' }),
      })
    );
  });
});

describe('passkeyAvailability', () => {
  it('checks passkey availability for an email', async () => {
    mockOkResponse({ has_passkey: true });
    await passkeyAvailability('user@example.com');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/passkey/availability?email=user%40example.com&admin_only=false'),
      expect.any(Object)
    );
  });

  it('includes admin_only when checking admin passkey availability', async () => {
    mockOkResponse({ has_passkey: false });
    await passkeyAvailability('admin@example.com', true);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/passkey/availability?email=admin%40example.com&admin_only=true'),
      expect.any(Object)
    );
  });
});

describe('ApiError', () => {
  it('has name "ApiError"', () => {
    const err = new ApiError(500, 'Server error');
    expect(err.name).toBe('ApiError');
  });

  it('stores the status code', () => {
    const err = new ApiError(422, 'Validation error');
    expect(err.status).toBe(422);
  });

  it('is an instance of Error', () => {
    const err = new ApiError(400, 'Bad request');
    expect(err).toBeInstanceOf(Error);
  });
});
