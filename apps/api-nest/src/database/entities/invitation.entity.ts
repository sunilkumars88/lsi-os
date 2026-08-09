import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { Organization } from './organization.entity';

@Entity('invitations')
export class Invitation {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'org_id', type: 'uuid' })
  orgId!: string;

  @Column({ length: 255 })
  email!: string;

  @Column({ length: 50, default: 'viewer' })
  role!: string;

  @Column({ length: 64 })
  token!: string;

  @Column({ length: 50, default: 'pending' })
  status!: string;

  @Column({ name: 'invited_by', type: 'uuid', nullable: true })
  invitedBy!: string | null;

  @Column({ name: 'expires_at', type: 'datetime' })
  expiresAt!: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @ManyToOne(() => Organization, (org) => org.invitations)
  @JoinColumn({ name: 'org_id' })
  organization!: Organization;
}
