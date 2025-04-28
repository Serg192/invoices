import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  HttpException,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';

import {
  JwtAuthGuard,
  WorkspaceGuard,
  WorkspacePermissionsGuard,
  WorkspaceRolesGuard,
} from 'src/_guards';
import {
  AddEmployeeDto,
  AssignMemberRoleDto,
  UpdateWorkspaceDto,
  WorkspaceDto,
} from './dto';
import {
  ReqMember,
  ReqUser,
  ReqWorkspace,
  WPermissions,
  WRoles,
} from 'src/_decorators';
import {
  EmailSortOpt,
  PaginatedResponse,
  PaginationOptions,
  SortDirection,
} from 'src/_helpers/pagination.helper';
import { Workspace } from './models/workspace.model';
import { WorkspaceSerice } from './workspace.service';
import { VerifyWithJwtDto } from 'src/auth/dto/verifyWithJwt.dto';
import { WorkspaceMember } from './models/workspaceMember.model';
import { User } from 'src/users/models/user.model';
import { Email } from 'src/emails/model/email.model';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileSizeValidationPipe } from 'src/_pipes/file-validation.pipe';
import { ECustomError } from 'src/_exceptions/error-codes';
import { WorkspaceRolesService } from './workspaceRoles.service';
import { WorkspaceRole } from './models/workspaceRole.model';
import { CreateWorkspaceRoleDto } from './dto/workspaceRoles/createWorkspaceRole.dto';
import { UpdateWorkspaceRoleDto } from './dto/workspaceRoles/updateWorkspaceRole.dto';
import { DownloadInvoicesDto } from './dto/downloadInvoices.dto';
import { EmailService } from 'src/emails/email.service';
import { Response } from 'express';

@Controller({
  path: 'workspaces',
  version: '1',
})
export class WorkspaceController {
  constructor(
    private readonly workspaceService: WorkspaceSerice,
    private readonly workspaceRolesService: WorkspaceRolesService,
    private readonly emailService: EmailService,
  ) {}

  //Get all workspaces where the user is present
  @Get()
  @UseGuards(JwtAuthGuard)
  async getMyWorkspaces(@ReqUser('id') userId: string): Promise<Workspace[]> {
    return this.workspaceService.getMyWorkspaces(userId);
  }

  @Post(':id/initiate-inv-download')
  @UseGuards(JwtAuthGuard, WorkspaceGuard)
  downloadInvoices(
    @ReqWorkspace('name') workspaceName: string,
    @Body() downloadInvoices: DownloadInvoicesDto,
  ) {
    return this.emailService.initiateInvoiceDownloadFlow(
      workspaceName,
      downloadInvoices,
    );
  }

  @Get('assignable-permissions')
  @UseGuards(JwtAuthGuard)
  getAssignablePermissions() {
    console.log('Here');
    return this.workspaceRolesService.getAssignablePermissions();
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async createWorkspace(
    @ReqUser('id') creatorId: string,
    @Body() workspaceDto: WorkspaceDto,
  ): Promise<Workspace> {
    return this.workspaceService.createWorkspace(workspaceDto, creatorId);
  }

  @Patch(':id')
  @WPermissions('editWorkspace')
  @UseGuards(JwtAuthGuard, WorkspaceGuard, WorkspacePermissionsGuard)
  async editWorkspace(
    @ReqWorkspace() workspace: Workspace,
    @Body() updateWorkspace: UpdateWorkspaceDto,
  ): Promise<Workspace> {
    return this.workspaceService.updateWorkspace(workspace, updateWorkspace);
  }

  @Get(':id/invoices')
  @UseGuards(JwtAuthGuard, WorkspaceGuard)
  async getInvoices(
    @ReqWorkspace('email') workspaceEmail: string,
    @Query('page', new DefaultValuePipe(1)) page: number,
    @Query('pageSize', new DefaultValuePipe(10)) pageSize: number,
    @Query('sortBy') sortBy: EmailSortOpt,
    @Query('sortDirection') sortDir: SortDirection,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('pattern') pattern: string,
  ): Promise<PaginatedResponse<Email>> {
    if (!Object.values(EmailSortOpt).includes(sortBy)) {
      sortBy = EmailSortOpt.RECEIVED;
    }

    if (!Object.values(SortDirection).includes(sortDir)) {
      sortDir = SortDirection.ASC;
    }

    const paginationOptions: PaginationOptions = {
      page,
      pageSize,
      sort: {
        [sortBy]: sortDir,
      },
    };

    return this.workspaceService.getInvoices(
      workspaceEmail,
      paginationOptions,
      startDate,
      endDate,
      pattern,
    );
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, WorkspaceGuard)
  async getWorkspace(@Param('id') workspaceId): Promise<Workspace> {
    return this.workspaceService.findOne(workspaceId);
  }

  @Post(':id/add-employee')
  @WPermissions('addEmployee')
  @UseGuards(JwtAuthGuard, WorkspaceGuard, WorkspacePermissionsGuard)
  async addEmployee(
    @ReqUser() requestor: User,
    @ReqWorkspace() workspace: Workspace,
    @Body() addEmplDto: AddEmployeeDto,
  ): Promise<boolean> {
    return this.workspaceService.sendInvite(workspace, addEmplDto, requestor);
  }

  //we need id to check if person who makes request belongs to the workspace
  @Post(':id/assign-member-role')
  @WRoles('owner')
  @UseGuards(JwtAuthGuard, WorkspaceGuard, WorkspaceRolesGuard)
  async assignMemberRole(
    @Body() assignRoleDto: AssignMemberRoleDto,
  ): Promise<WorkspaceMember> {
    return this.workspaceService.assignRoleToMember(assignRoleDto);
  }

  @Post(':id/upload-wpp')
  @WPermissions('editWorkspace')
  @UseGuards(JwtAuthGuard, WorkspaceGuard, WorkspacePermissionsGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadPicture(
    @ReqWorkspace() workspace: Workspace,
    @UploadedFile(new FileSizeValidationPipe()) file,
  ): Promise<Workspace> {
    if (!file) {
      throw new HttpException('File is required', ECustomError.BAD_REQUEST);
    }

    return this.workspaceService.uploadPicture(workspace, file);
  }

  @Delete(':id/delete-employee/me')
  @UseGuards(JwtAuthGuard, WorkspaceGuard)
  async leaveWorkspace(
    @ReqMember() workspaceMember: WorkspaceMember,
    @Param('id') workspaceId,
  ): Promise<boolean> {
    await this.workspaceService.deleteEmployeeFromWorkspace(
      workspaceMember.role,
      workspaceMember._id,
      workspaceId,
    );
    return true;
  }

  @Delete(':id/delete-employee/:empId')
  @WPermissions('deleteEmployee')
  @UseGuards(JwtAuthGuard, WorkspaceGuard, WorkspacePermissionsGuard)
  async deleteWorkspaceMember(
    @ReqMember('role') requestorRole: WorkspaceRole,
    @Param('id') workspaceId,
    @Param('empId') removeEmplId,
  ): Promise<boolean> {
    await this.workspaceService.deleteEmployeeFromWorkspace(
      requestorRole,
      removeEmplId,
      workspaceId,
    );
    return true;
  }

  @Post('verify-add-employee')
  @UseGuards(JwtAuthGuard)
  async verifyAddEmpl(
    @ReqUser('email') requestorEmail: string,
    @Body() verifyWithJwt: VerifyWithJwtDto,
  ): Promise<boolean> {
    return this.workspaceService.handleAddEmployeeToWorkspace(
      requestorEmail,
      verifyWithJwt.token,
    );
  }

  @Delete(':id')
  @WPermissions('deleteWorkspace')
  @UseGuards(JwtAuthGuard, WorkspaceGuard, WorkspacePermissionsGuard)
  async deleteWorkspace(
    @ReqWorkspace() workspace: Workspace,
  ): Promise<boolean> {
    return this.workspaceService.deleteWorkspace(workspace);
  }

  @Get(':id/roles')
  @UseGuards(JwtAuthGuard, WorkspaceGuard)
  async getWorkspaceRoles(
    @ReqWorkspace() workspace: Workspace,
  ): Promise<WorkspaceRole[]> {
    return this.workspaceRolesService.getRolesForWorkspace(workspace);
  }

  @Get(':id/roles/me')
  @UseGuards(JwtAuthGuard, WorkspaceGuard)
  async getMyRoleInWorkspace(
    @ReqMember() workspaceMember: WorkspaceMember,
  ): Promise<WorkspaceRole> {
    return workspaceMember.role;
  }

  @Post(':id/roles')
  @WPermissions('editRole')
  @UseGuards(JwtAuthGuard, WorkspaceGuard, WorkspacePermissionsGuard)
  async createNewRole(
    @ReqWorkspace() workspace: Workspace,
    @Body() createRoleDto: CreateWorkspaceRoleDto,
  ): Promise<WorkspaceRole> {
    return await this.workspaceRolesService.createNewRole(
      workspace,
      createRoleDto,
    );
  }

  @Patch(':id/roles/:roleId')
  @WPermissions('editRole')
  @UseGuards(JwtAuthGuard, WorkspaceGuard, WorkspacePermissionsGuard)
  async updateWorkspaceRole(
    @Param('roleId') roleId: string,
    @ReqWorkspace() workspace: Workspace,
    @Body() updateWorkspaceRole: UpdateWorkspaceRoleDto,
  ): Promise<WorkspaceRole> {
    return await this.workspaceRolesService.updateRole(
      workspace,
      roleId,
      updateWorkspaceRole,
    );
  }

  @Delete(':id/roles/:roleId')
  @WPermissions('editRole')
  @UseGuards(JwtAuthGuard, WorkspaceGuard, WorkspacePermissionsGuard)
  async deleteRole(@Param('roleId') roleId: string): Promise<boolean> {
    return this.workspaceRolesService.deleteRole(roleId);
  }

  // No permissions for now
  @Get(':id/stat')
  @UseGuards(JwtAuthGuard, WorkspaceGuard)
  async getWorkspaceStat(@ReqWorkspace() workspace: Workspace): Promise<any> {
    return this.workspaceService.getStatistics(workspace);
  }
}
