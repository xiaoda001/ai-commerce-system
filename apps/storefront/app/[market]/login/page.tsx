import AuthForm from '../auth-form';

export default async function CustomerLoginPage({ params }: { params: Promise<{ market: string }> }) {
  const { market } = await params;
  if (market !== 'us' && market !== 'cn') return <main><h1>Market unavailable</h1></main>;
  return <AuthForm market={market} mode="login" />;
}
