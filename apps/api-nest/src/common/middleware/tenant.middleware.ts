import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Response } from 'express';
import { RequestWithUser } from '../types/request-with-user';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: RequestWithUser, _res: Response, next: NextFunction) {
    const orgHeader = req.headers['x-org-id'];
    const workspaceHeader = req.headers['x-workspace-id'];

    if (typeof orgHeader === 'string' && orgHeader) {
      req.orgId = orgHeader;
    } else if (req.user?.orgId) {
      req.orgId = req.user.orgId;
    }

    if (typeof workspaceHeader === 'string' && workspaceHeader) {
      req.workspaceId = workspaceHeader;
    } else if (req.user?.workspaceId) {
      req.workspaceId = req.user.workspaceId ?? undefined;
    }

    next();
  }
}
