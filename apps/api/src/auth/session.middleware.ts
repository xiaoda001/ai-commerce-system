import session, { SessionOptions } from 'express-session';
import { RedisStore } from 'connect-redis';
import Redis from 'ioredis';
import type { RequestHandler } from 'express';

export interface SessionConfiguration {
  secret: string;
  ttlSeconds: number;
  cookieSecure: boolean;
}

export const SESSION_COOKIE_NAME = 'commerce.sid';

export function buildSessionOptions(redis: Redis, config: SessionConfiguration): SessionOptions {
  return {
    name: SESSION_COOKIE_NAME,
    store: new RedisStore({
      client: redis,
      prefix: 'commerce:session:',
      ttl: config.ttlSeconds,
    }),
    secret: config.secret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: config.cookieSecure,
      maxAge: config.ttlSeconds * 1000,
      path: '/',
    },
  };
}

export function createSessionMiddleware(redis: Redis, config: SessionConfiguration): RequestHandler {
  return session(buildSessionOptions(redis, config));
}
