import { Module } from '@nestjs/common';
import { AppConfigModule } from './config/app-config.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { CasbinModule } from './authorization/casbin.module';
import { AdminAccessModule } from './admin/admin-access.module';

@Module({ imports: [AppConfigModule, HealthModule, AuthModule, CasbinModule, AdminAccessModule] })
export class AppModule {}
