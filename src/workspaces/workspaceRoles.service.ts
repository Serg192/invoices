import {
  ConflictException,
  ForbiddenException,
  Injectable,
  MethodNotAllowedException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { WorkspaceRole } from './models/workspaceRole.model';
import { getDefaultPermissions, getDefaultRoleFeature } from 'src/_helpers';
import {
  BranchOperatorWMemberRole,
  assignablePermissions,
} from 'src/_config/workspace';
import { Workspace } from './models/workspace.model';
import { CreateWorkspaceRoleDto } from './dto/workspaceRoles/createWorkspaceRole.dto';
import { UpdateWorkspaceRoleDto } from './dto/workspaceRoles/updateWorkspaceRole.dto';
import { WorkspaceMember } from './models/workspaceMember.model';

@Injectable()
export class WorkspaceRolesService {
  constructor(
    @InjectModel(WorkspaceRole.name) private workspaceRoleModel,
    @InjectModel(WorkspaceMember.name) private workspaceMemberModel,
    @InjectModel(Workspace.name) private workspaceModel,
  ) {}

  async initDefaultRoles(): Promise<void> {
    const existingRole = await this.workspaceRoleModel.findOne({
      roleType: 'admin',
    });

    if (!existingRole) {
      const rolesToCreate: BranchOperatorWMemberRole[] = [
        'owner',
        'admin',
        'guest',
      ];

      rolesToCreate.forEach(async (roleType) => {
        const role = new this.workspaceRoleModel({
          roleType,
          roleName: roleType,
          permissions: [...getDefaultPermissions(roleType)],
          criticalRoleFeature: getDefaultRoleFeature(roleType),
        });
        await role.save();
      });
    }
  }

  async getDefaultRole(
    roleType: 'admin' | 'owner' | 'guest',
  ): Promise<WorkspaceRole> {
    return await this.workspaceRoleModel.findOne({ roleType: roleType });
  }

  async getRoleById(id: string): Promise<WorkspaceRole> {
    return await this.workspaceRoleModel.findById(id);
  }

  private async validateRoleName(
    workspace: Workspace,
    roleName: string,
  ): Promise<void> {
    const roleExist = await this.workspaceRoleModel.findOne({
      roleName,
      workspace: workspace._id,
    });

    if (
      roleExist ||
      roleName === 'admin' ||
      roleName === 'owner' ||
      roleName === 'guest'
    ) {
      throw new ConflictException('Role already exist');
    }
  }

  async createNewRole(
    workspace: Workspace,
    createRole: CreateWorkspaceRoleDto,
  ): Promise<WorkspaceRole> {
    await this.validateRoleName(workspace, createRole.roleName);

    const newRole = new this.workspaceRoleModel({
      roleType: 'employee',
      ...createRole,
      workspace: workspace._id,
    });

    await newRole.save();

    return newRole;
  }

  async updateRole(
    workspace: Workspace,
    roleId: string,
    updateWorkspaceRole: UpdateWorkspaceRoleDto,
  ): Promise<WorkspaceRole> {
    if (updateWorkspaceRole.roleName) {
      await this.validateRoleName(workspace, updateWorkspaceRole.roleName);
    }

    const role = await this.workspaceRoleModel.findById(roleId);
    if (!role) {
      throw new NotFoundException(`Role with id=${roleId} was not found`);
    }

    role.roleName = updateWorkspaceRole.roleName || role.roleName;
    role.description = updateWorkspaceRole.description || role.description;
    role.permissions = updateWorkspaceRole.permissions || role.permissions;
    role.criticalRoleFeature =
      updateWorkspaceRole.criticalRoleFeature || role.criticalRoleFeature;

    await role.save();
    return role;
  }

  async getRolesForWorkspace(workspace: Workspace): Promise<WorkspaceRole[]> {
    const allRoles = await this.workspaceRoleModel
      .find({
        workspace: workspace._id,
      })
      .exec();

    allRoles.push(await this.getDefaultRole('owner'));
    allRoles.push(await this.getDefaultRole('admin'));

    const rolesWithStats = await Promise.all(
      allRoles.map(async (role) => {
        const used = await this.countRoleUsageInWorkspace(
          role._id,
          workspace._id,
        );
        return { role, used };
      }),
    );

    return rolesWithStats;
  }

  async deleteRole(roleId: string): Promise<boolean> {
    const role = await this.workspaceRoleModel.findById(roleId);

    if (!role) {
      throw new NotFoundException();
    }

    const roleUsed = await this.workspaceMemberModel.findOne({
      role: role._id,
    });

    if (roleUsed || role.roleType !== 'employee') {
      console.log('Role used: ', roleUsed);
      console.log('Type: ', role.roleType);
      throw new MethodNotAllowedException();
    }

    await role.deleteOne();
    return true;
  }

  async deleteAllRolesInWorkspace(workspace: Workspace): Promise<boolean> {
    await this.workspaceRoleModel
      .deleteMany({ workspace: workspace._id })
      .exec();
    return true;
  }

  getAssignablePermissions(): string[] {
    return assignablePermissions;
  }

  private async countRoleUsageInWorkspace(
    roleId: string,
    workspaceId: string,
  ): Promise<number> {
    const result = await this.workspaceModel.aggregate([
      {
        $match: { _id: workspaceId },
      },
      {
        $lookup: {
          from: 'workspacemembers',
          localField: 'members',
          foreignField: '_id',
          as: 'members',
        },
      },
      {
        $unwind: '$members',
      },
      {
        $match: { 'members.role': roleId },
      },
      {
        $count: 'count',
      },
    ]);

    return result.length > 0 ? result[0].count : 0;
  }
}
