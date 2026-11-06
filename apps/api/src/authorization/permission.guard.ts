import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import type { Request } from 'express';
import { Repository } from 'typeorm';
import { AdminUser } from '../database/entities/admin-user.entity';
import { AuthorizationService } from './authorization.service';
import { REQUIRED_PERMISSION } from './permission.decorator';
import type { PermissionCode } from './permissions';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authorization: AuthorizationService,
    @InjectRepository(AdminUser) private readonly admins: Repository<AdminUser>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const permission = this.reflector.getAllAndOverride<PermissionCode>(REQUIRED_PERMISSION, [context.getHandler(), context.getClass()]);
    if (!permission) return true;
    const request = context.switchToHttp().getRequest<Request>();
    const account = request.session.account;
    if (!account || account.kind !== 'admin') throw new UnauthorizedException('请先登录。');
    const admin = await this.admins.findOne({ where: { id: account.id }, select: { id: true, status: true } });
    if (!admin || admin.status !== 'active') throw new UnauthorizedException('登录状态已失效。');
    const market = request.header('x-market');
    if (market !== 'US' && market !== 'CN') throw new ForbiddenException('必须指定有效市场。');
    if (!await this.authorization.allows(account.id, market, permission)) throw new ForbiddenException('当前账号无权执行此操作。');
    return true;
  }
}
