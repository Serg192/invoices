import * as dotenv from 'dotenv';
dotenv.config();

import { ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import { swaggerConfig } from './_config';
import { AppModule } from './app.module';
import { BugsnagInterceptor } from './_interceptors/bugsnag.interceptor';
import * as cookieParser from 'cookie-parser';

import helmet from 'helmet';
import Bugsnag from '@bugsnag/js';
import BugsnagPluginExpress from '@bugsnag/plugin-express';
import { WorkspaceRolesService } from './workspaces/workspaceRoles.service';
import { ReportService } from './report/report.service';
//import * as sgGrid from '@sendgrid/mail';

async function bootstrap() {
  // Sendgrid
  //sgGrid.setApiKey(process.env.SENDGRID_KEY);

  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  //Init default workspace roles
  const rolesService = app.get(WorkspaceRolesService);
  await rolesService.initDefaultRoles();

  //Just for test
  //const reportService = app.get(ReportService);
  //await reportService.makeWeeklyReport();

  app.useGlobalPipes(new ValidationPipe());

  app.enableCors({
    credentials: true,
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  });

  app.use(helmet());

  // Bugsnag
  Bugsnag.start({
    apiKey: process.env.BUGSNAG_API_KEY,
    plugins: [BugsnagPluginExpress],
    enabledReleaseStages: ['production', 'staging'],
  });

  // Interceptors
  app.useGlobalInterceptors(new BugsnagInterceptor());

  // Versioning
  app.enableVersioning({
    type: VersioningType.URI,
  });

  // Swagger
  if (process.env.NODE_ENV === 'develop') {
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, document);
  }

  app.use(cookieParser());
  await app.listen(process.env.PORT || 5000);
}

bootstrap();
