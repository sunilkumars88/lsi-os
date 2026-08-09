import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { ConnectorSync } from '../database/entities/connector-sync.entity';
import { Connector } from '../database/entities/connector.entity';
import { createConnector } from './connector.factory';
import { CONNECTOR_REGISTRY, ConnectorType } from './connector.registry';

@Injectable()
export class ConnectorsService {
  constructor(
    @InjectRepository(Connector)
    private readonly connectors: Repository<Connector>,
    @InjectRepository(ConnectorSync)
    private readonly syncs: Repository<ConnectorSync>,
  ) {}

  registry() {
    return CONNECTOR_REGISTRY;
  }

  list(orgId: string) {
    return this.connectors.find({
      where: { orgId },
      order: { createdAt: 'ASC' },
    });
  }

  async connect(
    orgId: string,
    type: ConnectorType,
    name: string,
    config: Record<string, unknown> = {},
  ) {
    const meta = CONNECTOR_REGISTRY.find((c) => c.type === type);
    if (!meta) throw new BadRequestException('Unknown connector type');

    const adapter = createConnector(type, { ...config, sandbox: true });
    const auth = await adapter.authenticate();
    if (!auth.ok) throw new BadRequestException(auth.message || 'Auth failed');

    const connector = this.connectors.create({
      id: uuidv4(),
      orgId,
      type,
      name,
      mode: 'sandbox',
      status: 'connected',
      config: { ...config, sandbox: true, package: `@eios/connector-${type}` },
      lastSyncAt: null,
    });
    return this.connectors.save(connector);
  }

  async test(orgId: string, id: string) {
    const connector = await this.get(orgId, id);
    const adapter = createConnector(connector.type, connector.config || {});
    const result = await adapter.testConnection();
    return {
      success: result.ok,
      connectorId: connector.id,
      type: connector.type,
      mode: connector.mode,
      message: result.message,
      latencyMs: result.latency_ms,
      package: `@eios/connector-${connector.type}`,
    };
  }

  async sync(orgId: string, id: string) {
    const connector = await this.get(orgId, id);
    const adapter = createConnector(connector.type, connector.config || {});

    const sync = this.syncs.create({
      id: uuidv4(),
      connectorId: connector.id,
      orgId,
      status: 'running',
      stats: {},
      errors: [],
    });
    await this.syncs.save(sync);

    try {
      const result = await adapter.sync('all');
      sync.status = 'completed';
      sync.stats = {
        recordsProcessed: result.records,
        mode: connector.mode,
        message: result.message,
        sample: result.data.slice(0, 3),
      };
      sync.completedAt = new Date();
      await this.syncs.save(sync);

      connector.lastSyncAt = new Date();
      connector.status = 'connected';
      await this.connectors.save(connector);
      return sync;
    } catch (err) {
      sync.status = 'failed';
      sync.errors = [(err as Error).message];
      sync.completedAt = new Date();
      await this.syncs.save(sync);
      throw err;
    }
  }

  async disconnect(orgId: string, id: string) {
    const connector = await this.get(orgId, id);
    connector.status = 'disconnected';
    return this.connectors.save(connector);
  }

  async get(orgId: string, id: string) {
    const connector = await this.connectors.findOne({ where: { id, orgId } });
    if (!connector) throw new NotFoundException('Connector not found');
    return connector;
  }

  listSyncs(orgId: string, connectorId: string) {
    return this.syncs.find({
      where: { orgId, connectorId },
      order: { createdAt: 'DESC' },
      take: 20,
    });
  }
}
