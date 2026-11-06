import { Body, Controller, ForbiddenException, Get, HttpCode, HttpStatus, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { RequirePermission } from '../authorization/permission.decorator';
import { PermissionGuard } from '../authorization/permission.guard';
import { AuthorizationService } from '../authorization/authorization.service';
import { BindAdminRoleDto, CreateAdminDto, CreateRoleDto, GrantRolePermissionDto } from './dto/admin-management.dto';
import { RolesService } from './roles.service';

@Controller('admin')
@UseGuards(PermissionGuard)
export class RolesController {
  constructor(private readonly roles: RolesService, private readonly authorization: AuthorizationService) {}

  @Get('roles')
  @RequirePermission('admin.role.manage')
  listRoles() { return this.roles.listRoles(); }

  @Post('roles')
  @RequirePermission('admin.role.manage')
  createRole(@Body() body: CreateRoleDto) { return this.roles.createRole(body); }

  @Get('roles/:code/permissions/:market')
  @RequirePermission('admin.role.manage')
  async rolePermissions(@Param('code') code: string, @Param('market') market: string, @Req() request: Request) {
    this.assertMarket(request, market);
    return this.authorization.getRolePermissions(code, market);
  }

  @Post('roles/:code/permissions')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission('admin.role.manage')
  async grantPermission(@Param('code') code: string, @Body() body: GrantRolePermissionDto, @Req() request: Request): Promise<void> {
    this.assertMarket(request, body.market);
    await this.roles.grantPermission(code, body.market, body.permission);
  }

  @Post('accounts')
  @RequirePermission('admin.account.manage')
  createAdmin(@Body() body: CreateAdminDto) { return this.roles.createAdmin(body.email, body.password); }

  @Post('accounts/:id/roles')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission('admin.account.manage')
  async bindRole(@Param('id') id: string, @Body() body: BindAdminRoleDto, @Req() request: Request): Promise<void> {
    this.assertMarket(request, body.market);
    await this.roles.bindRole(id, body.roleCode, body.market);
  }

  @Patch('accounts/:id/disable')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission('admin.account.manage')
  async disableAdmin(@Param('id') id: string): Promise<void> {
    await this.roles.disableAdmin(id);
  }

  private assertMarket(request: Request, target: 'US' | 'CN' | string): asserts target is 'US' | 'CN' {
    if ((target !== 'US' && target !== 'CN') || request.header('x-market') !== target) {
      throw new ForbiddenException('请求市场必须与授权市场一致。');
    }
  }
}
