import { Request } from 'express';
import { User } from '../../database/entities/user.entity';

export interface JwtPayload {
  sub: string;
  email: string;
  orgId: string;
  workspaceId?: string;
  role: string;
}

export interface RequestWithUser extends Request {
  user?: User;
  jwtPayload?: JwtPayload;
  orgId?: string;
  workspaceId?: string;
}
