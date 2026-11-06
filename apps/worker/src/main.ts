import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { WorkerModule } from './worker.module';
import { WorkerReadyService } from './worker-ready.service';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.createApplicationContext(WorkerModule);
  app.enableShutdownHooks(['SIGINT', 'SIGTERM']);
  try {
    await app.get(WorkerReadyService).check();
    Logger.log('worker-ready', 'Worker');
  } catch (error) {
    await app.close();
    throw error;
  }
}

void bootstrap().catch((error: unknown) => {
  Logger.error(error instanceof Error ? error.message : 'Worker startup failed', 'Worker');
  process.exitCode = 1;
});
