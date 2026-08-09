import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Approval } from '../database/entities/approval.entity';
import { WorkflowsModule } from '../workflows/workflows.module';
import { ApprovalsController } from './approvals.controller';
import { ApprovalsService } from './approvals.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Approval]),
    forwardRef(() => WorkflowsModule),
  ],
  controllers: [ApprovalsController],
  providers: [ApprovalsService],
  exports: [ApprovalsService],
})
export class ApprovalsModule {}
