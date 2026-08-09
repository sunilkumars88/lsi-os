import { Injectable, NotFoundException } from '@nestjs/common';
import { AgentsService } from '../agents/agents.service';
import { PACKS } from './packs.registry';

@Injectable()
export class PacksService {
  constructor(private readonly agents: AgentsService) {}

  list() {
    return PACKS;
  }

  get(id: string) {
    const pack = PACKS.find((p) => p.id === id);
    if (!pack) throw new NotFoundException('Pack not found');
    return pack;
  }

  async runAction(
    orgId: string,
    userId: string,
    packId: string,
    actionId: string,
    input: Record<string, unknown> = {},
  ) {
    const pack = this.get(packId);
    const action = pack.actions.find((a) => a.id === actionId);
    const agent = pack.agents.find((a) => a.id === actionId);
    if (!action && !agent) throw new NotFoundException('Pack action/agent not found');

    const label = action?.name || agent?.name || actionId;
    return this.agents.runJob(orgId, userId, {
      name: `${pack.name}: ${label}`,
      agentType: agent?.id || `${pack.industry}.${actionId}`,
      input: {
        packId,
        actionId,
        query: String(input.query || input.objective || label),
        ...input,
      },
    });
  }

  async runAgent(
    orgId: string,
    userId: string,
    packId: string,
    agentId: string,
    query: string,
  ) {
    return this.runAction(orgId, userId, packId, agentId, { query });
  }
}
