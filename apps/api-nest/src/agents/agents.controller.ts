import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentOrgId, CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/constants/roles';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RbacGuard } from '../common/guards/rbac.guard';
import { User } from '../database/entities/user.entity';
import { AgentsService } from './agents.service';

@Controller('agents')
@UseGuards(JwtAuthGuard, RbacGuard)
export class AgentsController {
  constructor(private readonly agents: AgentsService) {}

  @Get('jobs')
  @Roles(Role.Viewer)
  list(@CurrentOrgId() orgId: string) {
    return this.agents.list(orgId);
  }

  @Get('jobs/:id')
  @Roles(Role.Viewer)
  get(@CurrentOrgId() orgId: string, @Param('id') id: string) {
    return this.agents.get(orgId, id);
  }

  @Post('run')
  @Roles(Role.Operator)
  run(
    @CurrentOrgId() orgId: string,
    @CurrentUser() user: User,
    @Body()
    body: {
      name: string;
      agentType: string;
      input?: Record<string, unknown>;
      requiresApproval?: boolean;
    },
  ) {
    return this.agents.runJob(orgId, user.id, {
      name: body.name,
      agentType: body.agentType,
      input: body.input ?? {},
      requiresApproval: body.requiresApproval,
    });
  }
}
