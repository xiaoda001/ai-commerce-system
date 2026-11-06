export default function ChinaPage() {
  return (
    <main style={{ maxWidth: 1080, margin: '0 auto', padding: '40px 24px', color: '#253d33' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <a href="/cn" style={{ color: 'inherit', fontWeight: 700, letterSpacing: '.12em', textDecoration: 'none' }}>FIELD / FORM</a>
        <nav aria-label="顾客账户" style={{ display: 'flex', gap: 20 }}><a href="/cn/login">登录</a><a href="/cn/register">注册</a><a href="/cn/account">我的账户</a></nav>
      </header>
      <p style={{ marginTop: 100, color: '#677970', letterSpacing: '.16em' }}>中国 · CNY</p>
      <h1 style={{ maxWidth: 720, fontSize: 'clamp(44px, 8vw, 88px)', lineHeight: 1.12 }}>好物，值得慢慢发现。</h1>
      <p style={{ maxWidth: 520, color: '#677970', fontSize: 18, lineHeight: 1.8 }}>为日常生活精选的设计好物。</p>
      <a href="/" style={{ display: 'inline-block', marginTop: 36, color: '#253d33' }}>切换市场</a>
    </main>
  );
}
