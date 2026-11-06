import { Alert, Button, Card, Form, Input, message, Select, Space, Table, Tabs, Typography } from 'antd';
import { useCallback, useEffect, useState } from 'react';

type Market = 'US' | 'CN';
type Role = { id: string; code: string; name: string; description: string | null; isSystem: boolean };
const permissions = ['admin.role.manage', 'admin.account.manage', 'product.read', 'product.manage', 'order.read', 'order.manage'];

export default function AdminRolesPage({ apiBaseUrl, market }: { apiBaseUrl: string; market: Market }) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissionsForRole, setPermissionsForRole] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const base = apiBaseUrl.replace(/\/$/, '');

  const request = useCallback(async (path: string, init: RequestInit = {}) => {
    const response = await fetch(`${base}${path}`, {
      ...init, credentials: 'include',
      headers: { 'X-Market': market, ...(init.headers || {}) },
    });
    if (!response.ok) {
      const result = await response.json().catch(() => ({})) as { message?: string };
      throw new Error(result.message || `请求失败 (${response.status})`);
    }
    return response.status === 204 ? null : response.json() as Promise<unknown>;
  }, [base, market]);

  const loadRoles = useCallback(async () => {
    try { setError(''); setRoles(await request('/admin/roles') as Role[]); }
    catch (reason) { setError(reason instanceof Error ? reason.message : '无法读取角色列表。'); }
  }, [request]);

  useEffect(() => { void loadRoles(); }, [loadRoles]);

  async function mutate(path: string, method: string, body: unknown) {
    setBusy(true);
    try {
      const csrfResponse = await fetch(`${base}/auth/csrf`, { credentials: 'include' });
      if (!csrfResponse.ok) throw new Error('CSRF 校验准备失败，请重新登录。');
      const { csrfToken } = await csrfResponse.json() as { csrfToken: string };
      await request(path, { method, headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken }, body: JSON.stringify(body) });
      await loadRoles();
      message.success('已保存');
    } catch (reason) {
      const text = reason instanceof Error ? reason.message : '操作失败。';
      setError(text);
      message.error(text);
    } finally { setBusy(false); }
  }

  async function loadPermissions(code: string) {
    try {
      setPermissionsForRole(await request(`/admin/roles/${encodeURIComponent(code)}/permissions/${market}`) as string[]);
    } catch (reason) { setError(reason instanceof Error ? reason.message : '无法读取角色权限。'); }
  }

  return (
    <Space orientation="vertical" size={20} style={{ display: 'flex' }}>
      <div><Typography.Title level={2} style={{ marginBottom: 4 }}>角色与权限</Typography.Title><Typography.Text type="secondary">当前市场：{market}。服务端会再次校验每项操作权限。</Typography.Text></div>
      {error && <Alert type="warning" showIcon message={error} />}
      <Tabs items={[
        { key: 'roles', label: '角色配置', children: <Space orientation="vertical" style={{ display: 'flex' }}>
          <Card title="角色列表"><Table rowKey="id" dataSource={roles} pagination={false} columns={[
            { title: '代码', dataIndex: 'code' }, { title: '名称', dataIndex: 'name' },
            { title: '类型', dataIndex: 'isSystem', render: (value: boolean) => value ? '系统' : '自定义' },
            { title: '操作', render: (_, role: Role) => <Button type="link" onClick={() => void loadPermissions(role.code)}>查看权限</Button> },
          ]} />{permissionsForRole.length > 0 && <Typography.Text>当前市场权限：{permissionsForRole.join('、')}</Typography.Text>}</Card>
          <Card title="创建角色"><Form layout="inline" onFinish={(values: { code: string; name: string; description?: string }) => void mutate('/admin/roles', 'POST', values)}>
            <Form.Item name="code" rules={[{ required: true }]}><Input placeholder="角色代码" /></Form.Item>
            <Form.Item name="name" rules={[{ required: true }]}><Input placeholder="角色名称" /></Form.Item>
            <Form.Item name="description"><Input placeholder="说明（可选）" /></Form.Item>
            <Button htmlType="submit" type="primary" loading={busy}>创建</Button>
          </Form></Card>
        </Space> },
        { key: 'permission', label: '分配权限', children: <Card title="将权限授予角色"><Form layout="vertical" onFinish={(values: { roleCode: string; permission: string }) => void mutate(`/admin/roles/${encodeURIComponent(values.roleCode)}/permissions`, 'POST', { market, permission: values.permission })}>
          <Form.Item name="roleCode" label="角色" rules={[{ required: true }]}><Select options={roles.map((role) => ({ value: role.code, label: `${role.name} (${role.code})` }))} /></Form.Item>
          <Form.Item name="permission" label="权限点" rules={[{ required: true }]}><Select options={permissions.map((value) => ({ value, label: value }))} /></Form.Item>
          <Button type="primary" htmlType="submit" loading={busy}>授予当前市场</Button>
        </Form></Card> },
        { key: 'accounts', label: '管理员账号', children: <Space orientation="vertical" style={{ display: 'flex' }}>
          <Card title="创建管理员"><Form layout="vertical" onFinish={(values: { email: string; password: string }) => void mutate('/admin/accounts', 'POST', values)}>
            <Form.Item name="email" label="邮箱" rules={[{ required: true }, { type: 'email' }]}><Input /></Form.Item>
            <Form.Item name="password" label="初始密码" rules={[{ required: true, min: 8 }]}><Input.Password /></Form.Item>
            <Button type="primary" htmlType="submit" loading={busy}>创建账号</Button>
          </Form></Card>
          <Card title="绑定角色"><Form layout="inline" onFinish={(values: { id: string; roleCode: string }) => void mutate(`/admin/accounts/${encodeURIComponent(values.id)}/roles`, 'POST', { roleCode: values.roleCode, market })}>
            <Form.Item name="id" rules={[{ required: true }]}><Input placeholder="管理员 ID" /></Form.Item>
            <Form.Item name="roleCode" rules={[{ required: true }]}><Select style={{ minWidth: 180 }} options={roles.map((role) => ({ value: role.code, label: role.name }))} /></Form.Item>
            <Button type="primary" htmlType="submit" loading={busy}>绑定到 {market}</Button>
          </Form></Card>
        </Space> },
      ]} />
    </Space>
  );
}
