import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { Workflow } from './workflow.entity';

@Entity('workflow_runs')
export class WorkflowRun {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'workflow_id', type: 'uuid' })
  workflowId!: string;

  @Column({ name: 'org_id', type: 'uuid' })
  orgId!: string;

  @Column({ length: 50, default: 'running' })
  status!: string;

  @Column({ name: 'current_node_id', type: 'varchar', length: 100, nullable: true })
  currentNodeId!: string | null;

  @Column({ name: 'step_results', type: 'simple-json', default: '[]' })
  stepResults!: unknown[];

  @Column({ type: 'simple-json', default: '{}' })
  context!: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @Column({ name: 'completed_at', type: 'datetime', nullable: true })
  completedAt!: Date | null;

  @ManyToOne(() => Workflow, (wf) => wf.runs)
  @JoinColumn({ name: 'workflow_id' })
  workflow!: Workflow;
}
