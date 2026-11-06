import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { AppModule } from './app.module';
import { AppEnvironment } from './config/validate-env';
import { createCsrfMiddleware } from './auth/csrf.middleware';
import { createSessionMiddleware } from './auth/session.middleware';
import { REDIS_CLIENT } from './redis/redis.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }));
  const config = app.get(ConfigService<AppEnvironment, true>);
  const allowedOrigins = new Set(config.get('WEB_ALLOWED_ORIGINS', { infer: true }));
  const corsOptions: CorsOptions = {
    origin: (origin, callback) => callback(null, !origin || allowedOrigins.has(origin)),
    credentials: true,
  };
  app.enableCors(corsOptions);
  app.use(createSessionMiddleware(app.get<Redis>(REDIS_CLIENT), {
    secret: config.get('SESSION_SECRET', { infer: true }),
    ttlSeconds: config.get('SESSION_TTL_SECONDS', { infer: true }),
    cookieSecure: config.get('SESSION_COOKIE_SECURE', { infer: true }),
  }));
  app.use(createCsrfMiddleware());
  await app.listen(config.get('API_PORT', { infer: true }));
}

void bootstrap();
