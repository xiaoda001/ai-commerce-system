import { Inject, Injectable, Module, OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { AppEnvironment } from '../config/validate-env';

export const REDIS_CLIENT = Symbol('REDIS_CLIENT');

@Injectable()
class RedisShutdown implements OnApplicationShutdown {
  constructor(@Inject(REDIS_CLIENT) private readonly client: Redis) {}
  onApplicationShutdown(): void { this.client.disconnect(); }
}

@Module({
  providers: [
    { provide: REDIS_CLIENT, inject: [ConfigService], useFactory: (config: ConfigService<AppEnvironment, true>) =>
      new Redis(config.get('REDIS_URL', { infer: true }), {
        lazyConnect: true,
        connectTimeout: 1000,
        maxRetriesPerRequest: 0,
        enableOfflineQueue: false,
        retryStrategy: () => null,
      }) },
    RedisShutdown,
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}
