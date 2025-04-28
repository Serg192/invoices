import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { WorkspaceSerice } from 'src/workspaces/workspace.service';

@Injectable()
export class WorkspaceGuard implements CanActivate {
  constructor(private readonly workspaceService: WorkspaceSerice) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const request = context.switchToHttp().getRequest();
      const email = request.user.email;
      const workspaceId = request.params.id;

      const workspace = await this.workspaceService.findOne(workspaceId);
      if (!workspace) {
        throw new Error('Workspace does not exist');
      }

      //Assuming that the workspace doesn't have a large number of members
      const workspaceMember = workspace.members.find(
        (member) => member.user.email === email,
      );

      if (!workspaceMember) return false;
      request.workspaceMember = workspaceMember;
      request.workspace = workspace;

      return true;
    } catch (error) {
      console.log('workspace access error - ', error.message);
      throw new ForbiddenException(
        error.message || "You don't have access to the workspace",
      );
    }
  }
}
