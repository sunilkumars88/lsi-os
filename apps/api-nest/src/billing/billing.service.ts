import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from '../database/entities/organization.entity';
import { INR_PRICING_PLANS } from './pricing.strategy';

@Injectable()
export class BillingService {
  constructor(
    @InjectRepository(Organization)
    private readonly orgs: Repository<Organization>,
  ) {}

  listPlans() {
    return INR_PRICING_PLANS;
  }

  async currentPlan(orgId: string) {
    const org = await this.orgs.findOne({ where: { id: orgId } });
    const planId = org?.plan ?? 'starter';
    const plan = INR_PRICING_PLANS.find((p) => p.id === planId) ?? INR_PRICING_PLANS[0];
    return { orgId, planId, plan };
  }
}
