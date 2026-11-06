import { validateEnv } from './validate-env';

const validEnvironment: Record<string, unknown> = {
  DB_HOST: '127.0.0.1',
  DB_PORT: '3306',
  DB_NAME: 'commerce',
  DB_USER: 'commerce_app',
  DB_PASSWORD: 'local-only-password',
  REDIS_URL: 'redis://127.0.0.1:6379',
  KAFKA_BROKERS: '127.0.0.1:9092',
  SESSION_SECRET: 'a'.repeat(64),
  SESSION_TTL_SECONDS: '900',
  SESSION_COOKIE_SECURE: 'false',
  WEB_ALLOWED_ORIGINS: 'http://127.0.0.1:3000,http://127.0.0.1:3002',
};

describe('validateEnv', () => {
  it('要求显式配置强度足够的 Session Secret', () => {
    const withoutSecret = { ...validEnvironment };
    delete withoutSecret.SESSION_SECRET;
    expect(() => validateEnv(withoutSecret)).toThrow('Missing required environment variable: SESSION_SECRET');
    expect(() => validateEnv({ ...validEnvironment, SESSION_SECRET: 'too-short' })).toThrow('Invalid SESSION_SECRET');
  });

  it('解析 Session 时限、安全 Cookie 开关和前端允许来源', () => {
    const env = validateEnv({ ...validEnvironment, SESSION_COOKIE_SECURE: 'true' });

    expect(env.SESSION_TTL_SECONDS).toBe(900);
    expect(env.SESSION_COOKIE_SECURE).toBe(true);
    expect(env.WEB_ALLOWED_ORIGINS).toEqual(['http://127.0.0.1:3000', 'http://127.0.0.1:3002']);
  });

  it('拒绝无效时限、布尔值和空的来源列表', () => {
    expect(() => validateEnv({ ...validEnvironment, SESSION_TTL_SECONDS: '0' })).toThrow('Invalid SESSION_TTL_SECONDS');
    expect(() => validateEnv({ ...validEnvironment, SESSION_COOKIE_SECURE: 'yes' })).toThrow('Invalid SESSION_COOKIE_SECURE');
    expect(() => validateEnv({ ...validEnvironment, WEB_ALLOWED_ORIGINS: ' , ' })).toThrow('Invalid WEB_ALLOWED_ORIGINS');
  });
});
