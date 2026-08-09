import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
} from 'typeorm';

@Entity('magic_links')
export class MagicLink {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ length: 255 })
  email!: string;

  @Column({ length: 64 })
  token!: string;

  @Column({ length: 50, default: 'login' })
  purpose!: string;

  @Column({ name: 'expires_at', type: 'datetime' })
  expiresAt!: Date;

  @Column({ name: 'used_at', type: 'datetime', nullable: true })
  usedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
