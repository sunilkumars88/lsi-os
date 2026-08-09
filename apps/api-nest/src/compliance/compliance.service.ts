import { Injectable, NotFoundException } from '@nestjs/common';
import { COMPLIANCE_FRAMEWORKS } from './compliance.registry';

@Injectable()
export class ComplianceService {
  list() {
    return COMPLIANCE_FRAMEWORKS.map((f) => ({
      id: f.id,
      name: f.name,
      region: f.region,
      description: f.description,
      itemCount: f.items.length,
      implemented: f.items.filter((i) => i.status === 'implemented').length,
    }));
  }

  checklists() {
    return COMPLIANCE_FRAMEWORKS;
  }

  get(id: string) {
    const framework = COMPLIANCE_FRAMEWORKS.find((f) => f.id === id);
    if (!framework) throw new NotFoundException('Framework not found');
    return framework;
  }
}
