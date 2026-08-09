import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  AllExceptionsFilter,
  HttpExceptionFilter,
} from './common/filters/http-exception.filter';
import { StructuredLogger } from './common/logger/structured.logger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new StructuredLogger('Bootstrap'),
  });
  const config = app.get(ConfigService);
  const logger = new StructuredLogger('HTTP');

  app.enableCors({
    origin: config.get<string[]>('app.corsOrigins'),
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter(), new HttpExceptionFilter());

  app.setGlobalPrefix('api/v1');

  // Root probes for orchestrators (Compose/K8s) in addition to /api/v1/health|ready
  const httpAdapter = app.getHttpAdapter();
  httpAdapter.get(
    '/health',
    (_req: unknown, res: { status: (n: number) => { json: (b: object) => void } }) => {
      res.status(200).json({
        status: 'ok',
        service: 'eios-api-nest',
        timestamp: new Date().toISOString(),
      });
    },
  );
  httpAdapter.get(
    '/ready',
    (_req: unknown, res: { status: (n: number) => { json: (b: object) => void } }) => {
      res.status(200).json({
        status: 'ready',
        service: 'eios-api-nest',
        timestamp: new Date().toISOString(),
      });
    },
  );

  const port = config.get<number>('app.port') ?? 4000;
  await app.listen(port);
  logger.log(`EIOS API listening on http://localhost:${port}`);
}
bootstrap();
