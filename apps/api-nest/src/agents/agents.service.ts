import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import OpenAI from 'openai';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { AgentJob } from '../database/entities/agent-job.entity';
import { UsageMeter } from '../database/entities/usage-meter.entity';

@Injectable()
export class AgentsService {
  private openai: OpenAI | null = null;

  constructor(
    @InjectRepository(AgentJob) private readonly jobs: Repository<AgentJob>,
    @InjectRepository(UsageMeter)
    private readonly usage: Repository<UsageMeter>,
    private readonly config: ConfigService,
  ) {
    const apiKey = this.config.get<string>('app.openaiApiKey');
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    }
  }

  list(orgId: string) {
    return this.jobs.find({ where: { orgId }, order: { createdAt: 'DESC' }, take: 50 });
  }

  async get(orgId: string, id: string) {
    return this.jobs.findOne({ where: { id, orgId } });
  }

  async runJob(
    orgId: string,
    userId: string,
    params: {
      name: string;
      agentType: string;
      input: Record<string, unknown>;
      requiresApproval?: boolean;
    },
  ) {
    const job = this.jobs.create({
      id: uuidv4(),
      orgId,
      userId,
      name: params.name,
      agentType: params.agentType,
      status: 'running',
      input: params.input,
      plan: [],
      result: {},
      requiresApproval: params.requiresApproval ?? false,
      approved: null,
    });
    await this.jobs.save(job);

    const output = await this.invokeAi(params.agentType, params.input);
    job.status = 'completed';
    job.result = output;
    job.completedAt = new Date();
    await this.jobs.save(job);

    await this.recordUsage(orgId, output);
    return job;
  }

  private async invokeAi(
    agentType: string,
    input: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const aiUrl = this.config.get<string>('app.aiServiceUrl');
    if (aiUrl) {
      const base = aiUrl.replace(/\/$/, '');
      for (const path of ['/agents/run', '/api/v1/agents/run']) {
        try {
          const res = await fetch(`${base}${path}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ agentType, input }),
          });
          if (res.ok) {
            return (await res.json()) as Record<string, unknown>;
          }
        } catch {
          // try next path
        }
      }
    }

    if (this.openai) {
      const model = this.config.get<string>('app.openaiModel')!;
      const prompt = `You are an enterprise ${agentType} agent. Respond with concise JSON-friendly analysis.\nInput: ${JSON.stringify(input)}`;
      const completion = await this.openai.chat.completions.create({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
      });
      const text = completion.choices[0]?.message?.content ?? '';
      return {
        provider: 'openai',
        model,
        summary: text,
        tokensIn: completion.usage?.prompt_tokens ?? 0,
        tokensOut: completion.usage?.completion_tokens ?? 0,
      };
    }

    return {
      provider: 'demo',
      summary: `Demo ${agentType} agent completed for: ${JSON.stringify(input).slice(0, 200)}`,
      tokensIn: 0,
      tokensOut: 0,
    };
  }

  private async recordUsage(orgId: string, output: Record<string, unknown>) {
    const meter = this.usage.create({
      id: uuidv4(),
      orgId,
      provider: String(output.provider ?? 'demo'),
      model: String(output.model ?? 'demo'),
      tokensIn: Number(output.tokensIn ?? 0),
      tokensOut: Number(output.tokensOut ?? 0),
      costInr: 0,
    });
    await this.usage.save(meter);
  }
}
