import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { JwtPayload } from '../common/types/request-with-user';
import { MagicLink } from '../database/entities/magic-link.entity';
import { Organization } from '../database/entities/organization.entity';
import { RefreshToken } from '../database/entities/refresh-token.entity';
import { User } from '../database/entities/user.entity';
import { Workspace } from '../database/entities/workspace.entity';
import {
  LoginDto,
  MagicLinkRequestDto,
  MagicLinkVerifyDto,
  PasswordResetDto,
  PasswordResetRequestDto,
  RefreshDto,
  RegisterDto,
} from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Organization)
    private readonly orgs: Repository<Organization>,
    @InjectRepository(Workspace)
    private readonly workspaces: Repository<Workspace>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokens: Repository<RefreshToken>,
    @InjectRepository(MagicLink)
    private readonly magicLinks: Repository<MagicLink>,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.users.findOne({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const orgId = uuidv4();
    const workspaceId = uuidv4();
    const slug = (dto.orgName ?? dto.email.split('@')[0])
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .slice(0, 50);

    const org = this.orgs.create({
      id: orgId,
      name: dto.orgName ?? `${dto.fullName}'s Organization`,
      slug: `${slug}-${orgId.slice(0, 8)}`,
      plan: 'starter',
      settings: {},
    });
    await this.orgs.save(org);

    const workspace = this.workspaces.create({
      id: workspaceId,
      orgId,
      name: 'Default Workspace',
      slug: 'default',
      isDefault: true,
      settings: {},
    });
    await this.workspaces.save(workspace);

    const user = this.users.create({
      id: uuidv4(),
      orgId,
      workspaceId,
      email: dto.email,
      fullName: dto.fullName,
      hashedPassword: await bcrypt.hash(dto.password, 10),
      role: 'admin',
      isActive: true,
    });
    await this.users.save(user);

    return this.issueTokens(user);
  }

  async login(dto: LoginDto) {
    const user = await this.users.findOne({ where: { email: dto.email } });
    if (!user || !(await bcrypt.compare(dto.password, user.hashedPassword))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (!user.isActive) {
      throw new UnauthorizedException('Account is inactive');
    }
    return this.issueTokens(user);
  }

  async refresh(dto: RefreshDto) {
    const record = await this.refreshTokens.findOne({
      where: { token: dto.refreshToken },
    });
    if (!record || record.revokedAt || record.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    const user = await this.users.findOne({ where: { id: record.userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    record.revokedAt = new Date();
    await this.refreshTokens.save(record);
    return this.issueTokens(user);
  }

  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      const record = await this.refreshTokens.findOne({
        where: { token: refreshToken, userId },
      });
      if (record) {
        record.revokedAt = new Date();
        await this.refreshTokens.save(record);
      }
    } else {
      await this.refreshTokens.update(
        { userId, revokedAt: null as unknown as Date },
        { revokedAt: new Date() },
      );
    }
    return { success: true };
  }

  async requestMagicLink(dto: MagicLinkRequestDto) {
    const token = randomBytes(32).toString('hex');
    const link = this.magicLinks.create({
      id: uuidv4(),
      email: dto.email,
      token,
      purpose: 'login',
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      usedAt: null,
    });
    await this.magicLinks.save(link);
    return {
      success: true,
      message: 'Magic link created',
      token: process.env.NODE_ENV === 'production' ? undefined : token,
    };
  }

  async verifyMagicLink(dto: MagicLinkVerifyDto) {
    const link = await this.magicLinks.findOne({ where: { token: dto.token } });
    if (!link || link.usedAt || link.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired magic link');
    }
    let user = await this.users.findOne({ where: { email: link.email } });
    if (!user) {
      throw new NotFoundException('User not found for magic link');
    }
    link.usedAt = new Date();
    await this.magicLinks.save(link);
    return this.issueTokens(user);
  }

  async requestPasswordReset(dto: PasswordResetRequestDto) {
    const user = await this.users.findOne({ where: { email: dto.email } });
    if (!user) {
      return { success: true, message: 'If the email exists, a reset link was sent' };
    }
    const token = randomBytes(32).toString('hex');
    const link = this.magicLinks.create({
      id: uuidv4(),
      email: dto.email,
      token,
      purpose: 'password_reset',
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      usedAt: null,
    });
    await this.magicLinks.save(link);
    return {
      success: true,
      message: 'Password reset link created',
      token: process.env.NODE_ENV === 'production' ? undefined : token,
    };
  }

  async resetPassword(dto: PasswordResetDto) {
    const link = await this.magicLinks.findOne({
      where: { token: dto.token, purpose: 'password_reset' },
    });
    if (!link || link.usedAt || link.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired reset token');
    }
    const user = await this.users.findOne({ where: { email: link.email } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.hashedPassword = await bcrypt.hash(dto.newPassword, 10);
    await this.users.save(user);
    link.usedAt = new Date();
    await this.magicLinks.save(link);
    return { success: true };
  }

  async me(user: User) {
    const org = await this.orgs.findOne({ where: { id: user.orgId } });
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      full_name: user.fullName,
      role: user.role,
      orgId: user.orgId,
      org_id: user.orgId,
      orgName: org?.name ?? null,
      org_name: org?.name ?? null,
      workspaceId: user.workspaceId,
      workspace_id: user.workspaceId,
    };
  }

  private async issueTokens(user: User) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      orgId: user.orgId,
      workspaceId: user.workspaceId ?? undefined,
      role: user.role,
    };

    const accessToken = await this.jwt.signAsync(payload);
    const refreshToken = randomBytes(48).toString('hex');
    const refreshDays = 7;
    const refreshRecord = this.refreshTokens.create({
      id: uuidv4(),
      userId: user.id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + refreshDays * 24 * 60 * 60 * 1000),
      revokedAt: null,
    });
    await this.refreshTokens.save(refreshRecord);

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: this.config.get<string>('jwt.accessExpiresIn'),
      user: await this.me(user),
    };
  }
}
