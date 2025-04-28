import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersController } from './user.controller';
import { UsersService } from './user.service';
import { User, UserSchema } from './models/user.model';
import { JwtService } from '@nestjs/jwt';
import { S3Provider } from './providers/s3.provider';
import { EmailService } from 'src/emails/email.service';
import {
  Workspace,
  WorkspaceSchema,
} from 'src/workspaces/models/workspace.model';
import { Email, EmailSchema } from 'src/emails/model/email.model';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Workspace.name, schema: WorkspaceSchema },
      { name: Email.name, schema: EmailSchema },
    ]),
  ],
  controllers: [UsersController],
  providers: [UsersService, JwtService, EmailService, S3Provider],
  exports: [UsersService],
})
export class UsersModule {}
