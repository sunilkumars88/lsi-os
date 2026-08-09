import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { Connector } from './connector.entity';

@Entity('connector_syncs')
export class ConnectorSync {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'connector_id', type: 'uuid' })
  connectorId!: string;

  @Column({ name: 'org_id', type: 'uuid' })
  orgId!: string;

  @Column({ length: 50, default: 'running' })
  status!: string;

  @Column({ type: 'simple-json', default: '{}' })
  stats!: Record<string, unknown>;

  @Column({ type: 'simple-json', default: '[]' })
  errors!: unknown[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @Column({ name: 'completed_at', type: 'datetime', nullable: true })
  completedAt!: Date | null;

  @ManyToOne(() => Connector, (c) => c.syncs)
  @JoinColumn({ name: 'connector_id' })
  connector!: Connector;
}
