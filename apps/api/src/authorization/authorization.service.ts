import { Injectable } from '@nestjs/common';
import type { Enforcer } from 'casbin';
import { PERMISSIONS } from './permissions';
import type { PermissionCode } from './permissions';

export const CASBIN_ENFORCER = Symbol('CASBIN_ENFORCER');

@Injectable()
export class AuthorizationService {
  constructor(private readonly enforcer: Enforcer) {}

  async allows(subject: string, market: 'US' | 'CN', permission: PermissionCode): Promise<boolean> {
    const { object, action } = PERMISSIONS[permission];
    return this.enforcer.enforce(subject, market, object, action);
  }

  async reload(): Promise<void> {
    await this.enforcer.loadPolicy();
  }

  async grantRolePermission(role: string, market: 'US' | 'CN', permission: PermissionCode): Promise<void> {
    const { object, action } = PERMISSIONS[permission];
    await this.enforcer.addPolicy(role, market, object, action);
  }

  async bindAdminRole(adminId: string, role: string, market: 'US' | 'CN'): Promise<void> {
    await this.enforcer.addGroupingPolicy(adminId, role, market);
  }

  async getRolePermissions(role: string, market: 'US' | 'CN'): Promise<PermissionCode[]> {
    const rules = await this.enforcer.getFilteredPolicy(0, role, market);
    const permissions = new Set<PermissionCode>();
    for (const [, , object, action] of rules) {
      for (const [code, value] of Object.entries(PERMISSIONS)) {
        if (value.object === object && value.action === action) permissions.add(code as PermissionCode);
      }
    }
    return [...permissions];
  }
}
