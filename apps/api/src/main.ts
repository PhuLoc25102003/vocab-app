import 'reflect-metadata';
import { randomUUID } from 'node:crypto';
import cookie from '@fastify/cookie';
import helmet from '@fastify/helmet';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { config as loadEnvFile } from 'dotenv';
import { AppModule } from './app.module';
import { Env, parseCorsOrigins, parseTrustedProxies, validateEnv } from './config/env';
import { setupSwagger } from './config/swagger';

async function bootstrap(): Promise<void> {
  // Fastify cần giá trị này ngay khi tạo, trước khi ConfigModule chạy.
  loadEnvFile({ quiet: true });
  const { TRUSTED_PROXIES } = validateEnv(process.env);

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      genReqId: () => randomUUID(),
      trustProxy: parseTrustedProxies(TRUSTED_PROXIES),
    }),
  );
  const config = app.get<ConfigService<Env, true>>(ConfigService);

  app.setGlobalPrefix('api/v1');
  app.enableShutdownHooks();
  await app.register(helmet);
  await app.register(cookie);
  app.enableCors({
    origin: parseCorsOrigins(config.get('CORS_ORIGINS', { infer: true })),
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE'],
  });

  if (config.get('NODE_ENV', { infer: true }) !== 'production') {
    setupSwagger(app);
  }

  const port = config.get('PORT', { infer: true });
  await app.listen(port, '0.0.0.0');
  new Logger('Bootstrap').log(`API chạy tại http://localhost:${port}/api/v1`);
}

void bootstrap();
