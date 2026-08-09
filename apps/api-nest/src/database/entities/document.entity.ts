import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryColumn,
} from 'typeorm';
import { DocumentChunk } from './document-chunk.entity';

@Entity('documents')
export class Document {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'org_id', type: 'uuid' })
  orgId!: string;

  @Column({ name: 'workspace_id', type: 'uuid', nullable: true })
  workspaceId!: string | null;

  @Column({ length: 500 })
  title!: string;

  @Column({ length: 100, default: 'upload' })
  source!: string;

  @Column({ name: 'doc_type', length: 100, default: 'general' })
  docType!: string;

  @Column({ type: 'text' })
  content!: string;

  @Column({ type: 'simple-json', default: '{}' })
  meta!: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @OneToMany(() => DocumentChunk, (chunk) => chunk.document)
  chunks!: DocumentChunk[];
}
