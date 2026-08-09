import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RequestWithUser } from '../types/request-with-user';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    return request.user;
  },
);

export const CurrentOrgId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    return request.orgId ?? request.user?.orgId;
  },
);

export const CurrentWorkspaceId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    return request.workspaceId ?? request.user?.workspaceId;
  },
);
