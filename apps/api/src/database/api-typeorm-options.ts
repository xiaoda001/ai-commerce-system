import type { DataSourceOptions } from 'typeorm';
import { createTypeOrmOptions, DatabaseConfig } from '@commerce/data-access';
import { AdminUser } from './entities/admin-user.entity';
import { CustomerUser } from './entities/customer-user.entity';
import { Role } from './entities/role.entity';
import { CreateIdentityAndAuthorizationTables1793923200000 } from './migrations/1793923200000-CreateIdentityAndAuthorizationTables';
import { CasbinRule } from './entities/casbin-rule.entity';

// API 和迁移命令共用同一份实体、迁移配置，避免只在某一运行入口漏注册。
export function createApiTypeOrmOptions(config: DatabaseConfig): DataSourceOptions {
  return {
    ...createTypeOrmOptions(config),
    entities: [CustomerUser, AdminUser, Role, CasbinRule],
    migrations: [CreateIdentityAndAuthorizationTables1793923200000],
  };
}
