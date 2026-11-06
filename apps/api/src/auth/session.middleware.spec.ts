import Redis from 'ioredis';
import { buildSessionOptions } from './session.middleware';

describe('buildSessionOptions', () => {
  it('将 Session 放入 Redis，并设置安全 Cookie 与可配置过期时间', () => {
    const redis = new Redis('redis://127.0.0.1:6379', { lazyConnect: true });
    const options = buildSessionOptions(redis, {
      secret: 'a'.repeat(64),
      ttlSeconds: 900,
      cookieSecure: true,
    });

    expect(options.name).toBe('commerce.sid');
    expect(options.resave).toBe(false);
    expect(options.saveUninitialized).toBe(false);
    expect(options.cookie).toMatchObject({
      httpOnly: true,
      sameSite: 'lax',
      secure: true,
      maxAge: 900_000,
      path: '/',
    });
    expect(options.store).toBeDefined();

    redis.disconnect();
  });
});
