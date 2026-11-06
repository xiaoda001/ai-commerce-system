import { ConflictException, UnauthorizedException } from '@nestjs/common';
import type { Repository } from 'typeorm';
import { CustomerUser } from '../database/entities/customer-user.entity';
import { CustomerAuthService } from './customer-auth.service';
import { PasswordService } from './password.service';

describe('CustomerAuthService', () => {
  const repository = {
    findOne: jest.fn(),
    create: jest.fn((user: Partial<CustomerUser>) => user),
    save: jest.fn(),
  };
  const passwords = {
    hash: jest.fn(),
    verify: jest.fn(),
  };
  let service: CustomerAuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    repository.findOne.mockResolvedValue(null);
    repository.save.mockImplementation(async (user: Partial<CustomerUser>) => ({
      ...user,
      id: 'customer-1',
      status: 'active',
    }));
    passwords.hash.mockResolvedValue('scrypt$test-salt$test-digest');
    passwords.verify.mockResolvedValue(true);
    service = new CustomerAuthService(
      repository as unknown as Repository<CustomerUser>,
      passwords as unknown as PasswordService,
    );
  });

  it('规范化邮箱、保存密码摘要并返回不含摘要的顾客身份', async () => {
    const account = await service.register(' Shopper@Example.COM ', 'long-enough-password');

    expect(repository.findOne).toHaveBeenCalledWith({ where: { email: 'shopper@example.com' } });
    expect(passwords.hash).toHaveBeenCalledWith('long-enough-password');
    expect(repository.save).toHaveBeenCalledWith(expect.objectContaining({
      email: 'shopper@example.com',
      passwordHash: 'scrypt$test-salt$test-digest',
      status: 'active',
    }));
    expect(account).toEqual({ id: 'customer-1', email: 'shopper@example.com', status: 'active' });
    expect(account).not.toHaveProperty('passwordHash');
  });

  it('拒绝重复邮箱且不计算或保存新密码', async () => {
    repository.findOne.mockResolvedValue({ id: 'existing', email: 'shopper@example.com' });

    await expect(service.register('SHOPPER@example.com', 'long-enough-password')).rejects.toBeInstanceOf(ConflictException);
    expect(passwords.hash).not.toHaveBeenCalled();
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('仅对启用账号和正确密码返回顾客身份', async () => {
    repository.findOne.mockResolvedValue({
      id: 'customer-1',
      email: 'shopper@example.com',
      passwordHash: 'scrypt$test-salt$test-digest',
      status: 'active',
    });

    await expect(service.authenticate(' SHOPPER@example.com ', 'correct-password')).resolves.toEqual({
      id: 'customer-1',
      email: 'shopper@example.com',
      status: 'active',
    });
  });

  it('对不存在、禁用或密码错误的账号返回相同认证错误', async () => {
    await expect(service.authenticate('missing@example.com', 'wrong-password')).rejects.toBeInstanceOf(UnauthorizedException);
    repository.findOne.mockResolvedValue({
      id: 'customer-1', email: 'shopper@example.com', passwordHash: 'hash', status: 'disabled',
    });
    await expect(service.authenticate('shopper@example.com', 'wrong-password')).rejects.toThrow('邮箱或密码错误。');
    repository.findOne.mockResolvedValue({
      id: 'customer-1', email: 'shopper@example.com', passwordHash: 'hash', status: 'active',
    });
    passwords.verify.mockResolvedValue(false);
    await expect(service.authenticate('shopper@example.com', 'wrong-password')).rejects.toThrow('邮箱或密码错误。');
  });
});
