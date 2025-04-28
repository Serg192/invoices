import {
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  MethodNotAllowedException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Workspace } from './models/workspace.model';
import { WorkspaceMember } from './models/workspaceMember.model';
import { UsersService } from 'src/users/user.service';
import { User } from 'src/users/models/user.model';
import { JwtService } from '@nestjs/jwt';
import {
  workspaceOwnerPermissions,
  workspaceRoles,
} from 'src/_config/workspace';
import {
  getDefaultPermissions,
  hasHigherWorkspaceRole,
} from 'src/_helpers/workspace.helper';
import { Email } from 'src/emails/model/email.model';
import { EmailService } from 'src/emails/email.service';
import {
  PaginatedResponse,
  PaginationOptions,
} from 'src/_helpers/pagination.helper';
import { dateFilterRegex } from 'src/_config/regex';
import { S3Provider } from 'src/users/providers/s3.provider';
import {
  AddEmployeeDto,
  AssignMemberRoleDto,
  UpdateWorkspaceDto,
  WorkspaceDto,
} from './dto';
import { WorkspaceRolesService } from './workspaceRoles.service';
import { WorkspaceRole } from './models/workspaceRole.model';
import { StatisticsService } from 'src/report/statistics.service';
import { getLastMonthPeriod } from 'src/_helpers/date.helper';

@Injectable()
export class WorkspaceSerice {
  /*
  TODO: Should be implemented using Redis. Due to time economy reasons,
  it works via JS Map at the moment. With this approach if server will be
  restarted - saved tokens will be lost, causing a security hole.
  */
  private expiredInviteTokens: Map<string, boolean> = new Map();

  private readonly workspacePopulateConfig = {
    path: 'members',
    model: WorkspaceMember,
    populate: [
      {
        path: 'user',
        select: '-password',
        model: User,
      },
      {
        path: 'role',
        model: WorkspaceRole,
      },
    ],
  };

  constructor(
    @InjectModel(Workspace.name) private workspaceModel,
    @InjectModel(WorkspaceMember.name) private workspaceMemberModel,
    private readonly userService: UsersService,
    private readonly workspaceRolesService: WorkspaceRolesService,
    private readonly emailSerice: EmailService,
    private readonly statisticsService: StatisticsService,
    private readonly jwtService: JwtService,
    private readonly s3Provider: S3Provider,
  ) {}

  async createWorkspace(
    workspaceDto: WorkspaceDto,
    creatorId: string,
  ): Promise<Workspace> {
    const workspaceCreator = await this.userService.findOne(creatorId);
    if (!workspaceCreator) throw new Error('User not found');

    // Email is auto generated now
    // const emailInUse = await this.findByEmail(workspaceDto.email);
    // if (emailInUse) throw new ConflictException('Email is already in use');

    const workspaceOwnerRole = await this.workspaceRolesService.getDefaultRole(
      'owner',
    );

    const workspaceMember = new this.workspaceMemberModel({
      user: workspaceCreator._id,
      role: workspaceOwnerRole._id,
    });
    await workspaceMember.save();

    const workspace = new this.workspaceModel({
      ...workspaceDto,
      members: [],
    });

    workspace.members.push(workspaceMember);
    await workspace.save();
    await workspace.populate(this.workspacePopulateConfig);

    return workspace;
  }

  async updateWorkspace(
    workspace: Workspace,
    { email, ...updateWorkspace }: UpdateWorkspaceDto,
  ): Promise<Workspace> {
    const emailIsUsed = email && (await this.findByEmail(email));

    if (email && emailIsUsed && workspace.email !== email) {
      throw new ConflictException('Email is already taken');
    } else if (email) {
      await this.emailSerice.migrateEmails(workspace.email, email);
      workspace.email = email;
    }

    workspace.name = updateWorkspace.name || workspace.name;
    workspace.about = updateWorkspace.about || workspace.about;
    await workspace.save();
    return workspace;
  }

  async uploadPicture(workspace: Workspace, file): Promise<Workspace> {
    const oldImgUrl = workspace.picture;

    workspace.picture = await this.s3Provider.uploadFile(
      'pictures',
      file,
      `workspaces/${workspace._id}/picture`,
      file.mimetype,
    );

    await workspace.save();
    if (oldImgUrl) await this.s3Provider.deleteFile(oldImgUrl);
    return workspace;
  }

  async getMyWorkspaces(userId: string): Promise<Workspace[]> {
    try {
      const workspaceMembers = await this.workspaceMemberModel.find({
        user: userId,
      });

      const membersIds = workspaceMembers.map((member) => member._id);

      const workspaces = await this.workspaceModel
        .find({
          members: { $in: membersIds },
        })
        .exec();
      return workspaces;
    } catch (error) {
      console.log('get workspaces error: ' + error);
      return [];
    }
  }

  async getRoles(): Promise<any> {
    // If we want roles to be customizable, they should be stored in the workspace.

    const roles = workspaceRoles.map((role) => ({
      role,
      permissions: getDefaultPermissions(role),
    }));
    return roles;
  }

  async findByEmail(email: string): Promise<Workspace> {
    return this.workspaceModel.findOne({ email });
  }

  async findOne(id: string): Promise<Workspace> {
    const workspace = this.workspaceModel.findById(id);
    workspace.populate(this.workspacePopulateConfig);
    return workspace;
  }

  async sendInvite(
    workspace: Workspace,
    addEmplDto: AddEmployeeDto,
    requestor: User,
  ): Promise<boolean> {
    const user = await this.userService.findByEmail(addEmplDto.email);

    return await this.emailSerice.sendInvite(
      workspace,
      user ? user : addEmplDto.email,
      requestor,
    );
  }

  async handleAddEmployeeToWorkspace(
    requestorEmail: string,
    token: string,
  ): Promise<boolean> {
    const { email, workspaceId } = await this.validateAddEmployeeToWorkspace(
      requestorEmail,
      token,
    );

    const newUser = await this.addEmployeeToWorkspace(email, workspaceId);

    //Notifications
    const workspace = await this.workspaceModel
      .findById(workspaceId)
      .populate(this.workspacePopulateConfig)
      .exec();

    const members = workspace.members.filter(
      (member) =>
        member.role.roleType === 'admin' || member.role.roleType === 'owner',
    );

    members.forEach(async (member) => {
      await this.emailSerice.sendUserJoinedNotification(
        member.user.email,
        newUser,
        workspace,
      );
    });

    return true;
  }

  private async validateAddEmployeeToWorkspace(
    requestorEmail: string,
    token: string,
  ): Promise<{ email: string; workspaceId: string }> {
    try {
      if (this.expiredInviteTokens.has(token)) {
        throw new Error('invite link has expired');
      }

      const { email, workspaceId } = await this.jwtService.verify(token, {
        secret: process.env.JWT_INVITE_TOKEN_SECRET,
      });

      //If the user is logged in with another account.
      if (requestorEmail !== email) {
        throw new MethodNotAllowedException();
      }

      //this.expiredInviteTokens.set(token, true);
      return { email, workspaceId };
    } catch (error) {
      const errorText = error.toString().split(': ')[1];

      throw new HttpException(
        errorText || 'Something went wrong. Double check the token',
        HttpStatus.FORBIDDEN,
      );
    }
  }

  private async addEmployeeToWorkspace(
    email: string,
    workspaceId: string,
  ): Promise<User> {
    const user = await this.userService.findByEmail(email);
    if (!user) throw new Error('User not found');

    const workspace = await this.findOne(workspaceId);
    if (!workspace) throw new Error('User not found');

    const defaultNewMemberRole =
      await this.workspaceRolesService.getDefaultRole('guest');
    const workspaceMember = new this.workspaceMemberModel({
      user: user._id,
      role: defaultNewMemberRole._id,
    });

    await workspaceMember.save();
    workspace.members.push(workspaceMember);
    await workspace.save();
    return user;
  }

  async deleteEmployeeFromWorkspace(
    requestorRole: WorkspaceRole,
    empId: string,
    workspaceId: string,
  ): Promise<boolean> {
    const workspace = await this.findOne(workspaceId);

    const employee = await this.workspaceMemberModel.findById(empId).populate({
      path: 'role',
    });
    if (!employee) throw new NotFoundException('Employee not found');

    //check if we have higher role
    if (
      hasHigherWorkspaceRole(requestorRole.roleType, employee.role.roleType)
    ) {
      const removeIndex = workspace.members.findIndex(
        (member) => member._id === employee._id,
      );

      if (employee.role.roleType === 'owner') {
        const owners = workspace.members.reduce((count, m) => {
          return m.role.roleType === 'owner' ? count + 1 : count;
        }, 0);
        if (owners <= 1) throw new MethodNotAllowedException();
      }

      workspace.members.splice(removeIndex, 1);
      await workspace.save();
      await this.workspaceMemberModel.deleteOne({ _id: empId });
      return true;
    }

    throw new MethodNotAllowedException();
  }

  async deleteWorkspace(workspace: Workspace): Promise<boolean> {
    const workspaceEmail = workspace.email;

    const memberIds = workspace.members.map((member) => member._id);

    await this.workspaceMemberModel
      .deleteMany({ _id: { $in: memberIds } })
      .exec();

    await this.workspaceRolesService.deleteAllRolesInWorkspace(workspace);
    await workspace.deleteOne();
    await this.emailSerice.flagEmailsAsInactive(workspaceEmail);
    return true;
  }

  async assignRoleToMember(
    assignRoleDto: AssignMemberRoleDto,
  ): Promise<WorkspaceMember> {
    const workspaceMember = await this.workspaceMemberModel.findById(
      assignRoleDto.memberId,
    );
    if (!workspaceMember) throw new NotFoundException('User not found');

    const role = await this.workspaceRolesService.getRoleById(
      assignRoleDto.roleId,
    );

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    workspaceMember.role = role._id;
    return await workspaceMember.save();
  }

  async getInvoices(
    email: string,
    paginationOpt: PaginationOptions,
    startDate: string,
    endDate: string,
    pattern: string,
  ): Promise<PaginatedResponse<Email>> {
    const sDate = dateFilterRegex.test(startDate) && new Date(startDate);
    const eDate = dateFilterRegex.test(endDate) && new Date(endDate);

    return await this.emailSerice.getEmailsForWorkspace(
      email,
      paginationOpt,
      sDate,
      eDate,
      pattern,
    );
  }

  async getStatistics(workspace: Workspace): Promise<any> {
    const currentYearStatistics =
      await this.statisticsService.getYearStatistics(workspace.email);

    const lastMonthPeriod = getLastMonthPeriod();

    const currentMonthEmailStat =
      await this.statisticsService.getEmailsStatisticsForPeriod(
        workspace.email,
        lastMonthPeriod,
      );
    const totalEmailStat =
      await this.statisticsService.getEmailsStatisticsForPeriod(
        workspace.email,
      );

    return {
      invoices: {
        currentYearStatistics,
        currentMonthEmailStat,
        totalEmailStat,
      },
      workspaceMembers: workspace.members.length,
    };
  }
}
