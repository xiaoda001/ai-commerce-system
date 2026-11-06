import type { Request } from 'express';
import { CsrfController } from './csrf.controller';

describe('CsrfController', () => {
  it('为前端返回绑定当前 Session 的 CSRF Token', () => {
    const request = { session: {} } as Request;
    const response = new CsrfController().getToken(request);

    expect(response.csrfToken).toBe(request.session.csrfToken);
    expect(response.csrfToken).toHaveLength(43);
  });
});
