import { Alert, Button, Card, Form, Input, Space, Typography } from 'antd';
import { useState } from 'react';
import { useAdminAuth } from './AdminAuthContext';

export default function AdminLoginPage() {
  const { login } = useAdminAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(values: { email: string; password: string }) {
    setBusy(true);
    setError('');
    try { await login(values.email, values.password); }
    catch (reason) { setError(reason instanceof Error ? reason.message : '登录失败，请重试。'); }
    finally { setBusy(false); }
  }

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, background: 'linear-gradient(145deg, #e7ebe6, #f5f6f2)' }}>
      <Card style={{ width: 'min(100%, 420px)', borderRadius: 16 }} styles={{ body: { padding: 36 } }}>
        <Space orientation="vertical" size={8} style={{ display: 'flex', marginBottom: 28 }}>
          <Typography.Text type="secondary">FIELD / FORM · OPERATIONS</Typography.Text>
          <Typography.Title level={2} style={{ margin: 0 }}>管理后台登录</Typography.Title>
          <Typography.Text type="secondary">请使用已初始化的管理员邮箱和密码。</Typography.Text>
        </Space>
        {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 20 }} />}
        <Form layout="vertical" onFinish={(values: { email: string; password: string }) => void submit(values)}>
          <Form.Item label="邮箱" name="email" rules={[{ required: true }, { type: 'email', message: '请输入有效邮箱。' }]}>
            <Input autoComplete="username" size="large" />
          </Form.Item>
          <Form.Item label="密码" name="password" rules={[{ required: true }]}>
            <Input.Password autoComplete="current-password" size="large" />
          </Form.Item>
          <Button block type="primary" htmlType="submit" size="large" loading={busy}>登录</Button>
        </Form>
      </Card>
    </main>
  );
}
