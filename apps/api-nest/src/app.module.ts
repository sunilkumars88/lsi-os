import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AdminModule } from './admin/admin.module';
import { AgentsModule } from './agents/agents.module';
import { ApprovalsModule } from './approvals/approvals.module';
import { AuditModule } from './audit/audit.module';
import { AuthModule } from './auth/auth.module';
import { BillingModule } from './billing/billing.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { TenantMiddleware } from './common/middleware/tenant.middleware';
import { ComplianceModule } from './compliance/compliance.module';
import { ConnectorsModule } from './connectors/connectors.module';
import { DataRightsModule } from './data-rights/data-rights.module';
import {
  appConfig,
  databaseConfig,
  DatabaseModule,
  jwtConfig,
} from './database/database.module';
import { SeedModule } from './database/seed/seed.module';
import { HealthModule } from './health/health.module';
import { KnowledgeModule } from './knowledge/knowledge.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { PacksModule } from './packs/packs.module';
import { StorageModule } from './storage/storage.module';
import { WorkflowsModule } from './workflows/workflows.module';
import { WorkspacesModule } from './workspaces/workspaces.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, jwtConfig],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 120,
      },
    ]),
    DatabaseModule,
    StorageModule,
    HealthModule,
    AuthModule,
    OrganizationsModule,
    WorkspacesModule,
    AuditModule,
    KnowledgeModule,
    ConnectorsModule,
    AgentsModule,
    WorkflowsModule,
    ApprovalsModule,
    PacksModule,
    ComplianceModule,
    DataRightsModule,
    AdminModule,
    BillingModule,
    SeedModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantMiddleware).forRoutes('*');
  }
}
