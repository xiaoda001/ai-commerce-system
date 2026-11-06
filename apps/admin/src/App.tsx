import { Button, Layout, Select, Space, Spin, Typography } from 'antd';
import { useState } from 'react';
import AdminLoginPage from './auth/AdminLoginPage';
import { AdminAuthProvider, useAdminAuth } from './auth/AdminAuthContext';
import AdminRolesPage from './roles/AdminRolesPage';

export default function App({ apiBaseUrl = 'http://127.0.0.1:3001' }: { apiBaseUrl?: string }) {
  return <AdminAuthProvider apiBaseUrl={apiBaseUrl}><AdminWorkspace apiBaseUrl={apiBaseUrl} /></AdminAuthProvider>;
}

function AdminWorkspace({ apiBaseUrl }: { apiBaseUrl: string }) {
  const { account, loading, logout } = useAdminAuth();
  const [market, setMarket] = useState<'US' | 'CN'>('US');
  if (loading) return <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}><Spin size="large" /></main>;
  if (!account) return <AdminLoginPage />;

  return (
    <Layout style={{ minHeight: '100vh', background: '#f2f4f1' }}>
      <Layout.Header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingInline: 28, background: '#20372e' }}>
        <Typography.Title level={4} style={{ color: 'white', margin: 0 }}>FIELD / FORM · ADMIN</Typography.Title>
        <Space>
          <Typography.Text style={{ color: '#e7eee8' }}>{account.email}</Typography.Text>
          <Select aria-label="管理市场" value={market} onChange={setMarket} options={[{ value: 'US', label: 'US · USD' }, { value: 'CN', label: 'CN · CNY' }]} style={{ width: 130 }} />
          <Button onClick={() => void logout()}>退出</Button>
        </Space>
      </Layout.Header>
      <Layout.Content style={{ width: 'min(1120px, 100%)', margin: '36px auto', padding: '0 24px' }}>
        <nav aria-label="管理导航" style={{ marginBottom: 24 }}>
          <a href={`${apiBaseUrl.replace(/\/$/, '')}/health/live`} target="_blank" rel="noreferrer">API 健康状态</a>
        </nav>
        <AdminRolesPage apiBaseUrl={apiBaseUrl} market={market} />
      </Layout.Content>
    </Layout>
  );
}
