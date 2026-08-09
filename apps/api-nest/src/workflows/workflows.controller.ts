import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  CurrentOrgId,
  CurrentUser,
} from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/constants/roles';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RbacGuard } from '../common/guards/rbac.guard';
import { User } from '../database/entities/user.entity';
import { WorkflowEdge, WorkflowNode } from './dag.util';
import { WorkflowsService } from './workflows.service';

@Controller('workflows')
@UseGuards(JwtAuthGuard, RbacGuard)
export class WorkflowsController {
  constructor(private readonly workflows: WorkflowsService) {}

  @Get()
  @Roles(Role.Viewer)
  list(@CurrentOrgId() orgId: string) {
    return this.workflows.list(orgId);
  }

  @Post()
  @Roles(Role.Operator)
  create(
    @CurrentOrgId() orgId: string,
    @Body()
    body: {
      name: string;
      description?: string;
      nodes?: WorkflowNode[];
      edges?: WorkflowEdge[];
      steps?: Array<{ id?: string; type: string; label?: string; config?: Record<string, unknown> }>;
    },
  ) {
    return this.workflows.create(orgId, body);
  }

  @Get('runs/list')
  @Roles(Role.Viewer)
  listRuns(
    @CurrentOrgId() orgId: string,
    @Query('workflowId') workflowId?: string,
  ) {
    return this.workflows.listRuns(orgId, workflowId);
  }

  @Get('runs/recent')
  @Roles(Role.Viewer)
  recentRuns(@CurrentOrgId() orgId: string) {
    return this.workflows.listRuns(orgId);
  }

  @Get('runs/:runId')
  @Roles(Role.Viewer)
  getRun(@CurrentOrgId() orgId: string, @Param('runId') runId: string) {
    return this.workflows.getRun(orgId, runId);
  }

  @Post('runs/:runId/resume')
  @Roles(Role.Operator)
  resume(
    @CurrentOrgId() orgId: string,
    @CurrentUser() user: User,
    @Param('runId') runId: string,
  ) {
    return this.workflows.resumeRun(orgId, runId, user.id);
  }

  @Get(':id')
  @Roles(Role.Viewer)
  get(@CurrentOrgId() orgId: string, @Param('id') id: string) {
    return this.workflows.get(orgId, id);
  }

  @Post(':id/run')
  @Roles(Role.Operator)
  run(
    @CurrentOrgId() orgId: string,
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() body: { input?: Record<string, unknown> },
  ) {
    return this.workflows.run(orgId, id, user.id, body.input ?? {});
  }
}
