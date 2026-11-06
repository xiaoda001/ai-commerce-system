import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerUser } from '../database/entities/customer-user.entity';
import { AdminUser } from '../database/entities/admin-user.entity';
import { AdminAuthController } from './admin-auth.controller';
import { AdminAuthService } from './admin-auth.service';
import { CsrfController } from './csrf.controller';
import { CustomerAuthController } from './customer-auth.controller';
import { CustomerAuthService } from './customer-auth.service';
import { PasswordService } from './password.service';

@Module({
  imports: [TypeOrmModule.forFeature([CustomerUser, AdminUser])],
  controllers: [CsrfController, CustomerAuthController, AdminAuthController],
  providers: [CustomerAuthService, AdminAuthService, PasswordService],
  exports: [CustomerAuthService, PasswordService],
})
export class AuthModule {}
