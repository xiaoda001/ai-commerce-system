'use client';

import { useState, type FormEvent } from 'react';

type Market = 'us' | 'cn';
type AuthMode = 'login' | 'register';

export default function AuthForm({ market, mode, apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:3001' }: {
  market: Market;
  mode: AuthMode;
  apiBaseUrl?: string;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const chinese = market === 'cn';

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');
    setBusy(true);
    try {
      const base = apiBaseUrl.replace(/\/$/, '');
      const csrfResponse = await fetch(`${base}/auth/csrf`, { credentials: 'include' });
      if (!csrfResponse.ok) throw new Error(chinese ? '暂时无法连接，请稍后重试。' : 'Could not connect. Please try again.');
      const { csrfToken } = await csrfResponse.json() as { csrfToken: string };
      const endpoint = mode === 'login' ? 'login' : 'register';
      const response = await fetch(`${base}/auth/customer/${endpoint}`, {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({})) as { message?: string | string[] };
        throw new Error(Array.isArray(error.message) ? error.message[0] : error.message || (chinese ? '邮箱或密码不正确。' : 'Check your email and password.'));
      }
      setMessage(mode === 'login'
        ? (chinese ? '登录成功，欢迎回来。' : 'Welcome back. You are signed in.')
        : (chinese ? '账户已创建，欢迎加入。' : 'Your account is ready. Welcome.'));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : (chinese ? '请求失败，请重试。' : 'Something went wrong. Please try again.'));
    } finally {
      setBusy(false);
    }
  }

  const title = mode === 'login' ? (chinese ? '欢迎回来' : 'Welcome back') : (chinese ? '创建账户' : 'Create your account');
  return (
    <main style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(340px, 0.8fr)', background: '#f5f3ee', color: '#1e2925' }}>
      <section style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 'clamp(32px, 7vw, 104px)', background: 'linear-gradient(145deg, #e3e8dc, #f5f3ee)' }}>
        <a href={`/${market}`} style={{ color: 'inherit', fontSize: 20, fontWeight: 700, letterSpacing: '.12em', textDecoration: 'none' }}>FIELD / FORM</a>
        <div>
          <p style={{ color: '#677970', letterSpacing: '.18em', textTransform: 'uppercase' }}>{market === 'us' ? 'United States · USD' : '中国 · CNY'}</p>
          <h1 style={{ maxWidth: 560, fontSize: 'clamp(40px, 6vw, 76px)', lineHeight: 1.04, margin: '18px 0' }}>
            {chinese ? '好物，值得慢慢发现。' : 'Thoughtful goods for everyday living.'}
          </h1>
          <p style={{ maxWidth: 420, color: '#677970', fontSize: 17, lineHeight: 1.7 }}>
            {chinese ? '登录后管理订单、收藏心仪商品，并继续探索。' : 'Sign in to manage orders, save favorites, and keep exploring.'}
          </p>
        </div>
        <small style={{ color: '#677970' }}>A considered shopping experience, wherever you call home.</small>
      </section>
      <section style={{ display: 'grid', placeItems: 'center', padding: 28 }}>
        <form onSubmit={submit} style={{ width: 'min(100%, 400px)' }}>
          <p style={{ color: '#677970', letterSpacing: '.14em', textTransform: 'uppercase' }}>{chinese ? '顾客账户' : 'Customer account'}</p>
          <h2 style={{ fontSize: 34, margin: '8px 0 32px' }}>{title}</h2>
          <label htmlFor="customer-email" style={{ display: 'block', marginBottom: 8 }}>{chinese ? '邮箱地址' : 'Email address'}</label>
          <input id="customer-email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)}
            style={{ boxSizing: 'border-box', width: '100%', border: '1px solid #cbd2cb', borderRadius: 8, padding: '14px 12px', marginBottom: 20, background: 'white' }} />
          <label htmlFor="customer-password" style={{ display: 'block', marginBottom: 8 }}>{chinese ? '密码' : 'Password'}</label>
          <input id="customer-password" type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength={8} maxLength={128} required value={password} onChange={(event) => setPassword(event.target.value)}
            style={{ boxSizing: 'border-box', width: '100%', border: '1px solid #cbd2cb', borderRadius: 8, padding: '14px 12px', marginBottom: 22, background: 'white' }} />
          <button disabled={busy} style={{ width: '100%', border: 0, borderRadius: 8, padding: 15, background: '#253d33', color: 'white', fontSize: 16, cursor: busy ? 'wait' : 'pointer' }}>
            {busy ? (chinese ? '处理中…' : 'Please wait…') : mode === 'login' ? (chinese ? '登录' : 'Sign in') : (chinese ? '创建账户' : 'Create account')}
          </button>
          <p role="status" aria-live="polite" style={{ minHeight: 24, color: message.includes('success') || message.includes('欢迎') || message.includes('ready') ? '#28734e' : '#a34535' }}>{message}</p>
          <p style={{ color: '#677970', textAlign: 'center' }}>
            {mode === 'login' ? (chinese ? '还没有账户？' : 'New to Field / Form?') : (chinese ? '已经有账户？' : 'Already have an account?')}{' '}
            <a href={`/${market}/${mode === 'login' ? 'register' : 'login'}`} style={{ color: '#253d33', fontWeight: 600 }}>{mode === 'login' ? (chinese ? '注册' : 'Create one') : (chinese ? '登录' : 'Sign in')}</a>
          </p>
        </form>
      </section>
    </main>
  );
}
