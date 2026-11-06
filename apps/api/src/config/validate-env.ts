export interface AppEnvironment {
  DB_HOST: string;
  DB_PORT: number;
  DB_NAME: string;
  DB_USER: string;
  DB_PASSWORD: string;
  REDIS_URL: string;
  KAFKA_BROKERS: string;
  API_PORT: number;
}

export function validateEnv(input: Record<string, unknown>): AppEnvironment {
  const required = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD', 'REDIS_URL', 'KAFKA_BROKERS'] as const;
  for (const key of required) {
    if (typeof input[key] !== 'string' || !(input[key] as string).trim()) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }
  const port = Number(input.DB_PORT);
  const apiPort = Number(input.API_PORT || 3001);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid DB_PORT');
  if (!Number.isInteger(apiPort) || apiPort < 1 || apiPort > 65535) throw new Error('Invalid API_PORT');
  return { ...input, DB_PORT: port, API_PORT: apiPort } as unknown as AppEnvironment;
}
