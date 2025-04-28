import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Workspace } from 'src/workspaces/models/workspace.model';
import { Email } from './model/email.model';
import { S3Provider } from 'src/users/providers/s3.provider';
import { simpleParser } from 'mailparser';
import { JwtService } from '@nestjs/jwt';
import {
  OAUTH_SCOPE,
  jwtEmailVerificationConfig,
  jwtResetConfig,
  oAuth2Client,
} from 'src/_config/auth';
import {
  PaginatedResponse,
  PaginationOptions,
  paginate,
} from 'src/_helpers/pagination.helper';
import { FilterQuery } from 'mongoose';
import {
  EmailTemplate,
  createArchive,
  sendEmail,
} from 'src/_helpers/email.helper';
import { User } from 'src/users/models/user.model';
import { WeeklyStatictics } from 'src/report/statistics.service';
import { DownloadInvoicesDto } from 'src/workspaces/dto/downloadInvoices.dto';
import { google } from 'googleapis';

import * as stream from 'stream';
import * as querystring from 'querystring';

@Injectable()
export class EmailService {
  constructor(
    @InjectModel(Workspace.name) private workspaceModel,
    @InjectModel(Email.name) private emailModel,
    private readonly s3Provider: S3Provider,
    private readonly jwtService: JwtService,
  ) {}

  initiateInvoiceDownloadFlow(
    workspaceName: string,
    downloadInvoices: DownloadInvoicesDto,
  ): string {
    const jsonString = JSON.stringify({
      workspaceName,
      links: downloadInvoices.invoicesUrls,
    });
    const encodedParam = encodeURIComponent(jsonString);

    return (
      oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: OAUTH_SCOPE,
      }) + `&state=${encodedParam}`
    );
  }

  async downloadInvoicesToGoogleDrive(
    oauth2Code: string,
    state: string,
  ): Promise<[boolean, string]> {
    const tokens = await this.validateDownload(oauth2Code);

    if (!tokens) {
      return [false, 'Code is not valid'];
    }

    const { workspaceName, links } = JSON.parse(decodeURIComponent(state));

    if (!workspaceName || !links || links.length == 0) {
      return [false, 'Bad rerquest'];
    }

    const buffer = await createArchive(links);

    oAuth2Client.setCredentials(tokens);
    const drive = google.drive({ version: 'v3', auth: oAuth2Client });

    const fileMetadata = {
      name: `invoices-${workspaceName.replace(/\s/g, '')}.zip`,
      mimeType: 'application/zip',
    };

    const media = {
      mimeType: 'application/zip',
      body: new stream.PassThrough().end(buffer),
    };

    try {
      await drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: 'id',
      });
    } catch (error) {
      console.log('Save to google drive error: ', error);
      return [false, 'Cannot save to google drive'];
    }
    return [true, ''];
  }

  private async validateDownload(code: string) {
    try {
      const { tokens } = await oAuth2Client.getToken(code);
      return tokens;
    } catch (err) {
      const errTxt = 'Error retrieving access token';
      console.log(`${errTxt}: `, err);
      return null;
    }
  }

  async handleNewEmailReceived(token: string): Promise<boolean> {
    try {
      const { me, objectKey } = this.jwtService.verify(token, {
        secret: jwtResetConfig.secret,
      });

      if (me !== 'lambda' || !objectKey) throw new Error('Has no permission');

      const rawEmail = await this.s3Provider.getObject(objectKey);
      await this.s3Provider.deleteObject(objectKey);

      const parsedEmail = await simpleParser(rawEmail.Body);

      const workspace = await this.workspaceModel.findOne({
        email: parsedEmail.to.text,
      });

      if (!workspace) {
        //No need to store attachments since there is no workspace associated with this email
        return true;
      }

      const from = parsedEmail.from.text;
      const subject = parsedEmail.subject || '';
      const text = parsedEmail.text || '';
      const date = parsedEmail.date;
      const to = parsedEmail.to.text.split('@')[0];
      const attachmentUrls = [];

      if (parsedEmail.attachments.length > 0) {
        await Promise.all(
          parsedEmail.attachments.map(async (attachment) => {
            const attachmentUrl = await this.s3Provider.putObject(
              `emails/${to}/${objectKey.split('/').pop() + Date.now()}${
                '/' + attachment.filename
              }`,
              attachment.content,
              attachment.contentType,
            );

            attachmentUrls.push(attachmentUrl);
          }),
        );
      }

      const createdEmail = new this.emailModel({
        to: parsedEmail.to.text,
        from,
        subject,
        text,
        date: new Date(date),
        attachmentKeys: attachmentUrls,
        isActive: true,
      });
      await createdEmail.save();
    } catch (error) {
      console.log('email handling error: ', error);
      throw new HttpException(error.text, HttpStatus.FORBIDDEN);
    }
    return true;
  }

  async getEmailsForWorkspace(
    workspaceEmail: string,
    paginationOptions: PaginationOptions,
    startDate?: Date,
    endDate?: Date,
    searchPattern?: string,
  ): Promise<PaginatedResponse<Email>> {
    const filter: FilterQuery<Email> = { to: workspaceEmail, isActive: true };

    if (startDate || endDate) {
      filter.date = {
        ...(startDate && { $gte: startDate }),
        ...(endDate && { $lte: new Date(endDate.setHours(23, 59, 59, 999)) }),
      };
    }

    const searchOpt = { $regex: searchPattern, $options: 'i' };

    return (await paginate(
      this.emailModel,
      {
        ...filter,
        ...(searchPattern && {
          $or: [{ from: searchOpt }, { subject: searchOpt }],
        }),
      },
      paginationOptions,
    )) as unknown as Promise<PaginatedResponse<Email>>;
  }

  async flagEmailsAsInactive(workspaceEmail: string): Promise<void> {
    await this.emailModel
      .updateMany({ to: workspaceEmail }, { isActive: false })
      .exec();
  }

  async migrateEmails(oldEmail: string, newEmail: string): Promise<void> {
    await this.emailModel
      .updateMany({ to: oldEmail, isActive: true }, { to: newEmail })
      .exec();
  }

  async count(filter): Promise<number> {
    return await this.emailModel.countDocuments(filter).exec();
  }

  async sendEmailVerificationEmail(email: string): Promise<boolean> {
    const jwtToken = this.jwtService.sign(
      { email },
      jwtEmailVerificationConfig,
    );

    const { error } = await sendEmail(
      EmailTemplate.VERIFY_EMAIL,
      {
        to: email,
        subject: 'Email verification',
      },
      {
        link:
          process.env.NEXT_PUBLIC_CLIENT_URL + `/signup-successful/${jwtToken}`,
      },
    );
    if (error) console.log(error);
    return true;
  }

  async sendResetPasswordEmail(
    email: string,
    userId: string,
  ): Promise<boolean> {
    const jwtToken = this.jwtService.sign(
      {
        _id: userId,
      },
      jwtResetConfig,
    );

    const { error } = await sendEmail(
      EmailTemplate.RESET_PASSWORD,
      {
        to: email,
        subject: 'Reset password',
      },
      {
        link:
          process.env.NEXT_PUBLIC_CLIENT_URL + `/set-new-password/${jwtToken}`,
      },
    );

    if (error) console.log(error);

    /*
       We're returning always true because of privacy reasons. If we would
       return some specific error reason like "User not found", then everyone
       would be able to check by email whether user signed up or not
     */

    return true;
  }

  private isUser(employee: User | string): employee is User {
    return (employee as User).email !== undefined;
  }

  async sendInvite(
    workspace: Workspace,
    employee: User | string,
    requestor: User,
  ): Promise<boolean> {
    let emplEmail = '';
    let emplName = null;
    let emplPicture = null;

    if (this.isUser(employee)) {
      emplEmail = employee.email;
      emplName = employee.name;
      emplPicture = employee.profilePicture;
    } else {
      emplEmail = employee;
    }

    const jwtToken = this.jwtService.sign(
      { email: emplEmail, workspaceId: workspace._id },
      {
        secret: process.env.JWT_INVITE_TOKEN_SECRET,
        expiresIn: process.env.JWT_INVITE_TOKEN_EXPIRATION_TIME,
      },
    );

    const { error } = await sendEmail(
      EmailTemplate.INVITE_TO_WORKSPACE,
      {
        to: emplEmail + '',
        subject: `Invite to join ${workspace.name} workspace`,
      },
      {
        link: process.env.NEXT_PUBLIC_CLIENT_URL + `/workspace/${jwtToken}`,
        username: emplName,
        workspaceName: workspace.name,
        userPfp: emplPicture,
        workspacePfp: workspace.picture,
        inviterUsername: requestor.name,
        inviterEmail: requestor.email,
      },
    );
    if (error) console.log(error);
    return true;
  }

  async sendPasswordChangedNotification(email: string): Promise<boolean> {
    const { error } = await sendEmail(EmailTemplate.PASSWORD_CHANGED, {
      to: email,
      subject: 'Your password has been successfully changed',
    });
    if (error) console.log(error);
    return true;
  }

  async sendUserJoinedNotification(
    email: string,
    user: User,
    workspace: Workspace,
  ): Promise<boolean> {
    const { error } = await sendEmail(
      EmailTemplate.USER_JOINED_NOTIFICATION,
      {
        to: email,
        subject: 'New member',
      },
      {
        username: user.name,
        userEmail: user.email,
        workspaceName: workspace.name,
      },
    );
    if (error) console.log(error);
    return true;
  }

  async sendWeeklyReport(
    email: string,
    data: WeeklyStatictics,
  ): Promise<boolean> {
    const { error } = await sendEmail(
      EmailTemplate.WEEKLY_REPORT,
      {
        to: email,
        subject: 'Weekly workspace report',
      },
      data,
    );
    if (error) console.log(error);
    return true;
  }
}
