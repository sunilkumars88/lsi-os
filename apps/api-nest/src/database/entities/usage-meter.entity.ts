import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
} from 'typeorm';

@Entity('usage_meters')
export class UsageMeter {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'org_id', type: 'uuid' })
  orgId!: string;

  @Column({ length: 50 })
  provider!: string;

  @Column({ length: 100 })
  model!: string;

  @Column({ name: 'tokens_in', type: 'int', default: 0 })
  tokensIn!: number;

  @Column({ name: 'tokens_out', type: 'int', default: 0 })
  tokensOut!: number;

  @Column({ name: 'cost_inr', type: 'float', default: 0 })
  costInr!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
