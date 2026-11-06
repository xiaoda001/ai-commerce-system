import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { createApiTypeOrmOptions } from './api-typeorm-options';
import { AppConfigModule } from '../config/app-config.module';
import { AppEnvironment } from '../config/validate-env';

async function runMigrations(): Promise<void> {
  const context = await NestFactory.createApplicationContext(AppConfigModule, { logger: false });
  const config = context.get(ConfigService<AppEnvironment, true>);
  const dataSource = new DataSource(createApiTypeOrmOptions({
    host: config.get('DB_HOST', { infer: true }),
    port: config.get('DB_PORT', { infer: true }),
    database: config.get('DB_NAME', { infer: true }),
    username: config.get('DB_USER', { infer: true }),
    password: config.get('DB_PASSWORD', { infer: true }),
  }));

  try {
    await dataSource.initialize();
    const isRevert = process.argv.includes('--revert');
    const migrations = isRevert
      ? [await dataSource.undoLastMigration()]
      : await dataSource.runMigrations();
    console.info(`数据库迁移${isRevert ? '回滚' : '执行'}完成：${migrations.length} 项。`);
  } catch {
    console.error('数据库迁移失败。请确认连接配置和数据库权限后重试。');
    process.exitCode = 1;
  } finally {
    if (dataSource.isInitialized) await dataSource.destroy();
    await context.close();
  }
}

void runMigrations();
