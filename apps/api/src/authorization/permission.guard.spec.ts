import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { PermissionGuard } from './permission.guard';

describe('PermissionGuard', () => {
  const authorization = { allows: jest.fn() };
  const admins = { findOne: jest.fn().mockResolvedValue({ id: 'a', status: 'active' }) };
  const guard = new PermissionGuard({ getAllAndOverride: () => 'product.read' } as never, authorization as never, admins as never);
  const context = (account?: unknown, market?: string, permission = 'product.read') => ({
    getHandler: () => Object.assign(() => undefined, { permission }),
    getClass: () => class {},
    switchToHttp: () => ({ getRequest: () => ({ session: { account }, header: () => market }) }),
  } as never);

  beforeEach(() => {
    authorization.allows.mockReset();
    admins.findOne.mockResolvedValue({ id: 'a', status: 'active' });
  });

  it('rejects anonymous requests', async () => {
    await expect(guard.canActivate(context(undefined, 'US'))).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('requires an explicit supported market', async () => {
    await expect(guard.canActivate(context({ id: 'a', kind: 'admin' }, 'CA'))).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects an administrator disabled after logging in', async () => {
    admins.findOne.mockResolvedValueOnce({ id: 'a', status: 'disabled' });
    await expect(guard.canActivate(context({ id: 'a', kind: 'admin' }, 'US'))).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('allows and denies based on the requested market domain', async () => {
    authorization.allows.mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    expect(await guard.canActivate(context({ id: 'a', kind: 'admin' }, 'US'))).toBe(true);
    await expect(guard.canActivate(context({ id: 'a', kind: 'admin' }, 'CN'))).rejects.toBeInstanceOf(ForbiddenException);
    expect(authorization.allows.mock.calls).toEqual([['a', 'US', 'product.read'], ['a', 'CN', 'product.read']]);
  });
});
