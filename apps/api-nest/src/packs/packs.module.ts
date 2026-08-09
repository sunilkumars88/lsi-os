import { Module } from '@nestjs/common';
import { AgentsModule } from '../agents/agents.module';
import { PacksController } from './packs.controller';
import { PacksService } from './packs.service';

@Module({
  imports: [AgentsModule],
  controllers: [PacksController],
  providers: [PacksService],
})
export class PacksModule {}
