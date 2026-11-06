import type { DataSourceOptions } from 'typeorm';

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
}

export function createTypeOrmOptions(
  config: DatabaseConfig,
): DataSourceOptions {
  return {
    type: 'mysql',
    ...config,
    synchronize: false,
    migrationsRun: false,
    entities: [],
    migrations: [],
  };
}
