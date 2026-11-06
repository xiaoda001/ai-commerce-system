import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { DataSource } from 'typeorm';
import { AppConfigModule } from '../config/app-config.module';
import type { AppEnvironment } from '../config/validate-env';
import { createApiTypeOrmOptions } from '../database/api-typeorm-options';
import { AdminUser } from '../database/entities/admin-user.entity';
import { Role } from '../database/entities/role.entity';
import { normalizeEmail } from '../auth/email.util';
import { PasswordService } from '../auth/password.service';
import { PERMISSIONS } from '../authorization/permissions';

async function bootstrapAdmin(): Promise<void> {
  const context = await NestFactory.createApplicationContext(AppConfigModule, { logger: false });
  const config = context.get(ConfigService<AppEnvironment, true>);
  const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim();
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
  if (!email || !password || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error('请在本地 .env 配置有效的 BOOTSTRAP_ADMIN_EMAIL 和 BOOTSTRAP_ADMIN_PASSWORD。');
    process.exitCode = 1;
    await context.close();
    return;
  }

  const dataSource = new DataSource(createApiTypeOrmOptions({
    host: config.get('DB_HOST', { infer: true }),
    port: config.get('DB_PORT', { infer: true }),
    database: config.get('DB_NAME', { infer: true }),
    username: config.get('DB_USER', { infer: true }),
    password: config.get('DB_PASSWORD', { infer: true }),
  }));
  try {
    await dataSource.initialize();
    const normalizedEmail = normalizeEmail(email);
    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const admins = queryRunner.manager.getRepository(AdminUser);
      if (await admins.findOneBy({ email: normalizedEmail })) {
        throw new Error('该邮箱已存在管理员账号，初始化已安全拒绝。');
      }
      const roles = queryRunner.manager.getRepository(Role);
      const role = await roles.findOneBy({ code: 'super_admin' }) ?? await roles.save(roles.create({
        code: 'super_admin', name: '超级管理员', description: '初始化创建的系统角色', isSystem: true,
      }));
      const admin = await admins.save(admins.create({
        id: randomUUID(), email: normalizedEmail, passwordHash: await new PasswordService().hash(password), status: 'active',
      }));
      const policies: Array<[string, string[]]> = [];
      for (const market of ['US', 'CN'] as const) {
        policies.push(['g', [admin.id, role.code, market]]);
        for (const permission of Object.values(PERMISSIONS)) {
          policies.push(['p', [role.code, market, permission.object, permission.action]]);
        }
      }
      for (const [ptype, values] of policies) {
        const columns = ['v0', 'v1', 'v2', 'v3', 'v4', 'v5', 'v6'].slice(0, values.length);
        const placeholders = values.map(() => '?').join(', ');
        await queryRunner.query(
          `INSERT INTO casbin_rule (ptype, ${columns.join(', ')}) VALUES (?, ${placeholders})`,
          [ptype, ...values],
        );
      }
      await queryRunner.commitTransaction();
      console.info('超级管理员初始化完成。请从本地 .env 移除一次性邮箱和密码，并重启 API 以加载 Casbin 权限策略。');
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  } catch (error) {
    const message = error instanceof Error && error.message === '该邮箱已存在管理员账号，初始化已安全拒绝。'
      ? error.message
      : '超级管理员初始化失败，请确认数据库迁移和连接配置后重试。';
    console.error(message);
    process.exitCode = 1;
  } finally {
    if (dataSource.isInitialized) await dataSource.destroy();
    await context.close();
  }
}

void bootstrapAdmin();
