import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdminUser } from '../database/entities/admin-user.entity';
import { normalizeEmail } from './email.util';
import { PasswordService } from './password.service';

export interface AdminIdentity {
  id: string;
  email: string;
  status: 'active';
}

@Injectable()
export class AdminAuthService {
  constructor(
    @InjectRepository(AdminUser) private readonly admins: Repository<AdminUser>,
    private readonly passwords: PasswordService,
  ) {}

  async authenticate(email: string, password: string): Promise<AdminIdentity> {
    const normalizedEmail = normalizeEmail(email);
    const admin = await this.admins.findOne({
      where: { email: normalizedEmail },
      select: { id: true, email: true, passwordHash: true, status: true },
    });
    if (!admin || admin.status !== 'active' || !await this.passwords.verify(password, admin.passwordHash)) {
      throw new UnauthorizedException('邮箱或密码错误。');
    }
    return this.toIdentity(admin);
  }

  async getIdentity(id: string): Promise<AdminIdentity> {
    const admin = await this.admins.findOne({ where: { id }, select: { id: true, email: true, status: true } });
    if (!admin || admin.status !== 'active') throw new UnauthorizedException('登录状态已失效。');
    return this.toIdentity(admin);
  }

  private toIdentity(admin: AdminUser): AdminIdentity {
    return { id: admin.id, email: admin.email, status: 'active' };
  }
}
