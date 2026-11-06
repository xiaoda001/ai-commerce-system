import type { Request } from 'express';
import { AdminAuthController } from './admin-auth.controller';
import { AdminAuthService } from './admin-auth.service';

describe('AdminAuthController', () => {
  it('管理员登录建立 admin 类型 Session', async () => {
    const account = { id: 'admin-1', email: 'ops@example.com', status: 'active' as const };
    const auth = { authenticate: jest.fn().mockResolvedValue(account) } as unknown as AdminAuthService;
    const request = {
      session: {
        regenerate: (callback: (error?: Error) => void) => callback(),
        save: (callback: (error?: Error) => void) => callback(),
      },
    } as unknown as Request;
    const controller = new AdminAuthController(auth);

    await expect(controller.login({ email: account.email, password: 'long-enough-password' }, request)).resolves.toEqual(account);
    expect(request.session.account).toEqual({ ...account, kind: 'admin' });
  });

  it('管理员接口只接收管理员 Session', async () => {
    const auth = { getIdentity: jest.fn().mockResolvedValue({ id: 'admin-1' }) } as unknown as AdminAuthService;
    const controller = new AdminAuthController(auth);
    const request = { session: { account: { id: 'customer-1', email: 'user@example.com', kind: 'customer' } } } as unknown as Request;

    await expect(controller.me(request)).rejects.toThrow('请先登录。');
  });
});
