import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryColumn,
} from 'typeorm';
import { WorkflowRun } from './workflow-run.entity';

@Entity('workflows')
export class Workflow {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'org_id', type: 'uuid' })
  orgId!: string;

  @Column({ length: 255 })
  name!: string;

  @Column({ type: 'text', default: '' })
  description!: string;

  @Column({ type: 'simple-json', default: '[]' })
  nodes!: unknown[];

  @Column({ type: 'simple-json', default: '[]' })
  edges!: unknown[];

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @OneToMany(() => WorkflowRun, (run) => run.workflow)
  runs!: WorkflowRun[];
}
