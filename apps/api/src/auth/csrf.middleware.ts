import { randomBytes, timingSafeEqual } from 'node:crypto';
import type { RequestHandler } from 'express';
import type { SessionData } from 'express-session';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export function issueCsrfToken(session: SessionData): string {
  session.csrfToken ??= randomBytes(32).toString('base64url');
  return session.csrfToken;
}

export function createCsrfMiddleware(): RequestHandler {
  return (request, response, next) => {
    if (SAFE_METHODS.has(request.method.toUpperCase())) return next();

    const expectedToken = request.session?.csrfToken;
    const providedToken = request.get('X-CSRF-Token');
    if (!expectedToken || !providedToken) {
      return response.status(403).json({ statusCode: 403, message: 'CSRF Token 无效。' });
    }

    const expected = Buffer.from(expectedToken);
    const provided = Buffer.from(providedToken);
    if (expected.length !== provided.length || !timingSafeEqual(expected, provided)) {
      return response.status(403).json({ statusCode: 403, message: 'CSRF Token 无效。' });
    }

    return next();
  };
}
