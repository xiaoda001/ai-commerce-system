import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { resolve } from 'node:path';
import { validateEnv } from './validate-env';

@Module({
  imports: [ConfigModule.forRoot({
    isGlobal: true,
    envFilePath: [resolve(process.cwd(), '.env'), resolve(process.cwd(), '../../.env')],
    validate: validateEnv,
  })],
})
export class AppConfigModule {}
