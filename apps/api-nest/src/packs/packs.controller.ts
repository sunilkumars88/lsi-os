import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentOrgId, CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/constants/roles';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RbacGuard } from '../common/guards/rbac.guard';
import { User } from '../database/entities/user.entity';
import { PacksService } from './packs.service';

@Controller('packs')
@UseGuards(JwtAuthGuard, RbacGuard)
export class PacksController {
  constructor(private readonly packs: PacksService) {}

  @Get()
  @Roles(Role.Viewer)
  list() {
    return this.packs.list();
  }

  @Get(':id')
  @Roles(Role.Viewer)
  get(@Param('id') id: string) {
    return this.packs.get(id);
  }

  @Post(':id/actions/:actionId/run')
  @Roles(Role.Operator)
  runAction(
    @CurrentOrgId() orgId: string,
    @CurrentUser() user: User,
    @Param('id') packId: string,
    @Param('actionId') actionId: string,
    @Body() body: { input?: Record<string, unknown>; query?: string },
  ) {
    const input = { ...(body.input ?? {}) };
    if (body.query) input.query = body.query;
    return this.packs.runAction(orgId, user.id, packId, actionId, input);
  }

  @Post(':id/agents/:agentId/run')
  @Roles(Role.Operator)
  runAgent(
    @CurrentOrgId() orgId: string,
    @CurrentUser() user: User,
    @Param('id') packId: string,
    @Param('agentId') agentId: string,
    @Body() body: { query: string },
  ) {
    return this.packs.runAgent(orgId, user.id, packId, agentId, body.query);
  }
}
