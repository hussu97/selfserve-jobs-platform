import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UsersTable } from '../UsersTable';
import { adminGetUsers, adminUpdateUserEmail } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  adminGetUsers: vi.fn(),
  adminResendUserVerification: vi.fn(),
  adminUpdateUserEmail: vi.fn(),
}));

const userItem = {
  profile_code: 'profile123',
  person_name: 'Aisha Khan',
  email: 'old@example.com',
  email_verified: true,
  status: 'active',
  current_title: 'Product Manager',
  created_at: '2026-05-05T00:00:00Z',
  view_count: 9,
};

describe('UsersTable', () => {
  beforeEach(() => {
    vi.mocked(adminGetUsers).mockReset();
    vi.mocked(adminUpdateUserEmail).mockReset();
    vi.mocked(adminGetUsers).mockResolvedValue({
      items: [userItem],
      total: 1,
      page: 1,
      per_page: 20,
      total_pages: 1,
    });
  });

  it('updates a user email from the admin table', async () => {
    vi.mocked(adminUpdateUserEmail).mockResolvedValue({
      profile_code: 'profile123',
      user_code: 'user123456789',
      old_email: 'old@example.com',
      email: 'new@example.com',
      profiles_updated: 1,
      jobs_updated: 2,
      contact_email_updates: 1,
    });

    render(<UsersTable sessionToken="admin-token" />);

    await screen.findByText('Aisha Khan');
    await userEvent.click(screen.getByRole('button', { name: /change email/i }));
    const input = screen.getByLabelText(/new email/i);
    await userEvent.clear(input);
    await userEvent.type(input, 'new@example.com');
    await userEvent.click(screen.getByRole('button', { name: /save email/i }));

    await waitFor(() => {
      expect(adminUpdateUserEmail).toHaveBeenCalledWith('profile123', 'new@example.com', 'admin-token');
    });
    expect(await screen.findByText(/old@example.com changed to new@example.com/i)).toBeInTheDocument();
  });
});
