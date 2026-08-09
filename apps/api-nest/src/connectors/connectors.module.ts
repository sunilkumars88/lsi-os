import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConnectorSync } from '../database/entities/connector-sync.entity';
import { Connector } from '../database/entities/connector.entity';
import { ConnectorsController } from './connectors.controller';
import { ConnectorsService } from './connectors.service';

@Module({
  imports: [TypeOrmModule.forFeature([Connector, ConnectorSync])],
  controllers: [ConnectorsController],
  providers: [ConnectorsService],
  exports: [ConnectorsService],
})
export class ConnectorsModule {}
