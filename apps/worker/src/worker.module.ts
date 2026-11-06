import { Inject, Injectable, Module, OnApplicationShutdown } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { Kafka } from 'kafkajs';
import type { Admin } from 'kafkajs';
import { DatabaseModule } from './database/database.module';
import { validateEnv, WorkerEnvironment } from './config/validate-env';
import { KAFKA_ADMIN, REDIS_CLIENT, WorkerReadyService } from './worker-ready.service';

@Injectable()
class WorkerClientsShutdown implements OnApplicationShutdown {
  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    @Inject(KAFKA_ADMIN) private readonly kafka: Admin,
  ) {}

  async onApplicationShutdown(): Promise<void> {
    this.redis.disconnect();
    await this.kafka.disconnect();
  }
}

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env', '../../.env'], validate: validateEnv }),
    DatabaseModule,
  ],
  providers: [
    { provide: REDIS_CLIENT, inject: [ConfigService], useFactory: (config: ConfigService<WorkerEnvironment, true>) =>
      new Redis(config.get('REDIS_URL', { infer: true }), {
        lazyConnect: true,
        connectTimeout: 1000,
        maxRetriesPerRequest: 0,
        enableOfflineQueue: false,
        retryStrategy: () => null,
      }) },
    { provide: KAFKA_ADMIN, inject: [ConfigService], useFactory: (config: ConfigService<WorkerEnvironment, true>) =>
      new Kafka({
        clientId: 'commerce-worker-ready',
        brokers: config.get('KAFKA_BROKERS', { infer: true }).split(',').map((broker) => broker.trim()),
        connectionTimeout: 1000,
        requestTimeout: 1000,
        retry: { retries: 0 },
      }).admin() },
    WorkerReadyService,
    WorkerClientsShutdown,
  ],
})
export class WorkerModule {}
