import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { DocumentChunk } from '../database/entities/document-chunk.entity';
import { Document } from '../database/entities/document.entity';
import { StorageService } from '../storage/storage.service';
import {
  chunkText,
  EmbeddingsService,
  rankBySimilarity,
} from './embeddings.service';

@Injectable()
export class KnowledgeService {
  constructor(
    @InjectRepository(Document) private readonly docs: Repository<Document>,
    @InjectRepository(DocumentChunk)
    private readonly chunks: Repository<DocumentChunk>,
    private readonly embeddings: EmbeddingsService,
    private readonly storage: StorageService,
  ) {}

  list(orgId: string, workspaceId?: string) {
    const where: Record<string, string> = { orgId };
    if (workspaceId) where.workspaceId = workspaceId;
    return this.docs.find({ where, order: { createdAt: 'DESC' } });
  }

  async get(orgId: string, id: string) {
    const doc = await this.docs.findOne({ where: { id, orgId } });
    if (!doc) throw new NotFoundException('Document not found');
    const docChunks = await this.chunks.find({
      where: { documentId: id },
      order: { chunkIndex: 'ASC' },
    });
    return { ...doc, chunks: docChunks };
  }

  async create(
    orgId: string,
    data: {
      title: string;
      content: string;
      source?: string;
      docType?: string;
      workspaceId?: string;
      meta?: Record<string, unknown>;
    },
  ) {
    const doc = this.docs.create({
      id: uuidv4(),
      orgId,
      workspaceId: data.workspaceId ?? null,
      title: data.title,
      content: data.content,
      source: data.source ?? 'upload',
      docType: data.docType ?? 'general',
      meta: data.meta ?? {},
    });
    await this.docs.save(doc);
    await this.ingest(doc);
    return this.get(orgId, doc.id);
  }

  async createFromUpload(
    orgId: string,
    file: Express.Multer.File,
    opts: { title?: string; workspaceId?: string; docType?: string } = {},
  ) {
    const content = this.extractText(file);
    const key = this.storage.objectKey(orgId, file.originalname);
    const stored = await this.storage.putObject(
      key,
      file.buffer,
      file.mimetype || 'application/octet-stream',
    );

    return this.create(orgId, {
      title: opts.title || file.originalname,
      content,
      source: 'upload',
      docType: opts.docType || this.inferDocType(file.originalname),
      workspaceId: opts.workspaceId,
      meta: {
        filename: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        storage: stored,
      },
    });
  }

  private inferDocType(filename: string) {
    const lower = filename.toLowerCase();
    if (lower.endsWith('.pdf')) return 'pdf';
    if (lower.endsWith('.csv')) return 'csv';
    if (lower.endsWith('.json')) return 'json';
    if (lower.endsWith('.md') || lower.endsWith('.txt')) return 'text';
    return 'general';
  }

  private extractText(file: Express.Multer.File): string {
    const name = file.originalname.toLowerCase();
    const raw = file.buffer.toString('utf8');

    if (name.endsWith('.json')) {
      try {
        return JSON.stringify(JSON.parse(raw), null, 2);
      } catch {
        return raw;
      }
    }

    if (name.endsWith('.csv') || name.endsWith('.txt') || name.endsWith('.md')) {
      return raw;
    }

    if (name.endsWith('.pdf')) {
      // Lightweight PDF text extraction (no native deps): pull printable strings.
      const matches = raw.match(/[\x20-\x7E\n\r\t]{4,}/g) || [];
      const text = matches.join('\n').replace(/\s+/g, ' ').trim();
      return (
        text ||
        `[PDF binary uploaded: ${file.originalname}. Text extraction limited without PDF parser; content stored in object storage.]`
      );
    }

    return raw || `[Binary upload: ${file.originalname}]`;
  }

  async ingest(doc: Document) {
    await this.chunks.delete({ documentId: doc.id });
    const parts = chunkText(doc.content, 512, 0.2);
    const vectors = await this.embeddings.embed(parts);

    for (let i = 0; i < parts.length; i++) {
      const chunk = this.chunks.create({
        id: uuidv4(),
        documentId: doc.id,
        orgId: doc.orgId,
        chunkIndex: i,
        content: parts[i]!,
        embedding: vectors[i] ?? null,
      });
      await this.chunks.save(chunk);
    }
  }

  async search(orgId: string, query: string, topK = 10) {
    const [queryVec] = await this.embeddings.embed([query]);
    const allChunks = await this.chunks.find({ where: { orgId } });

    const vectorHits = rankBySimilarity(
      queryVec!,
      allChunks.map((c) => ({
        id: c.id,
        embedding: c.embedding,
        content: c.content,
      })),
      Math.max(topK * 3, 20),
    );

    const terms = query
      .toLowerCase()
      .split(/\s+/)
      .filter((t) => t.length > 2);
    const keywordScores = new Map<string, number>();
    for (const chunk of allChunks) {
      const hay = chunk.content.toLowerCase();
      let score = 0;
      for (const term of terms) {
        if (hay.includes(term)) score += 1;
      }
      if (score > 0) keywordScores.set(chunk.id, score / terms.length);
    }

    const fused = new Map<
      string,
      { chunkId: string; score: number; content: string }
    >();
    for (const hit of vectorHits) {
      fused.set(hit.id, {
        chunkId: hit.id,
        content: hit.content,
        score: hit.score * 0.7,
      });
    }
    for (const [id, kw] of keywordScores) {
      const chunk = allChunks.find((c) => c.id === id);
      if (!chunk) continue;
      const prev = fused.get(id);
      const score = (prev?.score ?? 0) + kw * 0.3;
      fused.set(id, {
        chunkId: id,
        content: chunk.content,
        score,
      });
    }

    const ranked = [...fused.values()]
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);

    const docIds = new Set<string>();
    const interim = [];
    for (const hit of ranked) {
      const chunk = allChunks.find((c) => c.id === hit.chunkId);
      if (!chunk) continue;
      docIds.add(chunk.documentId);
      interim.push({
        chunkId: chunk.id,
        documentId: chunk.documentId,
        content: hit.content,
        score: hit.score,
        chunkIndex: chunk.chunkIndex,
      });
    }

    const documents =
      docIds.size > 0
        ? await this.docs.find({ where: { id: In([...docIds]) } })
        : [];
    const docMap = new Map(documents.map((d) => [d.id, d]));

    const results = interim.map((r, idx) => {
      const doc = docMap.get(r.documentId);
      return {
        ...r,
        documentTitle: doc?.title,
        citation: {
          index: idx + 1,
          documentId: r.documentId,
          documentTitle: doc?.title ?? 'Untitled',
          chunkId: r.chunkId,
          chunkIndex: r.chunkIndex,
          excerpt: r.content.slice(0, 240),
          source: doc?.source ?? 'upload',
        },
      };
    });

    return {
      query,
      mode: 'hybrid',
      results,
      citations: results.map((r) => r.citation),
    };
  }
}
