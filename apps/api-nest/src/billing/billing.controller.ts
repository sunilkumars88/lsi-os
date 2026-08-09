import { Controller, Get, UseGuards } from '@nestjs/common';
import { CurrentOrgId } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/constants/roles';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Public } from '../common/guards/public.decorator';
import { RbacGuard } from '../common/guards/rbac.guard';
import { BillingService } from './billing.service';

@Controller('billing')
export class BillingController {
  constructor(private readonly billing: BillingService) {}

  @Public()
  @Get('plans')
  listPlans() {
    return this.billing.listPlans();
  }

  @Get('current')
  @UseGuards(JwtAuthGuard, RbacGuard)
  @Roles(Role.Viewer)
  currentPlan(@CurrentOrgId() orgId: string) {
    return this.billing.currentPlan(orgId);
  }
}
