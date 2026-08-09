import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity('agent_jobs')
export class AgentJob {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'org_id', type: 'uuid' })
  orgId!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ length: 255 })
  name!: string;

  @Column({ name: 'agent_type', length: 100 })
  agentType!: string;

  @Column({ length: 50, default: 'queued' })
  status!: string;

  @Column({ type: 'simple-json', default: '{}' })
  input!: Record<string, unknown>;

  @Column({ type: 'simple-json', default: '[]' })
  plan!: unknown[];

  @Column({ type: 'simple-json', default: '{}' })
  result!: Record<string, unknown>;

  @Column({ name: 'requires_approval', type: 'boolean', default: false })
  requiresApproval!: boolean;

  @Column({ type: 'boolean', nullable: true })
  approved!: boolean | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @Column({ name: 'completed_at', type: 'datetime', nullable: true })
  completedAt!: Date | null;
}
