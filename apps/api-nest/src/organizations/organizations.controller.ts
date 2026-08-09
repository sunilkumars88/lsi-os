import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { CurrentOrgId, CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/constants/roles';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RbacGuard } from '../common/guards/rbac.guard';
import { User } from '../database/entities/user.entity';
import { OrganizationsService } from './organizations.service';

@Controller('organizations')
@UseGuards(JwtAuthGuard, RbacGuard)
export class OrganizationsController {
  constructor(private readonly orgs: OrganizationsService) {}

  @Get('current')
  getCurrent(@CurrentOrgId() orgId: string) {
    return this.orgs.get(orgId);
  }

  @Patch('current')
  @Roles(Role.Admin, Role.Manager)
  updateCurrent(
    @CurrentOrgId() orgId: string,
    @Body() body: { name?: string; settings?: Record<string, unknown> },
  ) {
    return this.orgs.update(orgId, body);
  }

  @Get('current/members')
  @Roles(Role.Admin, Role.Manager, Role.Operator)
  listMembers(@CurrentOrgId() orgId: string) {
    return this.orgs.listMembers(orgId);
  }
}
