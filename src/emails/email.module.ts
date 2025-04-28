import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Email, EmailSchema } from './model/email.model';
import {
  Workspace,
  WorkspaceSchema,
} from 'src/workspaces/models/workspace.model';
import { EmailController } from './email.controller';
import { EmailService } from './email.service';
import { S3Provider } from 'src/users/providers/s3.provider';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/user.service';
import { User, UserSchema } from 'src/users/models/user.model';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Email.name, schema: EmailSchema },
      { name: Workspace.name, schema: WorkspaceSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [EmailController],
  providers: [EmailService, S3Provider, JwtService, UsersService],
  exports: [EmailService],
})
export class EmailModule {}
