import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/constants/roles';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RbacGuard } from '../common/guards/rbac.guard';
import { ComplianceService } from './compliance.service';

@Controller('compliance')
@UseGuards(JwtAuthGuard, RbacGuard)
export class ComplianceController {
  constructor(private readonly compliance: ComplianceService) {}

  @Get()
  @Roles(Role.Viewer)
  list() {
    return this.compliance.list();
  }

  @Get('checklists')
  @Roles(Role.Viewer)
  checklists() {
    return this.compliance.checklists();
  }

  @Get(':id')
  @Roles(Role.Viewer)
  get(@Param('id') id: string) {
    return this.compliance.get(id);
  }
}
