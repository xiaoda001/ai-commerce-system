import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { AppEnvironment } from './config/validate-env';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();
  const config = app.get(ConfigService<AppEnvironment, true>);
  await app.listen(config.get('API_PORT', { infer: true }));
}

void bootstrap();
