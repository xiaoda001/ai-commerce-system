import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminUser } from '../database/entities/admin-user.entity';
import { Role } from '../database/entities/role.entity';
import { PasswordService } from '../auth/password.service';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';

@Module({
  imports: [TypeOrmModule.forFeature([Role, AdminUser])],
  controllers: [RolesController],
  providers: [RolesService, PasswordService],
})
export class AdminAccessModule {}
