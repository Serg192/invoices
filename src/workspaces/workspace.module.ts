import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  WorkspaceMember,
  WorkspaceMemberSchema,
} from './models/workspaceMember.model';
import { User, UserSchema } from 'src/users/models/user.model';
import { WorkspaceSerice } from './workspace.service';
import { WorkspaceController } from './workspace.controller';
import { Workspace, WorkspaceSchema } from './models/workspace.model';
import { UsersService } from 'src/users/user.service';
import { S3Provider } from 'src/users/providers/s3.provider';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from 'src/emails/email.service';
import Email from 'src/templates/email/verify-emailTemplate';
import { EmailSchema } from 'src/emails/model/email.model';
import {
  WorkspaceRole,
  WorkspaceRoleSchema,
} from './models/workspaceRole.model';
import { WorkspaceRolesService } from './workspaceRoles.service';
import { StatisticsService } from 'src/report/statistics.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: WorkspaceMember.name, schema: WorkspaceMemberSchema },
      { name: User.name, schema: UserSchema },
      { name: Workspace.name, schema: WorkspaceSchema },
      { name: Email.name, schema: EmailSchema },
      { name: WorkspaceRole.name, schema: WorkspaceRoleSchema },
    ]),
  ],
  controllers: [WorkspaceController],
  providers: [
    WorkspaceSerice,
    WorkspaceRolesService,
    UsersService,
    StatisticsService,
    EmailService,
    S3Provider,
    JwtService,
  ],
  exports: [WorkspaceSerice, WorkspaceRolesService],
})
export class WorkspaceModule {}
