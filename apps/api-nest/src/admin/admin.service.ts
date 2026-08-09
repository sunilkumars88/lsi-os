import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import OpenAI from 'openai';
import { Repository } from 'typeorm';
import { AuditLog } from '../database/entities/audit-log.entity';
import { UsageMeter } from '../database/entities/usage-meter.entity';
import { User } from '../database/entities/user.entity';

@Injectable()
export class AdminService {
  private openai: OpenAI | null = null;

  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(AuditLog) private readonly audit: Repository<AuditLog>,
    @InjectRepository(UsageMeter) private readonly usage: Repository<UsageMeter>,
    private readonly config: ConfigService,
  ) {
    const apiKey = this.config.get<string>('app.openaiApiKey');
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    }
  }

  listUsers(orgId: string) {
    return this.users.find({ where: { orgId }, order: { createdAt: 'ASC' } });
  }

  async updateUserRole(orgId: string, userId: string, role: string) {
    const user = await this.users.findOne({ where: { id: userId, orgId } });
    if (!user) return null;
    user.role = role;
    return this.users.save(user);
  }

  async usageSummary(orgId: string) {
    const meters = await this.usage.find({
      where: { orgId },
      order: { createdAt: 'DESC' },
      take: 100,
    });
    const totals = meters.reduce(
      (acc, m) => {
        acc.tokensIn += m.tokensIn;
        acc.tokensOut += m.tokensOut;
        acc.costInr += m.costInr;
        return acc;
      },
      { tokensIn: 0, tokensOut: 0, costInr: 0 },
    );
    return { totals, recent: meters };
  }

  async auditSummary(orgId: string) {
    const count = await this.audit.count({ where: { orgId } });
    const recent = await this.audit.find({
      where: { orgId },
      order: { createdAt: 'DESC' },
      take: 20,
    });
    return { count, recent };
  }

  async routerStatus() {
    const aiUrl = this.config.get<string>('app.aiServiceUrl');
    const openaiKey = this.config.get<string>('app.openaiApiKey');
    let openaiProbe: { ok: boolean; model?: string; error?: string } = {
      ok: false,
    };

    if (this.openai) {
      try {
        const models = await this.openai.models.list();
        openaiProbe = {
          ok: true,
          model: this.config.get<string>('app.openaiModel') ?? undefined,
        };
        void models;
      } catch (e) {
        openaiProbe = {
          ok: false,
          error: e instanceof Error ? e.message : 'OpenAI probe failed',
        };
      }
    } else {
      openaiProbe = { ok: false, error: 'OPENAI_API_KEY not set' };
    }

    return {
      providers: {
        openai: {
          configured: Boolean(openaiKey),
          probe: openaiProbe,
        },
        aiService: {
          configured: Boolean(aiUrl),
          url: aiUrl || null,
        },
      },
      defaultModel: this.config.get<string>('app.openaiModel'),
      embeddingModel: this.config.get<string>('app.embeddingModel'),
    };
  }

  smtpStatus() {
    const host = this.config.get<string>('app.smtpHost') || '';
    const port = this.config.get<number>('app.smtpPort') ?? 587;
    const user = this.config.get<string>('app.smtpUser') || '';
    const from = this.config.get<string>('app.smtpFrom') || '';
    const configured = Boolean(host);
    return {
      configured,
      status: configured ? 'ready' : 'not_configured',
      host: host || null,
      port,
      user: user ? `${user.slice(0, 2)}***` : null,
      from: from || null,
      providerHint: configured ? 'smtp' : 'console',
      message: configured
        ? 'SMTP credentials present — magic links/invites will send via SMTP'
        : 'SMTP not configured — auth emails log to console (Needs account)',
    };
  }
}
