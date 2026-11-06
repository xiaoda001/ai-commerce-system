import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { createTypeOrmOptions } from '@commerce/data-access';
import { WorkerEnvironment } from '../config/validate-env';

@Module({
  imports: [TypeOrmModule.forRootAsync({
    inject: [ConfigService],
    useFactory: (config: ConfigService<WorkerEnvironment, true>): TypeOrmModuleOptions => ({
      ...createTypeOrmOptions({
        host: config.get('DB_HOST', { infer: true }),
        port: config.get('DB_PORT', { infer: true }),
        database: config.get('DB_NAME', { infer: true }),
        username: config.get('DB_USER', { infer: true }),
        password: config.get('DB_PASSWORD', { infer: true }),
      }),
      manualInitialization: true,
      retryAttempts: 0,
    }),
  })],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
