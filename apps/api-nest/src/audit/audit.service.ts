import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { AuditLog } from '../database/entities/audit-log.entity';

export interface AuditSearchParams {
  orgId: string;
  action?: string;
  userId?: string;
  from?: Date;
  to?: Date;
  limit?: number;
  offset?: number;
}

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogs: Repository<AuditLog>,
  ) {}

  async log(params: {
    orgId: string;
    userId?: string | null;
    action: string;
    resource?: string;
    details?: Record<string, unknown>;
  }) {
    const entry = this.auditLogs.create({
      id: uuidv4(),
      orgId: params.orgId,
      userId: params.userId ?? null,
      action: params.action,
      resource: params.resource ?? '',
      details: params.details ?? {},
    });
    return this.auditLogs.save(entry);
  }

  async search(params: AuditSearchParams) {
    const qb = this.auditLogs
      .createQueryBuilder('a')
      .where('a.org_id = :orgId', { orgId: params.orgId })
      .orderBy('a.created_at', 'DESC');

    if (params.action) {
      qb.andWhere('a.action = :action', { action: params.action });
    }
    if (params.userId) {
      qb.andWhere('a.user_id = :userId', { userId: params.userId });
    }
    if (params.from) {
      qb.andWhere('a.created_at >= :from', { from: params.from });
    }
    if (params.to) {
      qb.andWhere('a.created_at <= :to', { to: params.to });
    }

    const limit = params.limit ?? 50;
    const offset = params.offset ?? 0;
    const [items, total] = await qb.skip(offset).take(limit).getManyAndCount();
    return { items, total, limit, offset };
  }

  async exportCsv(orgId: string): Promise<string> {
    const { items } = await this.search({ orgId, limit: 10000 });
    const header = 'id,org_id,user_id,action,resource,created_at,details';
    const rows = items.map((e) =>
      [
        e.id,
        e.orgId,
        e.userId ?? '',
        e.action,
        e.resource,
        e.createdAt.toISOString(),
        JSON.stringify(e.details).replace(/"/g, '""'),
      ]
        .map((v) => `"${String(v)}"`)
        .join(','),
    );
    return [header, ...rows].join('\n');
  }
}
