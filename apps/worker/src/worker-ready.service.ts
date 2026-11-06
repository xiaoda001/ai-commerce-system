import { Inject, Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import Redis from 'ioredis';
import type { Admin } from 'kafkajs';
import { DataSource } from 'typeorm';

export const REDIS_CLIENT = Symbol('REDIS_CLIENT');
export const KAFKA_ADMIN = Symbol('KAFKA_ADMIN');

@Injectable()
export class WorkerReadyService {
  constructor(
    @InjectDataSource() private readonly database: DataSource,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    @Inject(KAFKA_ADMIN) private readonly kafka: Admin,
  ) {}

  async check(): Promise<void> {
    await this.probe('mysql', async () => {
      if (!this.database.isInitialized) await this.database.initialize();
      await this.database.query('SELECT 1');
    });
    await this.probe('redis', async () => {
      if (this.redis.status !== 'ready') await this.redis.connect();
      if (await this.redis.ping() !== 'PONG') throw new Error('Redis PING failed');
    });
    await this.probe('kafka', async () => {
      await this.kafka.connect();
      await this.kafka.fetchTopicMetadata();
    });
  }

  private async probe(name: string, check: () => Promise<void>): Promise<void> {
    try {
      await check();
    } catch {
      throw new Error(`${name} readiness failed`);
    }
  }
}
