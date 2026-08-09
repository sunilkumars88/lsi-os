import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';
import { createHash } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import { dirname, join } from 'path';

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private client: Minio.Client | null = null;
  private bucket = 'eios-documents';
  private localRoot = join(process.cwd(), '.data', 'objects');

  constructor(private readonly config: ConfigService) {}

  async onModuleInit() {
    const endpoint = this.config.get<string>('app.minioEndpoint') || '';
    const accessKey = this.config.get<string>('app.minioAccessKey') || '';
    const secretKey = this.config.get<string>('app.minioSecretKey') || '';
    this.bucket =
      this.config.get<string>('app.minioBucket') || 'eios-documents';

    if (!endpoint || !accessKey || !secretKey) {
      this.logger.warn('MinIO not configured — using local object store');
      await mkdir(this.localRoot, { recursive: true });
      return;
    }

    const [host, portRaw] = endpoint.replace(/^https?:\/\//, '').split(':');
    const port = portRaw ? parseInt(portRaw, 10) : 9000;
    const useSSL = endpoint.startsWith('https://');

    this.client = new Minio.Client({
      endPoint: host || 'localhost',
      port,
      useSSL,
      accessKey,
      secretKey,
    });

    try {
      const exists = await this.client.bucketExists(this.bucket);
      if (!exists) await this.client.makeBucket(this.bucket, 'us-east-1');
      this.logger.log(`MinIO ready bucket=${this.bucket}`);
    } catch (err) {
      this.logger.warn(
        `MinIO unavailable (${(err as Error).message}) — local fallback`,
      );
      this.client = null;
      await mkdir(this.localRoot, { recursive: true });
    }
  }

  async putObject(
    key: string,
    buffer: Buffer,
    contentType = 'application/octet-stream',
  ): Promise<{ key: string; backend: 'minio' | 'local'; size: number }> {
    if (this.client) {
      await this.client.putObject(this.bucket, key, buffer, buffer.length, {
        'Content-Type': contentType,
      });
      return { key, backend: 'minio', size: buffer.length };
    }

    const path = join(this.localRoot, key);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, buffer);
    return { key, backend: 'local', size: buffer.length };
  }

  objectKey(orgId: string, filename: string) {
    const safe = filename.replace(/[^a-zA-Z0-9._-]+/g, '_');
    const hash = createHash('sha1')
      .update(`${orgId}:${filename}:${Date.now()}`)
      .digest('hex')
      .slice(0, 10);
    return `${orgId}/${hash}-${safe}`;
  }
}
