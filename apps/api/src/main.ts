import 'reflect-metadata';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from apps/api/.env or root .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('TasvirAPI');
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  app.setGlobalPrefix('api');

  const port = process.env.PORT || 4000;
  await app.listen(port, '0.0.0.0');
  logger.log(`Tasvir NestJS API running on http://127.0.0.1:${port}/api`);
}

bootstrap();
