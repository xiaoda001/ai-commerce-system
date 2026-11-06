import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type AdminIdentity = { id: string; email: string; status: 'active' };
type AuthValue = {
  account: AdminIdentity | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AdminAuthContext = createContext<AuthValue | null>(null);

export function AdminAuthProvider({ apiBaseUrl, children }: { apiBaseUrl: string; children: ReactNode }) {
  const [account, setAccount] = useState<AdminIdentity | null>(null);
  const [loading, setLoading] = useState(true);
  const base = apiBaseUrl.replace(/\/$/, '');

  useEffect(() => {
    let active = true;
    void fetch(`${base}/auth/admin/me`, { credentials: 'include' })
      .then(async (response) => response.ok ? response.json() as Promise<AdminIdentity> : null)
      .then((identity) => { if (active) setAccount(identity); })
      .catch(() => { if (active) setAccount(null); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [base]);

  const login = useCallback(async (email: string, password: string) => {
    const csrfResponse = await fetch(`${base}/auth/csrf`, { credentials: 'include' });
    if (!csrfResponse.ok) throw new Error('无法连接 API，请稍后重试。');
    const { csrfToken } = await csrfResponse.json() as { csrfToken: string };
    const response = await fetch(`${base}/auth/admin/login`, {
      method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) {
      const result = await response.json().catch(() => ({})) as { message?: string };
      throw new Error(result.message || '邮箱或密码错误。');
    }
    setAccount(await response.json() as AdminIdentity);
  }, [base]);

  const logout = useCallback(async () => {
    const csrfResponse = await fetch(`${base}/auth/csrf`, { credentials: 'include' });
    const { csrfToken } = await csrfResponse.json() as { csrfToken: string };
    await fetch(`${base}/auth/admin/logout`, { method: 'POST', credentials: 'include', headers: { 'X-CSRF-Token': csrfToken } });
    setAccount(null);
  }, [base]);

  const value = useMemo(() => ({ account, loading, login, logout }), [account, loading, login, logout]);
  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth(): AuthValue {
  const value = useContext(AdminAuthContext);
  if (!value) throw new Error('useAdminAuth 必须在 AdminAuthProvider 内使用。');
  return value;
}
