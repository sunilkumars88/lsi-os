import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog } from '../database/entities/audit-log.entity';
import { UsageMeter } from '../database/entities/usage-meter.entity';
import { User } from '../database/entities/user.entity';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, AuditLog, UsageMeter])],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
