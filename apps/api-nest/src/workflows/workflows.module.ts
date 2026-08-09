import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Approval } from '../database/entities/approval.entity';
import { WorkflowRun } from '../database/entities/workflow-run.entity';
import { Workflow } from '../database/entities/workflow.entity';
import { AgentsModule } from '../agents/agents.module';
import { ConnectorsModule } from '../connectors/connectors.module';
import { WorkflowsController } from './workflows.controller';
import { WorkflowsService } from './workflows.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Workflow, WorkflowRun, Approval]),
    forwardRef(() => AgentsModule),
    ConnectorsModule,
  ],
  controllers: [WorkflowsController],
  providers: [WorkflowsService],
  exports: [WorkflowsService],
})
export class WorkflowsModule {}
