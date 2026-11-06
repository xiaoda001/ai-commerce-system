import type { Request, Response } from 'express';
import type { SessionData } from 'express-session';
import { createCsrfMiddleware, issueCsrfToken } from './csrf.middleware';

function makeRequest(method: string, sessionToken?: string, headerToken?: string): Request {
  return {
    method,
    session: { csrfToken: sessionToken } as SessionData,
    get: jest.fn().mockReturnValue(headerToken),
  } as unknown as Request;
}

function makeResponse(): Response & { status: jest.Mock; json: jest.Mock } {
  const response = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
  return response as unknown as Response & { status: jest.Mock; json: jest.Mock };
}

describe('CSRF middleware', () => {
  it('为当前 Session 创建不可预测的 Token', () => {
    const session = {} as SessionData;
    const first = issueCsrfToken(session);
    const second = issueCsrfToken({} as SessionData);

    expect(first).toBe(session.csrfToken);
    expect(first).not.toBe(second);
    expect(first.length).toBeGreaterThanOrEqual(40);
  });

  it('允许安全方法继续执行', () => {
    const next = jest.fn();

    createCsrfMiddleware()(makeRequest('GET'), makeResponse(), next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it('拒绝缺失、伪造或没有 Session Token 的状态变更请求', () => {
    for (const [requestToken, storedToken] of [[undefined, 'stored-token'], ['forged', 'stored-token'], ['valid', undefined]]) {
      const response = makeResponse();
      const next = jest.fn();
      createCsrfMiddleware()(makeRequest('POST', storedToken, requestToken), response, next);
      expect(response.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    }
  });

  it('接受与 Session 绑定的 Token', () => {
    const token = 'a'.repeat(43);
    const request = makeRequest('POST', token, token);
    const next = jest.fn();

    createCsrfMiddleware()(request, makeResponse(), next);

    expect(next).toHaveBeenCalledTimes(1);
  });
});
