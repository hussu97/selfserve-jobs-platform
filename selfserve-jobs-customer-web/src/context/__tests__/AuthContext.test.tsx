import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '../AuthContext';
import { getMe } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  getMe: vi.fn(),
}));

const getMeMock = vi.mocked(getMe);

// ---------------------------------------------------------------------------
// localStorage mock
// ---------------------------------------------------------------------------

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock, writable: false });

// ---------------------------------------------------------------------------
// Consumer component that exposes all context values via data-testid attrs
// ---------------------------------------------------------------------------

function AuthConsumer() {
  const auth = useAuth();
  return (
    <div>
      <span data-testid="logged-in">{String(auth.isLoggedIn)}</span>
      <span data-testid="hydrated">{String(auth.isHydrated)}</span>
      <span data-testid="email">{auth.email ?? 'null'}</span>
      <span data-testid="user-type">{auth.userType ?? 'null'}</span>
      <span data-testid="recruiter-status">{auth.recruiterStatus ?? 'null'}</span>
      <span data-testid="is-admin">{String(auth.isAdmin)}</span>
      <span data-testid="is-recruiter">{String(auth.isRecruiter)}</span>
      <span data-testid="is-active-recruiter">{String(auth.isActiveRecruiter)}</span>
      <span data-testid="is-pending-recruiter">{String(auth.isPendingRecruiter)}</span>
      <span data-testid="initial">{auth.initial}</span>
      <button onClick={() => auth.login('tok-admin', 'admin@test.com', 'admin')}>
        Login as admin
      </button>
      <button
        onClick={() =>
          auth.login('tok-recruiter', 'recruiter@test.com', 'recruiter', 'rc001', 'active')
        }
      >
        Login as active recruiter
      </button>
      <button
        onClick={() =>
          auth.login('tok-pending', 'pending@test.com', 'recruiter', 'rc002', 'pending_approval')
        }
      >
        Login as pending recruiter
      </button>
      <button onClick={auth.logout}>Logout</button>
      <button onClick={() => auth.updateRecruiterStatus('active')}>Activate recruiter</button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  localStorageMock.clear();
  getMeMock.mockReset();
  getMeMock.mockRejectedValue(new Error('session refresh unavailable'));
});

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

describe('AuthProvider — initial state', () => {
  it('starts logged out', () => {
    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    );
    expect(screen.getByTestId('logged-in')).toHaveTextContent('false');
  });

  it('email is null before login', () => {
    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    );
    expect(screen.getByTestId('email')).toHaveTextContent('null');
  });

  it('isHydrated is true after mount', () => {
    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    );
    expect(screen.getByTestId('hydrated')).toHaveTextContent('true');
  });

  it('all role flags are false before login', () => {
    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    );
    expect(screen.getByTestId('is-admin')).toHaveTextContent('false');
    expect(screen.getByTestId('is-recruiter')).toHaveTextContent('false');
    expect(screen.getByTestId('is-active-recruiter')).toHaveTextContent('false');
    expect(screen.getByTestId('is-pending-recruiter')).toHaveTextContent('false');
  });
});

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------

describe('AuthProvider — login()', () => {
  it('sets isLoggedIn to true', async () => {
    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    );
    await userEvent.click(screen.getByText('Login as admin'));
    expect(screen.getByTestId('logged-in')).toHaveTextContent('true');
  });

  it('stores email and userType', async () => {
    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    );
    await userEvent.click(screen.getByText('Login as admin'));
    expect(screen.getByTestId('email')).toHaveTextContent('admin@test.com');
    expect(screen.getByTestId('user-type')).toHaveTextContent('admin');
  });

  it('persists session to localStorage', async () => {
    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    );
    await userEvent.click(screen.getByText('Login as admin'));
    const stored = JSON.parse(localStorageMock.getItem('auth_session')!);
    expect(stored.sessionToken).toBe('tok-admin');
    expect(stored.email).toBe('admin@test.com');
  });

  it('sets isAdmin when userType is "admin"', async () => {
    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    );
    await userEvent.click(screen.getByText('Login as admin'));
    expect(screen.getByTestId('is-admin')).toHaveTextContent('true');
    expect(screen.getByTestId('is-recruiter')).toHaveTextContent('false');
  });

  it('sets isActiveRecruiter when userType is recruiter with status active', async () => {
    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    );
    await userEvent.click(screen.getByText('Login as active recruiter'));
    expect(screen.getByTestId('is-recruiter')).toHaveTextContent('true');
    expect(screen.getByTestId('is-active-recruiter')).toHaveTextContent('true');
    expect(screen.getByTestId('is-pending-recruiter')).toHaveTextContent('false');
  });

  it('sets isPendingRecruiter when recruiterStatus is "pending_approval"', async () => {
    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    );
    await userEvent.click(screen.getByText('Login as pending recruiter'));
    expect(screen.getByTestId('is-pending-recruiter')).toHaveTextContent('true');
    expect(screen.getByTestId('is-active-recruiter')).toHaveTextContent('false');
  });

  it('initial is the uppercased first letter of the email', async () => {
    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    );
    await userEvent.click(screen.getByText('Login as admin'));
    expect(screen.getByTestId('initial')).toHaveTextContent('A');
  });
});

// ---------------------------------------------------------------------------
// Logout
// ---------------------------------------------------------------------------

describe('AuthProvider — logout()', () => {
  it('clears isLoggedIn after logout', async () => {
    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    );
    await userEvent.click(screen.getByText('Login as admin'));
    await userEvent.click(screen.getByText('Logout'));
    expect(screen.getByTestId('logged-in')).toHaveTextContent('false');
  });

  it('clears email and userType after logout', async () => {
    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    );
    await userEvent.click(screen.getByText('Login as admin'));
    await userEvent.click(screen.getByText('Logout'));
    expect(screen.getByTestId('email')).toHaveTextContent('null');
    expect(screen.getByTestId('user-type')).toHaveTextContent('null');
  });

  it('removes session from localStorage after logout', async () => {
    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    );
    await userEvent.click(screen.getByText('Login as admin'));
    await userEvent.click(screen.getByText('Logout'));
    expect(localStorageMock.getItem('auth_session')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// updateRecruiterStatus
// ---------------------------------------------------------------------------

describe('AuthProvider — updateRecruiterStatus()', () => {
  it('updates recruiterStatus in state', async () => {
    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    );
    await userEvent.click(screen.getByText('Login as pending recruiter'));
    expect(screen.getByTestId('is-active-recruiter')).toHaveTextContent('false');

    await userEvent.click(screen.getByText('Activate recruiter'));
    expect(screen.getByTestId('is-active-recruiter')).toHaveTextContent('true');
    expect(screen.getByTestId('is-pending-recruiter')).toHaveTextContent('false');
  });

  it('persists updated status to localStorage', async () => {
    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    );
    await userEvent.click(screen.getByText('Login as pending recruiter'));
    await userEvent.click(screen.getByText('Activate recruiter'));
    const stored = JSON.parse(localStorageMock.getItem('auth_session')!);
    expect(stored.recruiterStatus).toBe('active');
  });
});

// ---------------------------------------------------------------------------
// Session persistence across mounts
// ---------------------------------------------------------------------------

describe('AuthProvider — session persistence', () => {
  it('restores session from localStorage on mount', async () => {
    localStorageMock.setItem(
      'auth_session',
      JSON.stringify({
        sessionToken: 'restored-token',
        email: 'restored@test.com',
        userType: 'admin',
        recruiterCode: null,
        recruiterStatus: null,
      }),
    );

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('hydrated')).toHaveTextContent('true'));
    expect(screen.getByTestId('email')).toHaveTextContent('restored@test.com');
    expect(screen.getByTestId('is-admin')).toHaveTextContent('true');
    expect(screen.getByTestId('logged-in')).toHaveTextContent('true');
  });

  it('keeps hydration pending until the stored session is refreshed', async () => {
    let resolveMe!: (value: Awaited<ReturnType<typeof getMe>>) => void;
    getMeMock.mockReturnValueOnce(
      new Promise<Awaited<ReturnType<typeof getMe>>>((resolve) => {
        resolveMe = resolve;
      })
    );
    localStorageMock.setItem(
      'auth_session',
      JSON.stringify({
        sessionToken: 'restored-token',
        email: 'recruiter@test.com',
        userType: 'recruiter',
        recruiterCode: 'rc002',
        recruiterStatus: 'pending_approval',
      }),
    );

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    );

    expect(screen.getByTestId('hydrated')).toHaveTextContent('false');
    resolveMe({
      email: 'recruiter@test.com',
      user_type: 'recruiter',
      recruiter_code: 'rc002',
      recruiter_status: 'active',
    });
    await waitFor(() => expect(screen.getByTestId('hydrated')).toHaveTextContent('true'));
    expect(screen.getByTestId('is-active-recruiter')).toHaveTextContent('true');
  });

  it('refreshes stored recruiter status from /auth/me on mount', async () => {
    getMeMock.mockResolvedValueOnce({
      email: 'recruiter@test.com',
      user_type: 'recruiter',
      recruiter_code: 'rc002',
      recruiter_status: 'active',
    });
    localStorageMock.setItem(
      'auth_session',
      JSON.stringify({
        sessionToken: 'restored-token',
        email: 'recruiter@test.com',
        userType: 'recruiter',
        recruiterCode: 'rc002',
        recruiterStatus: 'pending_approval',
      }),
    );

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('is-active-recruiter')).toHaveTextContent('true'));
    expect(screen.getByTestId('recruiter-status')).toHaveTextContent('active');
    expect(getMeMock).toHaveBeenCalledWith('restored-token');

    const stored = JSON.parse(localStorageMock.getItem('auth_session')!);
    expect(stored.recruiterStatus).toBe('active');
  });

  it('ignores corrupt localStorage data without throwing', () => {
    localStorageMock.setItem('auth_session', 'not-valid-json{{{');
    expect(() =>
      render(
        <AuthProvider>
          <AuthConsumer />
        </AuthProvider>,
      ),
    ).not.toThrow();
    expect(screen.getByTestId('logged-in')).toHaveTextContent('false');
  });
});

// ---------------------------------------------------------------------------
// useAuth outside provider
// ---------------------------------------------------------------------------

describe('useAuth', () => {
  it('throws when used outside of AuthProvider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<AuthConsumer />)).toThrow('useAuth must be used within AuthProvider');
    consoleSpy.mockRestore();
  });
});
