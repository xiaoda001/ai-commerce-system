import { UnauthorizedException } from '@nestjs/common';
import type { Repository } from 'typeorm';
import { AdminUser } from '../database/entities/admin-user.entity';
import { AdminAuthService } from './admin-auth.service';
import { PasswordService } from './password.service';

describe('AdminAuthService', () => {
  const repository = { findOne: jest.fn() };
  const passwords = { verify: jest.fn() };
  let service: AdminAuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    passwords.verify.mockResolvedValue(true);
    service = new AdminAuthService(
      repository as unknown as Repository<AdminUser>,
      passwords as unknown as PasswordService,
    );
  });

  it('只认证独立管理员表中的启用账号', async () => {
    repository.findOne.mockResolvedValue({
      id: 'admin-1', email: 'ops@example.com', passwordHash: 'hash', status: 'active',
    });

    await expect(service.authenticate(' OPS@example.com ', 'long-enough-password')).resolves.toEqual({
      id: 'admin-1', email: 'ops@example.com', status: 'active',
    });
    expect(repository.findOne).toHaveBeenCalledWith(expect.objectContaining({ where: { email: 'ops@example.com' } }));
  });

  it('对不存在、禁用或错误密码使用统一拒绝响应', async () => {
    repository.findOne.mockResolvedValue(null);
    await expect(service.authenticate('missing@example.com', 'wrong-password')).rejects.toBeInstanceOf(UnauthorizedException);

    repository.findOne.mockResolvedValue({ id: 'admin-1', email: 'ops@example.com', passwordHash: 'hash', status: 'disabled' });
    await expect(service.authenticate('ops@example.com', 'wrong-password')).rejects.toThrow('邮箱或密码错误。');

    repository.findOne.mockResolvedValue({ id: 'admin-1', email: 'ops@example.com', passwordHash: 'hash', status: 'active' });
    passwords.verify.mockResolvedValue(false);
    await expect(service.authenticate('ops@example.com', 'wrong-password')).rejects.toThrow('邮箱或密码错误。');
  });
});
