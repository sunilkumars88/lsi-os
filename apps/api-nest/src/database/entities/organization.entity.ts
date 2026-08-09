import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Workspace } from './workspace.entity';
import { Invitation } from './invitation.entity';

@Entity('organizations')
export class Organization {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ length: 255 })
  name!: string;

  @Column({ length: 100, unique: true })
  slug!: string;

  @Column({ length: 50, default: 'professional' })
  plan!: string;

  @Column({ type: 'simple-json', default: '{}' })
  settings!: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @OneToMany(() => User, (user) => user.organization)
  users!: User[];

  @OneToMany(() => Workspace, (ws) => ws.organization)
  workspaces!: Workspace[];

  @OneToMany(() => Invitation, (inv) => inv.organization)
  invitations!: Invitation[];
}
