import { ExecutionContext, createParamDecorator } from '@nestjs/common';

export const ReqMember = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const workspaceMember = request.workspaceMember;
    return data ? workspaceMember?.[data] : workspaceMember;
  },
);
