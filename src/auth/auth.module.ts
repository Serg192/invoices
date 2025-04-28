import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { User, UserSchema } from '../users/models/user.model';
import { UsersService } from '../users/user.service';
import { jwtConfig } from 'src/_config';
import { S3Provider } from 'src/users/providers/s3.provider';
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
    JwtModule.register(jwtConfig),
  ],
  controllers: [AuthController],
  providers: [AuthService, UsersService, EmailService, S3Provider],
  exports: [AuthService],
})
export class AuthModule {}
