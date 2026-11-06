export default function UnitedStatesPage() {
  return (
    <main style={{ maxWidth: 1080, margin: '0 auto', padding: '40px 24px', color: '#253d33' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <a href="/us" style={{ color: 'inherit', fontWeight: 700, letterSpacing: '.12em', textDecoration: 'none' }}>FIELD / FORM</a>
        <nav aria-label="Customer account" style={{ display: 'flex', gap: 20 }}><a href="/us/login">Sign in</a><a href="/us/register">Create account</a><a href="/us/account">My account</a></nav>
      </header>
      <p style={{ marginTop: 100, color: '#677970', letterSpacing: '.16em', textTransform: 'uppercase' }}>United States · USD</p>
      <h1 style={{ maxWidth: 720, fontSize: 'clamp(44px, 8vw, 88px)', lineHeight: 1.02 }}>Thoughtful goods for everyday living.</h1>
      <p style={{ maxWidth: 520, color: '#677970', fontSize: 18, lineHeight: 1.7 }}>A considered collection for home, work, and the spaces in between.</p>
      <a href="/" style={{ display: 'inline-block', marginTop: 36, color: '#253d33' }}>Choose another market</a>
    </main>
  );
}
