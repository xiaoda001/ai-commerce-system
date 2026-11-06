import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdminUser } from '../database/entities/admin-user.entity';
import { Role } from '../database/entities/role.entity';
import { AuthorizationService } from '../authorization/authorization.service';
import type { PermissionCode } from '../authorization/permissions';
import { normalizeEmail } from '../auth/email.util';
import { PasswordService } from '../auth/password.service';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role) private readonly roles: Repository<Role>,
    @InjectRepository(AdminUser) private readonly admins: Repository<AdminUser>,
    private readonly authorization: AuthorizationService,
    private readonly passwords: PasswordService,
  ) {}

  listRoles() { return this.roles.find({ order: { code: 'ASC' } }); }

  async createRole(input: { code: string; name: string; description?: string }): Promise<Role> {
    if (await this.roles.findOneBy({ code: input.code })) throw new ConflictException('角色代码已存在。');
    return this.roles.save(this.roles.create({ ...input, description: input.description || null, isSystem: false }));
  }

  async grantPermission(code: string, market: 'US' | 'CN', permission: PermissionCode): Promise<void> {
    const role = await this.roles.findOneBy({ code });
    if (!role) throw new NotFoundException('角色不存在。');
    await this.authorization.grantRolePermission(role.code, market, permission);
  }

  async createAdmin(email: string, password: string): Promise<Pick<AdminUser, 'id' | 'email' | 'status'>> {
    const normalizedEmail = normalizeEmail(email);
    if (await this.admins.findOneBy({ email: normalizedEmail })) throw new ConflictException('管理员邮箱已存在。');
    const admin = await this.admins.save(this.admins.create({
      email: normalizedEmail, passwordHash: await this.passwords.hash(password), status: 'active',
    }));
    return { id: admin.id, email: admin.email, status: admin.status };
  }

  async bindRole(adminId: string, roleCode: string, market: 'US' | 'CN'): Promise<void> {
    const [admin, role] = await Promise.all([
      this.admins.findOneBy({ id: adminId }), this.roles.findOneBy({ code: roleCode }),
    ]);
    if (!admin) throw new NotFoundException('管理员不存在。');
    if (!role) throw new NotFoundException('角色不存在。');
    await this.authorization.bindAdminRole(admin.id, role.code, market);
  }

  async disableAdmin(adminId: string): Promise<void> {
    const admin = await this.admins.findOneBy({ id: adminId });
    if (!admin) throw new NotFoundException('管理员不存在。');
    admin.status = 'disabled';
    await this.admins.save(admin);
  }
}
