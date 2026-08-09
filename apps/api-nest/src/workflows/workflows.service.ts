import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Approval } from '../database/entities/approval.entity';
import { WorkflowRun } from '../database/entities/workflow-run.entity';
import { Workflow } from '../database/entities/workflow.entity';
import { AgentsService } from '../agents/agents.service';
import { ConnectorsService } from '../connectors/connectors.service';
import {
  topologicalOrder,
  validateDag,
  WorkflowEdge,
  WorkflowNode,
} from './dag.util';

@Injectable()
export class WorkflowsService {
  constructor(
    @InjectRepository(Workflow) private readonly workflows: Repository<Workflow>,
    @InjectRepository(WorkflowRun)
    private readonly runs: Repository<WorkflowRun>,
    @InjectRepository(Approval)
    private readonly approvals: Repository<Approval>,
    private readonly agents: AgentsService,
    private readonly connectors: ConnectorsService,
  ) {}

  list(orgId: string) {
    return this.workflows.find({ where: { orgId }, order: { createdAt: 'DESC' } });
  }

  async create(
    orgId: string,
    data: {
      name: string;
      description?: string;
      nodes?: WorkflowNode[];
      edges?: WorkflowEdge[];
      steps?: Array<{
        id?: string;
        type: string;
        label?: string;
        config?: Record<string, unknown>;
      }>;
    },
  ) {
    let nodes = data.nodes ?? [];
    let edges = data.edges ?? [];

    // Accept linear "steps" from older UI and expand into a DAG.
    if ((!nodes.length || !edges.length) && data.steps?.length) {
      nodes = data.steps.map((s, i) => ({
        id: s.id || `step-${i + 1}`,
        type: s.type,
        label: s.label || s.type,
        config: s.config,
      }));
      edges = nodes.slice(0, -1).map((n, i) => ({
        from: n.id,
        to: nodes[i + 1]!.id,
      }));
    }

    const validation = validateDag(nodes, edges);
    if (!validation.valid) {
      throw new BadRequestException({
        message: 'Invalid DAG',
        errors: validation.errors,
      });
    }
    const wf = this.workflows.create({
      id: uuidv4(),
      orgId,
      name: data.name,
      description: data.description ?? '',
      nodes,
      edges,
      isActive: true,
    });
    return this.workflows.save(wf);
  }

  async get(orgId: string, id: string) {
    const wf = await this.workflows.findOne({ where: { id, orgId } });
    if (!wf) throw new NotFoundException('Workflow not found');
    return wf;
  }

  async run(orgId: string, workflowId: string, userId: string, input: Record<string, unknown> = {}) {
    const wf = await this.get(orgId, workflowId);
    const nodes = wf.nodes as WorkflowNode[];
    const edges = wf.edges as WorkflowEdge[];
    const order = topologicalOrder(nodes, edges);

    const run = this.runs.create({
      id: uuidv4(),
      workflowId: wf.id,
      orgId,
      status: 'running',
      currentNodeId: order[0] ?? null,
      stepResults: [],
      context: { input, userId },
    });
    await this.runs.save(run);

    return this.executeRun(run, wf, userId);
  }

  async resumeRun(orgId: string, runId: string, userId: string) {
    const run = await this.runs.findOne({ where: { id: runId, orgId } });
    if (!run) throw new NotFoundException('Run not found');
    if (run.status !== 'paused') {
      throw new BadRequestException('Run is not paused');
    }
    const wf = await this.get(orgId, run.workflowId);
    run.status = 'running';
    await this.runs.save(run);
    return this.executeRun(run, wf, userId);
  }

  async getRun(orgId: string, runId: string) {
    const run = await this.runs.findOne({ where: { id: runId, orgId } });
    if (!run) throw new NotFoundException('Run not found');
    return run;
  }

  listRuns(orgId: string, workflowId?: string) {
    const where: Record<string, string> = { orgId };
    if (workflowId) where.workflowId = workflowId;
    return this.runs.find({ where, order: { createdAt: 'DESC' }, take: 50 });
  }

  private async executeRun(run: WorkflowRun, wf: Workflow, userId: string) {
    const nodes = wf.nodes as WorkflowNode[];
    const edges = wf.edges as WorkflowEdge[];
    const order = topologicalOrder(nodes, edges);
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));
    const results = [...(run.stepResults as unknown[])];
    const completed = new Set(
      results
        .map((r) => (r as { nodeId?: string }).nodeId)
        .filter(Boolean) as string[],
    );

    const startIdx = run.currentNodeId
      ? order.indexOf(run.currentNodeId)
      : 0;

    for (let i = Math.max(0, startIdx); i < order.length; i++) {
      const nodeId = order[i]!;
      if (completed.has(nodeId)) continue;
      const node = nodeMap.get(nodeId);
      if (!node) continue;

      run.currentNodeId = nodeId;
      await this.runs.save(run);

      // Parallel fan-out: execute this node and siblings that share no dependency barrier.
      if (node.type === 'parallel') {
        const branchIds = (node.config?.branches as string[]) ||
          edges.filter((e) => e.from === nodeId).map((e) => e.to);
        const branchNodes = branchIds
          .map((id) => nodeMap.get(id))
          .filter(Boolean) as WorkflowNode[];

        const branchResults = await Promise.all(
          branchNodes.map((bn) =>
            this.executeNode(bn, run, orgIdFrom(run), userId),
          ),
        );
        results.push({
          nodeId,
          type: 'parallel',
          result: { status: 'completed', branches: branchResults.length },
        });
        completed.add(nodeId);

        for (let b = 0; b < branchNodes.length; b++) {
          const bn = branchNodes[b]!;
          const br = branchResults[b]!;
          results.push({ nodeId: bn.id, type: bn.type, result: br });
          completed.add(bn.id);
          if (br.status === 'paused') {
            run.status = 'paused';
            run.currentNodeId = bn.id;
            run.stepResults = results;
            await this.runs.save(run);
            return run;
          }
        }
        continue;
      }

      const stepResult = await this.executeNode(node, run, orgIdFrom(run), userId);
      results.push({ nodeId, type: node.type, result: stepResult });
      completed.add(nodeId);

      if (stepResult.status === 'paused') {
        run.status = 'paused';
        run.stepResults = results;
        await this.runs.save(run);
        return run;
      }

      const nextEdges = edges.filter((e) => e.from === nodeId);
      if (node.type === 'condition' && nextEdges.length > 0) {
        const expr = String(node.config?.expression ?? 'true');
        const pass = this.evalCondition(
          expr,
          run.context as Record<string, unknown>,
        );
        const target = nextEdges.find((e) =>
          pass ? e.condition !== 'false' : e.condition === 'false',
        );
        if (target) {
          const jumpIdx = order.indexOf(target.to);
          if (jumpIdx > i) i = jumpIdx - 1;
        }
      }
    }

    run.status = 'completed';
    run.stepResults = results;
    run.completedAt = new Date();
    run.currentNodeId = null;
    await this.runs.save(run);
    return run;
  }

  private async executeNode(
    node: WorkflowNode,
    run: WorkflowRun,
    orgId: string,
    userId: string,
  ): Promise<Record<string, unknown>> {
    switch (node.type) {
      case 'sequential':
      case 'parallel':
      case 'ingest':
      case 'extract':
      case 'analyze':
        return { status: 'completed', message: `${node.type} step done` };

      case 'condition':
        return { status: 'completed', evaluated: true };

      case 'approval': {
        const approval = this.approvals.create({
          id: uuidv4(),
          orgId,
          requestedBy: userId,
          resourceType: 'workflow_run',
          resourceId: run.id,
          status: 'pending',
          title: node.label ?? 'Workflow approval required',
          payload: { nodeId: node.id, context: run.context },
          reviewedBy: null,
          comment: null,
          reviewedAt: null,
        });
        await this.approvals.save(approval);
        return { status: 'paused', approvalId: approval.id };
      }

      case 'agent': {
        const job = await this.agents.runJob(orgId, userId, {
          name: node.label ?? 'Workflow agent',
          agentType: String(node.config?.agentType ?? 'general'),
          input: (run.context as Record<string, unknown>) ?? {},
        });
        return { status: 'completed', jobId: job.id, result: job.result };
      }

      case 'connector': {
        const connectorId = String(node.config?.connectorId ?? '');
        if (connectorId) {
          const sync = await this.connectors.sync(orgId, connectorId);
          return { status: 'completed', syncId: sync.id };
        }
        return { status: 'completed', message: 'No connector configured' };
      }

      case 'notify':
        return {
          status: 'completed',
          channel: node.config?.channel ?? 'email',
          message: 'Notification sent (sandbox)',
        };

      default:
        return { status: 'completed', message: `Unknown node type ${node.type}` };
    }
  }

  private evalCondition(expr: string, context: Record<string, unknown>): boolean {
    if (expr === 'true') return true;
    if (expr === 'false') return false;
    try {
      return Boolean(
        Function('ctx', `with(ctx){ return (${expr}); }`)(context),
      );
    } catch {
      return false;
    }
  }
}

function orgIdFrom(run: WorkflowRun): string {
  return run.orgId;
}
