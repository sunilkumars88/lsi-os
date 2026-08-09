import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from '../database/entities/organization.entity';
import { User } from '../database/entities/user.entity';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private readonly orgs: Repository<Organization>,
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}

  async get(orgId: string) {
    const org = await this.orgs.findOne({ where: { id: orgId } });
    if (!org) throw new NotFoundException('Organization not found');
    return org;
  }

  async update(orgId: string, data: Partial<Organization>) {
    const org = await this.get(orgId);
    Object.assign(org, data);
    return this.orgs.save(org);
  }

  async listMembers(orgId: string) {
    return this.users.find({ where: { orgId }, order: { createdAt: 'ASC' } });
  }
}
