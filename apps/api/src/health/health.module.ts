import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { RedisModule } from '../redis/redis.module';
import { KafkaModule } from '../kafka/kafka.module';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

@Module({
  imports: [DatabaseModule, RedisModule, KafkaModule],
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}
