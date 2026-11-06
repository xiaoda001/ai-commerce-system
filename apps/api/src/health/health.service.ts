import { Inject, Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { ReadinessResponse, DependencyStatus } from '@commerce/contracts';
import { DataSource } from 'typeorm';
import Redis from 'ioredis';
import type { Admin } from 'kafkajs';
import { REDIS_CLIENT } from '../redis/redis.module';
import { KAFKA_ADMIN } from '../kafka/kafka.module';

const PROBE_TIMEOUT_MS = 1500;

@Injectable()
export class HealthService {
  private initialization?: Promise<DataSource>;
  private redisConnection?: Promise<void>;

  constructor(
    @InjectDataSource() private readonly database: DataSource,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    @Inject(KAFKA_ADMIN) private readonly kafka: Admin,
  ) {}

  async checkReadiness(): Promise<ReadinessResponse> {
    const [mysql, redis, kafka] = await Promise.all([
      this.probe(async () => {
        if (!this.database.isInitialized) {
          this.initialization ??= this.database.initialize().finally(() => { this.initialization = undefined; });
          await this.initialization;
        }
        await this.database.query('SELECT 1');
      }),
      this.probe(async () => {
        if (this.redis.status !== 'ready') {
          this.redisConnection ??= this.redis.connect().finally(() => { this.redisConnection = undefined; });
          await this.redisConnection;
        }
        if (await this.redis.ping() !== 'PONG') throw new Error('Redis PING failed');
      }),
      this.probe(async () => {
        await this.kafka.connect();
        await this.kafka.fetchTopicMetadata();
      }),
    ]);
    return { status: mysql === 'ok' && redis === 'ok' && kafka === 'ok' ? 'ok' : 'error', dependencies: { mysql, redis, kafka } };
  }

  private async probe(check: () => Promise<void>): Promise<DependencyStatus> {
    let timer: NodeJS.Timeout | undefined;
    try {
      await Promise.race([
        check(),
        new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error('probe timeout')), PROBE_TIMEOUT_MS); }),
      ]);
      return 'ok';
    } catch {
      return 'error';
    } finally {
      if (timer) clearTimeout(timer);
    }
  }
}
