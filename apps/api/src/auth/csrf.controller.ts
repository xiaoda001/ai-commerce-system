import { Controller, Get, Header, Req } from '@nestjs/common';
import type { Request } from 'express';
import { issueCsrfToken } from './csrf.middleware';

@Controller('auth')
export class CsrfController {
  @Get('csrf')
  @Header('Cache-Control', 'no-store')
  getToken(@Req() request: Request): { csrfToken: string } {
    return { csrfToken: issueCsrfToken(request.session) };
  }
}
