import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PasskeyManager } from '../PasskeyManager';
import { passkeyDelete, passkeyList } from '@/lib/api';
import { registerPasskey } from '@/hooks/usePasskey';

vi.mock('@/hooks/usePasskey', () => ({
  usePasskeySupport: () => true,
  registerPasskey: vi.fn(),
}));

vi.mock('@/lib/api', () => ({
  passkeyDelete: vi.fn(),
  passkeyList: vi.fn(),
}));

describe('PasskeyManager', () => {
  beforeEach(() => {
    vi.mocked(passkeyDelete).mockReset();
    vi.mocked(passkeyList).mockReset();
    vi.mocked(registerPasskey).mockReset();
  });

  it('adds a passkey without asking for a manual label', async () => {
    vi.mocked(passkeyList).mockResolvedValue({ items: [] });
    vi.mocked(registerPasskey).mockResolvedValue();

    render(<PasskeyManager sessionToken="session-token" />);

    await screen.findByRole('button', { name: /add passkey/i });
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /add passkey/i }));

    await waitFor(() => {
      expect(registerPasskey).toHaveBeenCalledWith('session-token');
    });
  });

  it('presents existing passkeys as a single enabled state', async () => {
    vi.mocked(passkeyList).mockResolvedValue({
      items: [
        {
          credential_id_b64: 'first',
          label: 'Passkey 1',
          created_at: '2026-05-06T00:00:00Z',
        },
        {
          credential_id_b64: 'second',
          label: 'Passkey 2',
          created_at: '2026-05-06T01:00:00Z',
        },
      ],
    });
    vi.mocked(passkeyDelete).mockResolvedValue({ message: 'Passkey deleted' });

    render(<PasskeyManager sessionToken="session-token" />);

    expect(await screen.findByText('Passkey enabled')).toBeInTheDocument();
    expect(screen.queryByText('Passkey 1')).not.toBeInTheDocument();
    expect(screen.queryByText('Passkey 2')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /remove/i }));

    await waitFor(() => {
      expect(passkeyDelete).toHaveBeenCalledWith('session-token', 'first');
      expect(passkeyDelete).toHaveBeenCalledWith('session-token', 'second');
    });
  });
});
