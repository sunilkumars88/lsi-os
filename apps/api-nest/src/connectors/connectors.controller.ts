import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentOrgId } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/constants/roles';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RbacGuard } from '../common/guards/rbac.guard';
import { ConnectorType } from './connector.registry';
import { ConnectorsService } from './connectors.service';

@Controller('connectors')
@UseGuards(JwtAuthGuard, RbacGuard)
export class ConnectorsController {
  constructor(private readonly connectors: ConnectorsService) {}

  @Get('registry')
  @Roles(Role.Viewer)
  registry() {
    return this.connectors.registry();
  }

  @Get()
  @Roles(Role.Viewer)
  list(@CurrentOrgId() orgId: string) {
    return this.connectors.list(orgId);
  }

  @Post('connect')
  @Roles(Role.Operator)
  connect(
    @CurrentOrgId() orgId: string,
    @Body()
    body: {
      type: ConnectorType;
      name: string;
      config?: Record<string, unknown>;
    },
  ) {
    return this.connectors.connect(orgId, body.type, body.name, body.config);
  }

  @Post(':id/test')
  @Roles(Role.Operator)
  test(@CurrentOrgId() orgId: string, @Param('id') id: string) {
    return this.connectors.test(orgId, id);
  }

  @Post(':id/sync')
  @Roles(Role.Operator)
  sync(@CurrentOrgId() orgId: string, @Param('id') id: string) {
    return this.connectors.sync(orgId, id);
  }

  @Post(':id/disconnect')
  @Roles(Role.Operator)
  disconnect(@CurrentOrgId() orgId: string, @Param('id') id: string) {
    return this.connectors.disconnect(orgId, id);
  }

  @Get(':id/syncs')
  @Roles(Role.Viewer)
  listSyncs(@CurrentOrgId() orgId: string, @Param('id') id: string) {
    return this.connectors.listSyncs(orgId, id);
  }
}
