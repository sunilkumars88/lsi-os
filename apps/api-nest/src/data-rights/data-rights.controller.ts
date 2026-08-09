import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import {
  CurrentOrgId,
  CurrentUser,
} from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/constants/roles';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RbacGuard } from '../common/guards/rbac.guard';
import { User } from '../database/entities/user.entity';
import { DataRightsService } from './data-rights.service';

@Controller('data-rights')
@UseGuards(JwtAuthGuard, RbacGuard)
export class DataRightsController {
  constructor(private readonly dataRights: DataRightsService) {}

  @Get('zones')
  @Roles(Role.Viewer)
  zones() {
    return this.dataRights.zones();
  }

  @Get('registry')
  @Roles(Role.Viewer)
  registry() {
    return this.dataRights.registry();
  }

  @Get('zones/:id')
  @Roles(Role.Viewer)
  getZone(@Param('id') id: string) {
    return this.dataRights.getZone(id);
  }

  @Get('reviews')
  @Roles(Role.Manager)
  reviews(@CurrentOrgId() orgId: string) {
    return this.dataRights.listReviews(orgId);
  }

  @Post('review')
  @Roles(Role.Operator)
  review(
    @CurrentOrgId() orgId: string,
    @CurrentUser() user: User,
    @Body() body: { zoneId: string; reason?: string },
  ) {
    return this.dataRights.requestReview(
      orgId,
      body.zoneId,
      user.email,
      body.reason ?? 'Scheduled data-rights review',
    );
  }
}
