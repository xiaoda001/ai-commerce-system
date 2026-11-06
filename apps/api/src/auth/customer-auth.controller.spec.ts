import type { Request } from 'express';
import { CustomerAuthController } from './customer-auth.controller';
import { CustomerAuthService } from './customer-auth.service';

describe('CustomerAuthController', () => {
  it('登录后建立 customer Session 并只返回公开身份', async () => {
    const account = { id: 'customer-1', email: 'user@example.com', status: 'active' as const };
    const auth = {
      authenticate: jest.fn().mockResolvedValue(account),
    } as unknown as CustomerAuthService;
    const request = {
      session: {
        regenerate: (callback: (error?: Error) => void) => callback(),
        save: (callback: (error?: Error) => void) => callback(),
      },
    } as unknown as Request;
    const controller = new CustomerAuthController(auth);

    await expect(controller.login({ email: 'user@example.com', password: 'long-enough-password' }, request)).resolves.toEqual(account);
    expect(request.session.account).toEqual({ ...account, kind: 'customer' });
    expect(auth.authenticate).toHaveBeenCalledWith('user@example.com', 'long-enough-password');
  });
});
