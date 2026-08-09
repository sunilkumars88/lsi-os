import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentChunk } from '../database/entities/document-chunk.entity';
import { Document } from '../database/entities/document.entity';
import { EmbeddingsService } from './embeddings.service';
import { KnowledgeController } from './knowledge.controller';
import { KnowledgeService } from './knowledge.service';

@Module({
  imports: [TypeOrmModule.forFeature([Document, DocumentChunk])],
  controllers: [KnowledgeController],
  providers: [KnowledgeService, EmbeddingsService],
  exports: [KnowledgeService, EmbeddingsService],
})
export class KnowledgeModule {}
