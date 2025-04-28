import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class WorkspaceRolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    const workspaceRoles = this.reflector.get<string[]>(
      'wRoles',
      context.getHandler(),
    );

    if (!workspaceRoles) return true;

    const request = context.switchToHttp().getRequest();
    const workspaceMember = request.workspaceMember;

    console.log(workspaceMember);

    if (!workspaceMember || !workspaceMember.role.roleType) {
      return false;
    }

    return workspaceRoles.includes(workspaceMember.role.roleType);
  }
}
