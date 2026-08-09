import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { CurrentOrgId } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/constants/roles';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RbacGuard } from '../common/guards/rbac.guard';
import { AdminService } from './admin.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, RbacGuard)
@Roles(Role.Admin)
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('users')
  listUsers(@CurrentOrgId() orgId: string) {
    return this.admin.listUsers(orgId);
  }

  @Patch('users/:userId/role')
  updateRole(
    @CurrentOrgId() orgId: string,
    @Param('userId') userId: string,
    @Body() body: { role: string },
  ) {
    return this.admin.updateUserRole(orgId, userId, body.role);
  }

  @Get('usage')
  usage(@CurrentOrgId() orgId: string) {
    return this.admin.usageSummary(orgId);
  }

  @Get('audit')
  audit(@CurrentOrgId() orgId: string) {
    return this.admin.auditSummary(orgId);
  }

  @Get('models/status')
  routerStatus() {
    return this.admin.routerStatus();
  }

  @Get('smtp-status')
  smtpStatus() {
    return this.admin.smtpStatus();
  }
}
