import { createApiTypeOrmOptions } from './api-typeorm-options';

describe('createApiTypeOrmOptions', () => {
  const config = {
    host: '127.0.0.1',
    port: 3306,
    database: 'commerce_test',
    username: 'commerce_test',
    password: 'local-test-password',
  };

  it('注册认证实体和显式迁移，并关闭自动同步', () => {
    const options = createApiTypeOrmOptions(config);
    const entityNames = (options.entities as Array<{ name: string }>).map((entity) => entity.name);
    const migrationNames = (options.migrations as Array<{ name: string }>).map((migration) => migration.name);

    expect(options.synchronize).toBe(false);
    expect(entityNames).toEqual(['CustomerUser', 'AdminUser', 'Role', 'CasbinRule']);
    expect(migrationNames).toContain('CreateIdentityAndAuthorizationTables1793923200000');
  });
});
