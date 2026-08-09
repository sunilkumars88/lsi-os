import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { Organization } from './organization.entity';

@Entity('workspaces')
export class Workspace {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'org_id', type: 'uuid' })
  orgId!: string;

  @Column({ length: 255 })
  name!: string;

  @Column({ length: 100 })
  slug!: string;

  @Column({ type: 'simple-json', default: '{}' })
  settings!: Record<string, unknown>;

  @Column({ name: 'is_default', type: 'boolean', default: false })
  isDefault!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @ManyToOne(() => Organization, (org) => org.workspaces)
  @JoinColumn({ name: 'org_id' })
  organization!: Organization;
}
