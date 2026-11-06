import { Global, Module } from '@nestjs/common';
import { getDataSourceToken, TypeOrmModule } from '@nestjs/typeorm';
import { newEnforcer, newModelFromString } from 'casbin';
import TypeORMAdapter from 'typeorm-adapter/lib/adapter';
import type { DataSource } from 'typeorm';
import { AuthorizationService, CASBIN_ENFORCER } from './authorization.service';
import { PermissionGuard } from './permission.guard';
import { AdminUser } from '../database/entities/admin-user.entity';
import { CasbinRule } from '../database/entities/casbin-rule.entity';
import { CASBIN_MODEL } from './casbin.model';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([AdminUser])],
  providers: [
    {
      provide: CASBIN_ENFORCER,
      inject: [getDataSourceToken()],
      useFactory: async (dataSource: DataSource) => {
        if (!dataSource.isInitialized) await dataSource.initialize();
        // Adapter 自带的 TypeORM 类型与 Nest 当前版本声明不同，运行时共享的是 DataSource 公共接口。
        const adapter = await TypeORMAdapter.newAdapter(
          { connection: dataSource as never },
          { customCasbinRuleEntity: CasbinRule as never },
        );
        return newEnforcer(newModelFromString(CASBIN_MODEL), adapter);
      },
    },
    {
      provide: AuthorizationService,
      inject: [CASBIN_ENFORCER],
      useFactory: (enforcer: ConstructorParameters<typeof AuthorizationService>[0]) => new AuthorizationService(enforcer),
    },
    PermissionGuard,
  ],
  exports: [AuthorizationService, PermissionGuard],
})
export class CasbinModule {}
