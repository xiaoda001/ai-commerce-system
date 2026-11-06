import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ConfigProvider } from 'antd';
import App from './App';

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false, media: query, onchange: null,
    addListener: vi.fn(), removeListener: vi.fn(),
    addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
  })),
});

class TestResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
beforeEach(() => { vi.stubGlobal('ResizeObserver', TestResizeObserver); });

function renderAdmin() {
  return render(<ConfigProvider><App apiBaseUrl="https://api.example.test" /></ConfigProvider>);
}

describe('admin app authentication', () => {
  it('shows the login form when the session is missing', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 401, json: async () => ({}) }));
    renderAdmin();
    expect(await screen.findByRole('heading', { name: '管理后台登录' })).toBeTruthy();
    expect(screen.queryByText('角色与权限')).toBeNull();
  });

  it('submits admin credentials with CSRF and cookie credentials', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({}) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ csrfToken: 'token-456' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'admin-1', email: 'ops@example.com', status: 'active' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => [] });
    vi.stubGlobal('fetch', fetchMock);
    renderAdmin();
    fireEvent.change(await screen.findByLabelText('邮箱'), { target: { value: 'ops@example.com' } });
    fireEvent.change(screen.getByLabelText('密码'), { target: { value: 'long-enough-password' } });
    fireEvent.click(screen.getByRole('button', { name: /登\s*录/ }));
    await waitFor(() => expect(screen.getByText('角色与权限')).toBeTruthy());
    expect(fetchMock.mock.calls[2][1]).toMatchObject({
      method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': 'token-456' },
    });
    expect(fetchMock.mock.calls[3][1]).toMatchObject({ credentials: 'include', headers: { 'X-Market': 'US' } });
  });
});
