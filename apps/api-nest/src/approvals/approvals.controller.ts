import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentOrgId, CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/constants/roles';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RbacGuard } from '../common/guards/rbac.guard';
import { User } from '../database/entities/user.entity';
import { ApprovalsService } from './approvals.service';

@Controller('approvals')
@UseGuards(JwtAuthGuard, RbacGuard)
export class ApprovalsController {
  constructor(private readonly approvals: ApprovalsService) {}

  @Get()
  @Roles(Role.Viewer)
  list(
    @CurrentOrgId() orgId: string,
    @Query('status') status?: string,
  ) {
    return this.approvals.list(orgId, status);
  }

  @Get(':id')
  @Roles(Role.Viewer)
  get(@CurrentOrgId() orgId: string, @Param('id') id: string) {
    return this.approvals.get(orgId, id);
  }

  @Post(':id/approve')
  @Roles(Role.Manager)
  approve(
    @CurrentOrgId() orgId: string,
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() body: { comment?: string },
  ) {
    return this.approvals.approve(orgId, id, user.id, body.comment);
  }

  @Post(':id/reject')
  @Roles(Role.Manager)
  reject(
    @CurrentOrgId() orgId: string,
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() body: { comment?: string },
  ) {
    return this.approvals.reject(orgId, id, user.id, body.comment);
  }
}
