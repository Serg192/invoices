import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.get<string[]>('roles', context.getHandler());

    if (!roles) {
      // No roles are specified, allow access
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user; // Assuming the user object is available after authentication

    if (!user || !user.role) {
      // User is not authenticated or does not have a role, deny access
      return false;
    }

    return roles.includes(user.role);
  }
}
