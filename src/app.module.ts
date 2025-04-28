import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/user.module';
import { AuthModule } from './auth/auth.module';
import { jwtConfig } from './_config';
import { WorkspaceModule } from './workspaces/workspace.module';
import { EmailModule } from './emails/email.module';
import { ReportModule } from './report/report.module';

@Module({
  imports: [
    LoggerModule.forRoot(),
    MongooseModule.forRoot(process.env.DB_URI),
    JwtModule.register(jwtConfig),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 seconds
        limit: 300, // 300 requests
      },
    ]),
    UsersModule,
    AuthModule,
    WorkspaceModule,
    EmailModule,
    ReportModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
