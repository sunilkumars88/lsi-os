import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { appConfig, databaseConfig, jwtConfig } from '../config';
import * as entities from './entities';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const db = config.get<{ url: string; isSqlite: boolean; synchronize: boolean; logging: boolean }>('database')!;
        const entityList = Object.values(entities);

        if (db.isSqlite) {
          let sqlitePath = db.url.replace(/^sqlite:(?:\/\/\/)?/, '').replace(/^\/+/, '');
          if (!sqlitePath || sqlitePath === ':memory:') {
            sqlitePath = ':memory:';
          }
          return {
            type: 'better-sqlite3' as const,
            database: sqlitePath,
            entities: entityList,
            synchronize: db.synchronize,
            logging: db.logging,
          };
        }

        return {
          type: 'postgres' as const,
          url: db.url,
          entities: entityList,
          synchronize: db.synchronize,
          logging: db.logging,
          ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
        };
      },
    }),
  ],
})
export class DatabaseModule {}

export { appConfig, databaseConfig, jwtConfig };
