import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import AuthForm from './auth-form';

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe('storefront customer authentication', () => {
  it('gets a CSRF token and submits credentials with cookies enabled', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ csrfToken: 'token-123' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'customer-1' }) });
    vi.stubGlobal('fetch', fetchMock);
    render(<AuthForm market="us" mode="login" apiBaseUrl="http://api.test" />);
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'shopper@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'long-password' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ credentials: 'include' });
    expect(fetchMock.mock.calls[1][1]).toMatchObject({
      method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': 'token-123' },
      body: JSON.stringify({ email: 'shopper@example.com', password: 'long-password' }),
    });
    expect(screen.getByRole('status').textContent).toMatch(/welcome/i);
  });
});
