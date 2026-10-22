import 'reflect-metadata';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import * as express from 'express';

// Load environment variables from apps/api/.env or root .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';

async function bootstrap() {
  const logger = new Logger('TasvirAPI');
  const app = await NestFactory.create(AppModule);

  // Security HTTP Headers with Helmet
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
          mediaSrc: ["'self'", 'https:', 'blob:'],
          scriptSrc: ["'self'", "'unsafe-inline'", 'https://challenges.cloudflare.com', 'https://accounts.google.com'],
          frameSrc: ["'self'", 'https://challenges.cloudflare.com', 'https://accounts.google.com'],
          connectSrc: ["'self'", 'https:', 'http://localhost:*'],
        },
      },
    }),
  );

  // Strict CORS policy
  const allowedOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    process.env.FRONTEND_URL,
    process.env.NEXT_PUBLIC_APP_URL,
  ].filter(Boolean) as string[];

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, webhooks)
      if (!origin) return callback(null, true);

      const isDevelopment = process.env.NODE_ENV !== 'production';
      const isAllowed =
        allowedOrigins.includes(origin) ||
        (isDevelopment && (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')));

      if (isAllowed) {
        callback(null, true);
      } else {
        logger.warn(`Blocked CORS request from disallowed origin: ${origin}`);
        callback(new Error('CORS siyosati: Ushbu manbadan soʻrov yuborish taqiqlangan'));
      }
    },
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type,Authorization,X-Requested-With,x-user-id,x-admin-key',
  });

  // Global Input Validation & Transformation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  );

  app.setGlobalPrefix('api');

  const videosPath = path.resolve(process.cwd(), 'apps/web/public/videos');
  if (fs.existsSync(videosPath)) {
    app.use('/videos', express.static(videosPath));
    logger.log(`Serving static video previews from ${videosPath}`);
  }

  const port = process.env.PORT || 4000;
  await app.listen(port, '0.0.0.0');
  logger.log(`Tasvir NestJS API running on http://127.0.0.1:${port}/api`);
}

bootstrap();
