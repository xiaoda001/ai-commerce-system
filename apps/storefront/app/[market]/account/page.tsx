'use client';

import { useEffect, useState } from 'react';

type Customer = { id: string; email: string };

export default function CustomerAccountPage({ params }: { params: Promise<{ market: string }> }) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [market, setMarket] = useState<'us' | 'cn'>('us');
  const [message, setMessage] = useState('Loading account…');
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:3001';

  useEffect(() => {
    let active = true;
    void params.then(({ market: routeMarket }) => {
      if (routeMarket !== 'us' && routeMarket !== 'cn') {
        if (active) setMessage('Market unavailable.');
        return;
      }
      setMarket(routeMarket);
      void fetch(`${apiBaseUrl.replace(/\/$/, '')}/auth/customer/me`, { credentials: 'include' })
        .then(async (response) => {
          if (!response.ok) throw new Error(routeMarket === 'cn' ? '请先登录。' : 'Please sign in to continue.');
          return response.json() as Promise<Customer>;
        })
        .then((identity) => { if (active) { setCustomer(identity); setMessage(''); } })
        .catch((error: unknown) => { if (active) setMessage(error instanceof Error ? error.message : 'Sign-in required.'); });
    });
    return () => { active = false; };
  }, [apiBaseUrl, params]);

  async function logout() {
    const base = apiBaseUrl.replace(/\/$/, '');
    const csrf = await fetch(`${base}/auth/csrf`, { credentials: 'include' });
    const { csrfToken } = await csrf.json() as { csrfToken: string };
    await fetch(`${base}/auth/customer/logout`, { method: 'POST', credentials: 'include', headers: { 'X-CSRF-Token': csrfToken } });
    setCustomer(null);
    setMessage(market === 'cn' ? '已退出登录。' : 'You are signed out.');
  }

  return (
    <main style={{ maxWidth: 880, margin: '0 auto', padding: '48px 24px', color: '#253d33' }}>
      <a href={`/${market}`}>FIELD / FORM</a>
      <h1>{market === 'cn' ? '我的账户' : 'Your account'}</h1>
      {customer ? <><p>{customer.email}</p><p>{market === 'cn' ? '订单与收藏功能将逐步开放。' : 'Orders and favorites will appear here as you shop.'}</p><button onClick={() => void logout()}>{market === 'cn' ? '退出登录' : 'Sign out'}</button></> : <><p role="status">{message}</p><a href={`/${market}/login`}>{market === 'cn' ? '前往登录' : 'Sign in'}</a></>}
    </main>
  );
}
