import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, Res, UnauthorizedException } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AdminAuthService } from './admin-auth.service';
import { EmailPasswordDto } from './dto/email-password.dto';
import { destroySession, establishSession } from './session.util';

@Controller('auth/admin')
export class AdminAuthController {
  constructor(private readonly auth: AdminAuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: EmailPasswordDto, @Req() request: Request) {
    const account = await this.auth.authenticate(body.email, body.password);
    await establishSession(request, { ...account, kind: 'admin' });
    return account;
  }

  @Get('me')
  async me(@Req() request: Request) {
    const account = request.session.account;
    if (!account || account.kind !== 'admin') throw new UnauthorizedException('请先登录。');
    return this.auth.getIdentity(account.id);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Req() request: Request, @Res({ passthrough: true }) response: Response): Promise<void> {
    await destroySession(request, response);
  }
}
