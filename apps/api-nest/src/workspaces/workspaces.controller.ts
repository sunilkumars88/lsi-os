import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentOrgId, CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/constants/roles';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Public } from '../common/guards/public.decorator';
import { RbacGuard } from '../common/guards/rbac.guard';
import { User } from '../database/entities/user.entity';
import { WorkspacesService } from './workspaces.service';

@Controller('workspaces')
export class WorkspacesController {
  constructor(private readonly workspaces: WorkspacesService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  list(@CurrentOrgId() orgId: string) {
    return this.workspaces.list(orgId);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RbacGuard)
  @Roles(Role.Admin, Role.Manager)
  create(
    @CurrentOrgId() orgId: string,
    @Body() body: { name: string; slug?: string },
  ) {
    return this.workspaces.create(orgId, body.name, body.slug);
  }

  @Post('switch/:workspaceId')
  @UseGuards(JwtAuthGuard)
  switch(
    @CurrentUser() user: User,
    @Param('workspaceId') workspaceId: string,
  ) {
    return this.workspaces.switchWorkspace(user.id, workspaceId);
  }

  @Get('invitations')
  @UseGuards(JwtAuthGuard, RbacGuard)
  @Roles(Role.Admin, Role.Manager)
  listInvitations(@CurrentOrgId() orgId: string) {
    return this.workspaces.listInvitations(orgId);
  }

  @Post('invitations')
  @UseGuards(JwtAuthGuard, RbacGuard)
  @Roles(Role.Admin, Role.Manager)
  createInvitation(
    @CurrentOrgId() orgId: string,
    @CurrentUser() user: User,
    @Body() body: { email: string; role?: string },
  ) {
    return this.workspaces.createInvitation(
      orgId,
      body.email,
      body.role ?? 'viewer',
      user.id,
    );
  }

  @Public()
  @Post('invitations/accept')
  acceptInvitation(
    @Body() body: { token: string; fullName: string; password: string },
  ) {
    return this.workspaces.acceptInvitation(
      body.token,
      body.fullName,
      body.password,
    );
  }
}
