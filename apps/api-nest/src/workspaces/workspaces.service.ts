import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes } from 'crypto';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Invitation } from '../database/entities/invitation.entity';
import { User } from '../database/entities/user.entity';
import { Workspace } from '../database/entities/workspace.entity';

@Injectable()
export class WorkspacesService {
  constructor(
    @InjectRepository(Workspace)
    private readonly workspaces: Repository<Workspace>,
    @InjectRepository(Invitation)
    private readonly invitations: Repository<Invitation>,
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}

  list(orgId: string) {
    return this.workspaces.find({ where: { orgId }, order: { createdAt: 'ASC' } });
  }

  async create(orgId: string, name: string, slug?: string) {
    const ws = this.workspaces.create({
      id: uuidv4(),
      orgId,
      name,
      slug: slug ?? name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      isDefault: false,
      settings: {},
    });
    return this.workspaces.save(ws);
  }

  async switchWorkspace(userId: string, workspaceId: string) {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    const ws = await this.workspaces.findOne({
      where: { id: workspaceId, orgId: user.orgId },
    });
    if (!ws) throw new NotFoundException('Workspace not found');
    user.workspaceId = workspaceId;
    await this.users.save(user);
    return { workspaceId, workspace: ws };
  }

  async createInvitation(
    orgId: string,
    email: string,
    role: string,
    invitedBy: string,
  ) {
    const token = randomBytes(24).toString('hex');
    const inv = this.invitations.create({
      id: uuidv4(),
      orgId,
      email,
      role,
      token,
      status: 'pending',
      invitedBy,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    await this.invitations.save(inv);
    return {
      invitation: inv,
      token: process.env.NODE_ENV === 'production' ? undefined : token,
    };
  }

  async acceptInvitation(token: string, fullName: string, password: string) {
    const inv = await this.invitations.findOne({ where: { token, status: 'pending' } });
    if (!inv || inv.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired invitation');
    }
    const existing = await this.users.findOne({ where: { email: inv.email } });
    if (existing) {
      throw new BadRequestException('User already exists');
    }
    const defaultWs = await this.workspaces.findOne({
      where: { orgId: inv.orgId, isDefault: true },
    });
    const bcrypt = await import('bcryptjs');
    const user = this.users.create({
      id: uuidv4(),
      orgId: inv.orgId,
      workspaceId: defaultWs?.id ?? null,
      email: inv.email,
      fullName,
      hashedPassword: await bcrypt.hash(password, 10),
      role: inv.role,
      isActive: true,
    });
    await this.users.save(user);
    inv.status = 'accepted';
    await this.invitations.save(inv);
    return user;
  }

  listInvitations(orgId: string) {
    return this.invitations.find({ where: { orgId }, order: { createdAt: 'DESC' } });
  }
}
