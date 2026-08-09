import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
} from 'typeorm';

@Entity('api_keys')
export class ApiKey {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'org_id', type: 'uuid' })
  orgId!: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId!: string | null;

  @Column({ length: 255 })
  name!: string;

  @Column({ name: 'key_prefix', length: 16 })
  keyPrefix!: string;

  @Column({ name: 'key_hash', length: 255 })
  keyHash!: string;

  @Column({ length: 50, default: 'active' })
  status!: string;

  @Column({ name: 'last_used_at', type: 'datetime', nullable: true })
  lastUsedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
