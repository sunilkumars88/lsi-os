import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
} from 'typeorm';

@Entity('approvals')
export class Approval {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'org_id', type: 'uuid' })
  orgId!: string;

  @Column({ name: 'requested_by', type: 'uuid' })
  requestedBy!: string;

  @Column({ name: 'resource_type', length: 100 })
  resourceType!: string;

  @Column({ name: 'resource_id', type: 'uuid' })
  resourceId!: string;

  @Column({ length: 50, default: 'pending' })
  status!: string;

  @Column({ type: 'text', default: '' })
  title!: string;

  @Column({ type: 'simple-json', default: '{}' })
  payload!: Record<string, unknown>;

  @Column({ name: 'reviewed_by', type: 'uuid', nullable: true })
  reviewedBy!: string | null;

  @Column({ type: 'text', nullable: true })
  comment!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @Column({ name: 'reviewed_at', type: 'datetime', nullable: true })
  reviewedAt!: Date | null;
}
