import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Approval } from '../database/entities/approval.entity';
import { WorkflowsService } from '../workflows/workflows.service';

@Injectable()
export class ApprovalsService {
  constructor(
    @InjectRepository(Approval)
    private readonly approvals: Repository<Approval>,
    private readonly workflows: WorkflowsService,
  ) {}

  list(orgId: string, status?: string) {
    const where: Record<string, string> = { orgId };
    if (status) where.status = status;
    return this.approvals.find({ where, order: { createdAt: 'DESC' } });
  }

  async get(orgId: string, id: string) {
    const approval = await this.approvals.findOne({ where: { id, orgId } });
    if (!approval) throw new NotFoundException('Approval not found');
    return approval;
  }

  async approve(orgId: string, id: string, reviewerId: string, comment?: string) {
    const approval = await this.get(orgId, id);
    if (approval.status !== 'pending') {
      throw new BadRequestException('Approval is not pending');
    }
    approval.status = 'approved';
    approval.reviewedBy = reviewerId;
    approval.comment = comment ?? null;
    approval.reviewedAt = new Date();
    await this.approvals.save(approval);

    if (approval.resourceType === 'workflow_run') {
      await this.workflows.resumeRun(orgId, approval.resourceId, reviewerId);
    }

    return approval;
  }

  async reject(orgId: string, id: string, reviewerId: string, comment?: string) {
    const approval = await this.get(orgId, id);
    if (approval.status !== 'pending') {
      throw new BadRequestException('Approval is not pending');
    }
    approval.status = 'rejected';
    approval.reviewedBy = reviewerId;
    approval.comment = comment ?? null;
    approval.reviewedAt = new Date();
    return this.approvals.save(approval);
  }
}
