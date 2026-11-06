import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomerUser } from '../database/entities/customer-user.entity';
import { normalizeEmail } from './email.util';
import { PasswordService } from './password.service';

export interface CustomerIdentity {
  id: string;
  email: string;
  status: 'active';
}

@Injectable()
export class CustomerAuthService {
  constructor(
    @InjectRepository(CustomerUser) private readonly users: Repository<CustomerUser>,
    private readonly passwords: PasswordService,
  ) {}

  async register(email: string, password: string): Promise<CustomerIdentity> {
    const normalizedEmail = normalizeEmail(email);
    if (await this.users.findOne({ where: { email: normalizedEmail } })) {
      throw new ConflictException('该邮箱已注册。');
    }

    const user = this.users.create({
      email: normalizedEmail,
      passwordHash: await this.passwords.hash(password),
      status: 'active',
    });
    try {
      const saved = await this.users.save(user);
      return this.toIdentity(saved);
    } catch (error) {
      if (this.isDuplicateEmailError(error)) throw new ConflictException('该邮箱已注册。');
      throw error;
    }
  }

  async authenticate(email: string, password: string): Promise<CustomerIdentity> {
    const normalizedEmail = normalizeEmail(email);
    const user = await this.users.findOne({
      where: { email: normalizedEmail },
      select: { id: true, email: true, passwordHash: true, status: true },
    });
    if (!user || user.status !== 'active' || !await this.passwords.verify(password, user.passwordHash)) {
      throw new UnauthorizedException('邮箱或密码错误。');
    }
    return this.toIdentity(user);
  }

  async getIdentity(id: string): Promise<CustomerIdentity> {
    const user = await this.users.findOne({ where: { id }, select: { id: true, email: true, status: true } });
    if (!user || user.status !== 'active') throw new UnauthorizedException('登录状态已失效。');
    return this.toIdentity(user);
  }

  private toIdentity(user: CustomerUser): CustomerIdentity {
    return { id: user.id, email: user.email, status: 'active' };
  }

  private isDuplicateEmailError(error: unknown): boolean {
    return typeof error === 'object' && error !== null && 'code' in error && error.code === 'ER_DUP_ENTRY';
  }
}
