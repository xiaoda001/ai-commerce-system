import { WorkerReadyService } from '../src/worker-ready.service';

describe('WorkerReadyService', () => {
  function clients() {
    return {
      database: { isInitialized: false, initialize: jest.fn().mockResolvedValue(undefined), query: jest.fn().mockResolvedValue([1]) },
      redis: { status: 'wait', connect: jest.fn().mockResolvedValue(undefined), ping: jest.fn().mockResolvedValue('PONG') },
      kafka: { connect: jest.fn().mockResolvedValue(undefined), fetchTopicMetadata: jest.fn().mockResolvedValue({ topics: [] }) },
    };
  }

  it('checks all three dependencies before resolving readiness', async () => {
    const { database, redis, kafka } = clients();
    const ready = new WorkerReadyService(database as never, redis as never, kafka as never);

    await expect(ready.check()).resolves.toBeUndefined();
    expect(database.query).toHaveBeenCalledWith('SELECT 1');
    expect(redis.ping).toHaveBeenCalledTimes(1);
    expect(kafka.fetchTopicMetadata).toHaveBeenCalledTimes(1);
  });

  it.each(['mysql', 'redis', 'kafka'] as const)('rejects readiness when %s is unavailable', async (dependency) => {
    const { database, redis, kafka } = clients();
    if (dependency === 'mysql') database.query.mockRejectedValue(new Error('MySQL unavailable'));
    if (dependency === 'redis') redis.ping.mockRejectedValue(new Error('Redis unavailable'));
    if (dependency === 'kafka') kafka.fetchTopicMetadata.mockRejectedValue(new Error('Kafka unavailable'));
    const ready = new WorkerReadyService(database as never, redis as never, kafka as never);

    await expect(ready.check()).rejects.toThrow(`${dependency} readiness failed`);
  });
});
