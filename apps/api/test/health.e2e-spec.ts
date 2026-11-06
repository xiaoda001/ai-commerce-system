import 'reflect-metadata';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import { HealthController } from '../src/health/health.controller';
import { HealthService } from '../src/health/health.service';
import { REDIS_CLIENT } from '../src/redis/redis.module';
import { KAFKA_ADMIN } from '../src/kafka/kafka.module';

type FakeClients = {
  mysql: { isInitialized: boolean; initialize: jest.Mock; query: jest.Mock };
  redis: { status?: string; connect?: jest.Mock; ping: jest.Mock };
  kafka: { connect: jest.Mock; fetchTopicMetadata: jest.Mock };
};

async function startApi(clients: FakeClients): Promise<{ app: INestApplication; baseUrl: string }> {
  const module = await Test.createTestingModule({
    controllers: [HealthController],
    providers: [
      HealthService,
      { provide: getDataSourceToken(), useValue: clients.mysql },
      { provide: REDIS_CLIENT, useValue: clients.redis },
      { provide: KAFKA_ADMIN, useValue: clients.kafka },
    ],
  }).compile();
  const app = module.createNestApplication();
  await app.listen(0, '127.0.0.1');
  const address = app.getHttpServer().address() as { port: number };
  return { app, baseUrl: `http://127.0.0.1:${address.port}` };
}

function healthyClients(): FakeClients {
  return {
    mysql: { isInitialized: true, initialize: jest.fn().mockResolvedValue(undefined), query: jest.fn().mockResolvedValue([{ '1': 1 }]) },
    redis: { status: 'ready', connect: jest.fn().mockResolvedValue(undefined), ping: jest.fn().mockResolvedValue('PONG') },
    kafka: { connect: jest.fn().mockResolvedValue(undefined), fetchTopicMetadata: jest.fn().mockResolvedValue({ topics: [] }) },
  };
}

describe('health endpoints', () => {
  it('returns 200 only when all three dependencies answer their probes', async () => {
    const clients = healthyClients();
    const { app, baseUrl } = await startApi(clients);
    try {
      const response = await fetch(`${baseUrl}/health/ready`);
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ status: 'ok', dependencies: { mysql: 'ok', redis: 'ok', kafka: 'ok' } });
      expect(clients.mysql.query).toHaveBeenCalledWith('SELECT 1');
    } finally { await app.close(); }
  });

  it('returns 503 with independent dependency statuses and no driver error text', async () => {
    const clients = healthyClients();
    clients.redis.ping.mockRejectedValue(new Error('redis://secret:password@internal-host:6379'));
    const { app, baseUrl } = await startApi(clients);
    try {
      const response = await fetch(`${baseUrl}/health/ready`);
      const body = await response.text();
      expect(response.status).toBe(503);
      expect(JSON.parse(body)).toEqual({ status: 'error', dependencies: { mysql: 'ok', redis: 'error', kafka: 'ok' } });
      expect(body).not.toContain('secret');
    } finally { await app.close(); }
  });

  it('keeps liveness 200 while dependency readiness is degraded', async () => {
    const clients = healthyClients();
    clients.mysql.query.mockRejectedValue(new Error('database unavailable'));
    const { app, baseUrl } = await startApi(clients);
    try {
      const live = await fetch(`${baseUrl}/health/live`);
      const ready = await fetch(`${baseUrl}/health/ready`);
      expect(live.status).toBe(200);
      expect(ready.status).toBe(503);
    } finally { await app.close(); }
  });

  it('marks a hung probe as error within the timeout while preserving other statuses', async () => {
    const clients = healthyClients();
    clients.kafka.fetchTopicMetadata.mockImplementation(() => new Promise(() => {}));
    const { app, baseUrl } = await startApi(clients);
    try {
      const response = await fetch(`${baseUrl}/health/ready`);
      expect(response.status).toBe(503);
      expect(await response.json()).toEqual({ status: 'error', dependencies: { mysql: 'ok', redis: 'ok', kafka: 'error' } });
    } finally { await app.close(); }
  }, 10000);

  it('reconnects Redis after an earlier failed connection before reporting ready', async () => {
    const clients = healthyClients();
    clients.redis.status = 'end';
    clients.redis.ping.mockRejectedValue(new Error('offline'));
    clients.redis.connect = jest.fn().mockImplementation(async () => {
      clients.redis.status = 'ready';
      clients.redis.ping.mockResolvedValue('PONG');
    });
    const { app, baseUrl } = await startApi(clients);
    try {
      const response = await fetch(`${baseUrl}/health/ready`);
      expect(response.status).toBe(200);
    } finally { await app.close(); }
  });

  it('shares one Redis connection attempt across overlapping readiness requests', async () => {
    const clients = healthyClients();
    clients.redis.status = 'end';
    let finishConnection: (() => void) | undefined;
    const connection = new Promise<void>((resolve) => { finishConnection = resolve; });
    clients.redis.connect = jest.fn().mockImplementation(() => {
      if (clients.redis.status === 'connecting') return Promise.reject(new Error('Redis is already connecting'));
      clients.redis.status = 'connecting';
      return connection.then(() => { clients.redis.status = 'ready'; });
    });
    const { app, baseUrl } = await startApi(clients);
    try {
      const first = fetch(`${baseUrl}/health/ready`);
      for (let attempt = 0; attempt < 100 && clients.redis.status !== 'connecting'; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, 1));
      }
      expect(clients.redis.status).toBe('connecting');
      const second = fetch(`${baseUrl}/health/ready`);
      await new Promise((resolve) => setTimeout(resolve, 20));
      finishConnection?.();
      const [firstResponse, secondResponse] = await Promise.all([first, second]);
      expect(firstResponse.status).toBe(200);
      expect(secondResponse.status).toBe(200);
    } finally { await app.close(); }
  });
});
