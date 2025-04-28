import { ExecutionContext, createParamDecorator } from '@nestjs/common';

export const ReqWorkspace = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const workspace = request.workspace;
    return data ? workspace?.[data] : workspace;
  },
);
