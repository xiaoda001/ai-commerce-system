import { Inject, Injectable, Module, OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka } from 'kafkajs';
import type { Admin } from 'kafkajs';
import { AppEnvironment } from '../config/validate-env';

export const KAFKA_ADMIN = Symbol('KAFKA_ADMIN');

@Injectable()
class KafkaShutdown implements OnApplicationShutdown {
  constructor(@Inject(KAFKA_ADMIN) private readonly admin: Admin) {}
  async onApplicationShutdown(): Promise<void> { await this.admin.disconnect(); }
}

@Module({
  providers: [
    { provide: KAFKA_ADMIN, inject: [ConfigService], useFactory: (config: ConfigService<AppEnvironment, true>) =>
      new Kafka({
        clientId: 'commerce-api-health',
        brokers: config.get('KAFKA_BROKERS', { infer: true }).split(',').map((broker) => broker.trim()),
        connectionTimeout: 1000,
        requestTimeout: 1000,
        retry: { retries: 0 },
      }).admin() },
    KafkaShutdown,
  ],
  exports: [KAFKA_ADMIN],
})
export class KafkaModule {}
