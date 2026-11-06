import { InternalServerErrorException } from '@nestjs/common';
import type { Request, Response } from 'express';
import { SESSION_COOKIE_NAME } from './session.middleware';
import type { AuthenticatedAccount } from './session.types';

export async function establishSession(request: Request, account: AuthenticatedAccount): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    request.session.regenerate((error) => error ? reject(error) : resolve());
  });
  request.session.account = account;
  await new Promise<void>((resolve, reject) => {
    request.session.save((error) => error ? reject(error) : resolve());
  });
}

export async function destroySession(request: Request, response: Response): Promise<void> {
  try {
    await new Promise<void>((resolve, reject) => {
      request.session.destroy((error) => error ? reject(error) : resolve());
    });
  } catch {
    throw new InternalServerErrorException('无法结束登录状态。');
  }
  response.clearCookie(SESSION_COOKIE_NAME, { path: '/' });
}
