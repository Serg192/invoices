import { Module } from '@nestjs/common';
import { ReportService } from './report.service';
import {
  WorkspaceMember,
  WorkspaceMemberSchema,
} from 'src/workspaces/models/workspaceMember.model';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Workspace,
  WorkspaceSchema,
} from 'src/workspaces/models/workspace.model';
import {
  WorkspaceRole,
  WorkspaceRoleSchema,
} from 'src/workspaces/models/workspaceRole.model';
import { WorkspaceRolesService } from 'src/workspaces/workspaceRoles.service';
import { Email, EmailSchema } from 'src/emails/model/email.model';
import { StatisticsService } from './statistics.service';
import { EmailService } from 'src/emails/email.service';
import { S3Provider } from 'src/users/providers/s3.provider';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: WorkspaceMember.name, schema: WorkspaceMemberSchema },
      { name: Workspace.name, schema: WorkspaceSchema },
      { name: WorkspaceRole.name, schema: WorkspaceRoleSchema },
      { name: Email.name, schema: EmailSchema },
    ]),
  ],
  providers: [
    ReportService,
    StatisticsService,
    EmailService,
    WorkspaceRolesService,
    S3Provider,
    JwtService,
  ],
  exports: [ReportService, StatisticsService],
})
export class ReportModule {}
