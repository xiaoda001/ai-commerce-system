import type { Request, Response } from 'express';
import { destroySession, establishSession } from './session.util';

describe('Session helpers', () => {
  it('登录时先轮换 Session ID，再保存服务端身份', async () => {
    const calls: string[] = [];
    const request = {
      session: {
        regenerate: (callback: (error?: Error) => void) => { calls.push('regenerate'); callback(); },
        save: (callback: (error?: Error) => void) => { calls.push('save'); callback(); },
      },
    } as unknown as Request;

    await establishSession(request, { id: 'customer-1', email: 'user@example.com', kind: 'customer' });

    expect(calls).toEqual(['regenerate', 'save']);
    expect(request.session.account).toEqual({ id: 'customer-1', email: 'user@example.com', kind: 'customer' });
  });

  it('登出时销毁 Redis Session 并清除 Cookie', async () => {
    const destroy = jest.fn((callback: (error?: Error) => void) => callback());
    const request = { session: { destroy } } as unknown as Request;
    const response = { clearCookie: jest.fn() } as unknown as Response;

    await destroySession(request, response);

    expect(destroy).toHaveBeenCalledTimes(1);
    expect(response.clearCookie).toHaveBeenCalledWith('commerce.sid', { path: '/' });
  });
});
