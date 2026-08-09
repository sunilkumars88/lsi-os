import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryColumn,
} from 'typeorm';
import { ConnectorSync } from './connector-sync.entity';

@Entity('connectors')
export class Connector {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'org_id', type: 'uuid' })
  orgId!: string;

  @Column({ length: 100 })
  type!: string;

  @Column({ length: 255 })
  name!: string;

  @Column({ length: 50, default: 'sandbox' })
  mode!: string;

  @Column({ length: 50, default: 'disconnected' })
  status!: string;

  @Column({ type: 'simple-json', default: '{}' })
  config!: Record<string, unknown>;

  @Column({ name: 'last_sync_at', type: 'datetime', nullable: true })
  lastSyncAt!: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @OneToMany(() => ConnectorSync, (sync) => sync.connector)
  syncs!: ConnectorSync[];
}
