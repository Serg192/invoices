import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class WorkspacePermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    const permissions = this.reflector.get<string[]>(
      'wPermissions',
      context.getHandler(),
    );

    if (!permissions) return true;

    const request = context.switchToHttp().getRequest();
    const workspaceMember = request.workspaceMember;

    if (!workspaceMember || !workspaceMember.role.permissions) {
      return false;
    }

    return workspaceMember.role.permissions.includes(permissions);
  }
}
