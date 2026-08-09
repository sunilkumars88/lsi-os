import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Public } from '../common/guards/public.decorator';

@Controller()
export class HealthController {
  constructor(
    private readonly config: ConfigService,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  private payload(kind: 'health' | 'ready', dbStatus?: string) {
    const base = {
      status: kind === 'health' ? 'ok' : dbStatus === 'up' ? 'ready' : 'not_ready',
      service: 'eios-api-nest',
      version: this.config.get<string>('app.version') ?? 'v1',
      timestamp: new Date().toISOString(),
      openaiConfigured: Boolean(this.config.get<string>('app.openaiApiKey')),
      smtpConfigured: Boolean(this.config.get<string>('app.smtpHost')),
    };
    if (kind === 'ready') {
      return {
        ...base,
        checks: {
          database: dbStatus ?? 'unknown',
          aiServiceUrl: this.config.get<string>('app.aiServiceUrl') || null,
          minioConfigured: Boolean(this.config.get<string>('app.minioEndpoint')),
          openaiConfigured: Boolean(this.config.get<string>('app.openaiApiKey')),
          smtpConfigured: Boolean(this.config.get<string>('app.smtpHost')),
        },
      };
    }
    return base;
  }

  @Public()
  @Get('health')
  health() {
    return this.payload('health');
  }

  @Public()
  @Get('ready')
  async ready() {
    let db = 'down';
    try {
      await this.dataSource.query('SELECT 1');
      db = 'up';
    } catch {
      db = 'down';
    }
    return this.payload('ready', db);
  }
}
