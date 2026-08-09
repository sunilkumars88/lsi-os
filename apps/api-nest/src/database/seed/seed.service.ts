import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { Approval } from '../entities/approval.entity';
import { Connector } from '../entities/connector.entity';
import { Document } from '../entities/document.entity';
import { Organization } from '../entities/organization.entity';
import { User } from '../entities/user.entity';
import { Workflow } from '../entities/workflow.entity';
import { Workspace } from '../entities/workspace.entity';
import { KnowledgeService } from '../../knowledge/knowledge.service';

export const SEED_IDS = {
  org: '00000000-0000-4000-8000-000000000001',
  workspace: '00000000-0000-4000-8000-000000000002',
  admin: '00000000-0000-4000-8000-000000000011',
  analyst: '00000000-0000-4000-8000-000000000012',
  workflow: '00000000-0000-4000-8000-000000000021',
  approval: '00000000-0000-4000-8000-000000000031',
  connectorSlack: '00000000-0000-4000-8000-000000000041',
  connectorSalesforce: '00000000-0000-4000-8000-000000000042',
};

const SEED_DOCS = [
  {
    title: 'CardiaX Phase III Synopsis',
    docType: 'protocol',
    content:
      'CardiaX is an oral SGLT2-pathway modulator in Phase III for HFpEF. Primary endpoint: cardiovascular death or HF hospitalization at 24 months.',
  },
  {
    title: 'OncoPrime Biomarker Testing Brief',
    docType: 'medical',
    content:
      'OncoPrime is a PD-1 combination therapy for NSCLC with PD-L1 >= 50%. Medical affairs priorities include KOL education on companion diagnostics.',
  },
  {
    title: 'ImmunoPath Safety Signal Assessment',
    docType: 'safety',
    content:
      'ImmunoPath (IL-17 pathway) has an open signal for inflammatory bowel events. Human-in-the-loop approval required before external communication.',
  },
];

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(Organization)
    private readonly orgs: Repository<Organization>,
    @InjectRepository(Workspace)
    private readonly workspaces: Repository<Workspace>,
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Document) private readonly docs: Repository<Document>,
    @InjectRepository(Workflow)
    private readonly workflows: Repository<Workflow>,
    @InjectRepository(Approval)
    private readonly approvals: Repository<Approval>,
    @InjectRepository(Connector)
    private readonly connectors: Repository<Connector>,
    private readonly knowledge: KnowledgeService,
  ) {}

  async onModuleInit() {
    if (!this.config.get<boolean>('app.seedOnStartup')) {
      return;
    }
    await this.seed();
  }

  async seed() {
    let org = await this.orgs.findOne({ where: { slug: 'lsi-demo' } });
    if (!org) {
      org = this.orgs.create({
        id: SEED_IDS.org,
        name: 'LSI Demo Pharma',
        slug: 'lsi-demo',
        plan: 'enterprise',
        settings: { industry: 'pharma' },
      });
      await this.orgs.save(org);
    }

    let workspace = await this.workspaces.findOne({
      where: { id: SEED_IDS.workspace },
    });
    if (!workspace) {
      workspace = this.workspaces.create({
        id: SEED_IDS.workspace,
        orgId: org.id,
        name: 'Demo Workspace',
        slug: 'demo',
        isDefault: true,
        settings: {},
      });
      await this.workspaces.save(workspace);
    }

    const passwordHash = await bcrypt.hash('demo1234', 10);

    let admin = await this.users.findOne({ where: { email: 'admin@lsi.os' } });
    if (!admin) {
      admin = this.users.create({
        id: SEED_IDS.admin,
        orgId: org.id,
        workspaceId: workspace.id,
        email: 'admin@lsi.os',
        fullName: 'Ada Admin',
        hashedPassword: passwordHash,
        role: 'admin',
        isActive: true,
      });
      await this.users.save(admin);
    }

    let analyst = await this.users.findOne({ where: { email: 'analyst@lsi.os' } });
    if (!analyst) {
      analyst = this.users.create({
        id: SEED_IDS.analyst,
        orgId: org.id,
        workspaceId: workspace.id,
        email: 'analyst@lsi.os',
        fullName: 'Alex Analyst',
        hashedPassword: passwordHash,
        role: 'operator',
        isActive: true,
      });
      await this.users.save(analyst);
    }

    for (const item of SEED_DOCS) {
      const existing = await this.docs.findOne({
        where: { orgId: org.id, title: item.title },
      });
      if (!existing) {
        await this.knowledge.create(org.id, {
          title: item.title,
          content: item.content,
          docType: item.docType,
          source: 'seed',
          workspaceId: workspace.id,
        });
      }
    }

    let workflow = await this.workflows.findOne({
      where: { id: SEED_IDS.workflow },
    });
    if (!workflow) {
      workflow = this.workflows.create({
        id: SEED_IDS.workflow,
        orgId: org.id,
        name: 'Intelligence Brief Pipeline',
        description:
          'Ingest knowledge, extract trials, analyze KPIs, approve, notify executives.',
        nodes: [
          { id: 'ingest', label: 'Ingest', type: 'ingest' },
          { id: 'extract', label: 'Extract Trials', type: 'extract' },
          { id: 'analyze', label: 'Analyze KPIs', type: 'analyze' },
          { id: 'approve', label: 'Approve', type: 'approval' },
          { id: 'notify', label: 'Notify', type: 'notify' },
        ],
        edges: [
          { from: 'ingest', to: 'extract' },
          { from: 'extract', to: 'analyze' },
          { from: 'analyze', to: 'approve' },
          { from: 'approve', to: 'notify' },
        ],
        isActive: true,
      });
      await this.workflows.save(workflow);
    }

    let approval = await this.approvals.findOne({
      where: { id: SEED_IDS.approval },
    });
    if (!approval) {
      approval = this.approvals.create({
        id: SEED_IDS.approval,
        orgId: org.id,
        requestedBy: analyst.id,
        resourceType: 'safety_communication',
        resourceId: workflow.id,
        status: 'pending',
        title: 'ImmunoPath external communication review',
        payload: {
          summary: 'Draft DHPC for inflammatory bowel signal requires manager approval.',
        },
        reviewedBy: null,
        comment: null,
        reviewedAt: null,
      });
      await this.approvals.save(approval);
    }

    const connectorSeeds = [
      {
        id: SEED_IDS.connectorSlack,
        type: 'slack',
        name: 'Slack Sandbox',
      },
      {
        id: SEED_IDS.connectorSalesforce,
        type: 'salesforce',
        name: 'Salesforce Sandbox',
      },
    ];

    for (const c of connectorSeeds) {
      const existing = await this.connectors.findOne({ where: { id: c.id } });
      if (!existing) {
        await this.connectors.save(
          this.connectors.create({
            id: c.id,
            orgId: org.id,
            type: c.type,
            name: c.name,
            mode: 'sandbox',
            status: 'connected',
            config: { sandbox: true },
            lastSyncAt: null,
          }),
        );
      }
    }

    this.logger.log('Seed complete. Demo login: admin@lsi.os / demo1234');
  }
}
