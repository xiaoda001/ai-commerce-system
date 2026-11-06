export interface AppEnvironment {
  DB_HOST: string;
  DB_PORT: number;
  DB_NAME: string;
  DB_USER: string;
  DB_PASSWORD: string;
  REDIS_URL: string;
  KAFKA_BROKERS: string;
  SESSION_SECRET: string;
  SESSION_TTL_SECONDS: number;
  SESSION_COOKIE_SECURE: boolean;
  WEB_ALLOWED_ORIGINS: string[];
  API_PORT: number;
}

export function validateEnv(input: Record<string, unknown>): AppEnvironment {
  const required = [
    'DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD', 'REDIS_URL', 'KAFKA_BROKERS',
    'SESSION_SECRET', 'SESSION_TTL_SECONDS', 'SESSION_COOKIE_SECURE', 'WEB_ALLOWED_ORIGINS',
  ] as const;
  for (const key of required) {
    if (typeof input[key] !== 'string' || !(input[key] as string).trim()) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }

  const port = Number(input.DB_PORT);
  const apiPort = Number(input.API_PORT || 3001);
  const sessionTtl = Number(input.SESSION_TTL_SECONDS);
  const cookieSecure = (input.SESSION_COOKIE_SECURE as string).toLowerCase();
  const origins = (input.WEB_ALLOWED_ORIGINS as string).split(',').map((origin) => origin.trim()).filter(Boolean);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid DB_PORT');
  if (!Number.isInteger(apiPort) || apiPort < 1 || apiPort > 65535) throw new Error('Invalid API_PORT');
  if (Buffer.byteLength(input.SESSION_SECRET as string, 'utf8') < 32) throw new Error('Invalid SESSION_SECRET');
  if (!Number.isInteger(sessionTtl) || sessionTtl < 300 || sessionTtl > 604800) throw new Error('Invalid SESSION_TTL_SECONDS');
  if (cookieSecure !== 'true' && cookieSecure !== 'false') throw new Error('Invalid SESSION_COOKIE_SECURE');
  if (origins.length === 0 || origins.some((origin) => {
    try {
      const parsed = new URL(origin);
      return (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') || parsed.origin !== origin;
    } catch {
      return true;
    }
  })) throw new Error('Invalid WEB_ALLOWED_ORIGINS');

  return {
    ...input,
    DB_PORT: port,
    API_PORT: apiPort,
    SESSION_TTL_SECONDS: sessionTtl,
    SESSION_COOKIE_SECURE: cookieSecure === 'true',
    WEB_ALLOWED_ORIGINS: origins,
  } as unknown as AppEnvironment;
}
