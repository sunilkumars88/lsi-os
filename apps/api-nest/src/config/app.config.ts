import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  name: process.env.APP_NAME ?? 'EIOS API',
  version: process.env.APP_VERSION ?? '1.0.0',
  port: parseInt(process.env.PORT ?? '4000', 10),
  corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
  seedOnStartup: process.env.SEED_ON_STARTUP === 'true',
  aiServiceUrl: process.env.AI_SERVICE_URL ?? '',
  openaiApiKey: process.env.OPENAI_API_KEY ?? '',
  openaiModel: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
  embeddingModel: process.env.EMBEDDING_MODEL ?? 'text-embedding-3-small',
  embeddingDims: parseInt(process.env.EMBEDDING_DIMS ?? '384', 10),
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? '',
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
  microsoftClientId: process.env.MICROSOFT_CLIENT_ID ?? '',
  microsoftClientSecret: process.env.MICROSOFT_CLIENT_SECRET ?? '',
  minioEndpoint: process.env.MINIO_ENDPOINT ?? '',
  minioAccessKey: process.env.MINIO_ACCESS_KEY ?? '',
  minioSecretKey: process.env.MINIO_SECRET_KEY ?? '',
  minioBucket: process.env.MINIO_BUCKET ?? 'eios-documents',
  smtpHost: process.env.SMTP_HOST ?? '',
  smtpPort: parseInt(process.env.SMTP_PORT ?? '587', 10),
  smtpUser: process.env.SMTP_USER ?? '',
  smtpFrom: process.env.SMTP_FROM ?? '',
  databaseUrl: process.env.DATABASE_URL ?? '',
  redisUrl: process.env.REDIS_URL ?? '',
}));
