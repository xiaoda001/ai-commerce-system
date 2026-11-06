import { ConflictException, NotFoundException } from '@nestjs/common';
import { RolesService } from './roles.service';

describe('RolesService', () => {
  const roles = { find: jest.fn(), findOneBy: jest.fn(), create: jest.fn((value) => value), save: jest.fn() };
  const admins = { findOneBy: jest.fn(), create: jest.fn((value) => value), save: jest.fn() };
  const authorization = { grantRolePermission: jest.fn(), bindAdminRole: jest.fn() };
  const passwords = { hash: jest.fn().mockResolvedValue('encoded') };
  const service = new RolesService(roles as never, admins as never, authorization as never, passwords as never);

  beforeEach(() => {
    jest.clearAllMocks();
    passwords.hash.mockResolvedValue('encoded');
  });

  it('rejects duplicate role codes', async () => {
    roles.findOneBy.mockResolvedValueOnce({ code: 'catalog' });
    await expect(service.createRole({ code: 'catalog', name: '商品管理' })).rejects.toBeInstanceOf(ConflictException);
  });

  it('only writes a permission after confirming the role exists', async () => {
    roles.findOneBy.mockResolvedValueOnce(null);
    await expect(service.grantPermission('missing', 'US', 'product.read')).rejects.toBeInstanceOf(NotFoundException);
    expect(authorization.grantRolePermission).not.toHaveBeenCalled();
    roles.findOneBy.mockResolvedValueOnce({ code: 'catalog' });
    await service.grantPermission('catalog', 'US', 'product.read');
    expect(authorization.grantRolePermission).toHaveBeenCalledWith('catalog', 'US', 'product.read');
  });

  it('normalizes email and hashes passwords when creating an admin', async () => {
    admins.findOneBy.mockResolvedValueOnce(null);
    admins.save.mockImplementation(async (admin) => ({ id: 'admin-id', ...admin }));
    await expect(service.createAdmin(' Admin@Example.com ', 'local-password'))
      .resolves.toEqual({ id: 'admin-id', email: 'admin@example.com', status: 'active' });
    expect(passwords.hash).toHaveBeenCalledWith('local-password');
  });
});
