import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { Audit } from '../common/decorators/audit.decorator';
import {
  CurrentOrgId,
  CurrentWorkspaceId,
} from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/constants/roles';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RbacGuard } from '../common/guards/rbac.guard';
import { KnowledgeService } from './knowledge.service';

@Controller('knowledge')
@UseGuards(JwtAuthGuard, RbacGuard)
export class KnowledgeController {
  constructor(private readonly knowledge: KnowledgeService) {}

  @Get('documents')
  @Roles(Role.Viewer)
  list(
    @CurrentOrgId() orgId: string,
    @CurrentWorkspaceId() workspaceId?: string,
  ) {
    return this.knowledge.list(orgId, workspaceId);
  }

  @Get('documents/:id')
  @Roles(Role.Viewer)
  get(@CurrentOrgId() orgId: string, @Param('id') id: string) {
    return this.knowledge.get(orgId, id);
  }

  @Post('documents')
  @Roles(Role.Operator)
  @Audit('knowledge.document.create', 'document')
  create(
    @CurrentOrgId() orgId: string,
    @CurrentWorkspaceId() workspaceId: string | undefined,
    @Body()
    body: {
      title: string;
      content: string;
      source?: string;
      docType?: string;
      meta?: Record<string, unknown>;
    },
  ) {
    return this.knowledge.create(orgId, { ...body, workspaceId });
  }

  @Post('documents/upload')
  @Roles(Role.Operator)
  @Audit('knowledge.document.upload', 'document')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 15 * 1024 * 1024 },
    }),
  )
  upload(
    @CurrentOrgId() orgId: string,
    @CurrentWorkspaceId() workspaceId: string | undefined,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { title?: string; docType?: string },
  ) {
    return this.knowledge.createFromUpload(orgId, file, {
      title: body.title,
      docType: body.docType,
      workspaceId,
    });
  }

  @Post('search')
  @Roles(Role.Viewer)
  search(
    @CurrentOrgId() orgId: string,
    @Body() body: { query: string; topK?: number },
  ) {
    return this.knowledge.search(orgId, body.query, body.topK ?? 10);
  }

  @Get('search')
  @Roles(Role.Viewer)
  searchGet(
    @CurrentOrgId() orgId: string,
    @Query('q') query: string,
    @Query('topK') topK?: string,
  ) {
    return this.knowledge.search(orgId, query, topK ? parseInt(topK, 10) : 10);
  }
}
