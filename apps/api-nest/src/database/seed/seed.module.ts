import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Approval } from '../entities/approval.entity';
import { Connector } from '../entities/connector.entity';
import { Document } from '../entities/document.entity';
import { Organization } from '../entities/organization.entity';
import { User } from '../entities/user.entity';
import { Workflow } from '../entities/workflow.entity';
import { Workspace } from '../entities/workspace.entity';
import { KnowledgeModule } from '../../knowledge/knowledge.module';
import { SeedService } from './seed.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Organization,
      Workspace,
      User,
      Document,
      Workflow,
      Approval,
      Connector,
    ]),
    KnowledgeModule,
  ],
  providers: [SeedService],
  exports: [SeedService],
})
export class SeedModule {}
