import axios from 'axios';
import * as JSZip from 'jszip';
import { Resend } from 'resend';
import { InviteToWorkspaceTemplate } from 'src/templates/email/invite-to-workspaceTemplate';
import PasswordChanged from 'src/templates/email/password-changedTemplate';
import { ResetPasswordTemplate } from 'src/templates/email/reset-passwordTemplate';
import UserAddedToWorkspace from 'src/templates/email/user-added-to-workspaceTemplate';
import Email from 'src/templates/email/verify-emailTemplate';
import { WeeklyReportTemplate } from 'src/templates/email/weekly-reportTemplate';

export const enum EmailTemplate {
  VERIFY_EMAIL,
  RESET_PASSWORD,
  INVITE_TO_WORKSPACE,
  PASSWORD_CHANGED,
  USER_JOINED_NOTIFICATION,
  WEEKLY_REPORT,
}

export interface EmailDetails {
  to: string;
  subject: string;
}

const resend = new Resend(process.env.RESEND_KEY);

const templates = {
  [EmailTemplate.VERIFY_EMAIL]: (data) => {
    return Email(data);
  },
  [EmailTemplate.RESET_PASSWORD]: (data) => {
    return ResetPasswordTemplate(data);
  },
  [EmailTemplate.INVITE_TO_WORKSPACE]: (data) => {
    return InviteToWorkspaceTemplate(data);
  },
  [EmailTemplate.PASSWORD_CHANGED]: () => {
    return PasswordChanged();
  },
  [EmailTemplate.USER_JOINED_NOTIFICATION]: (data) => {
    return UserAddedToWorkspace(data);
  },
  [EmailTemplate.WEEKLY_REPORT]: (data) => {
    return WeeklyReportTemplate(data);
  },
};

export const sendEmail = async (
  template: EmailTemplate,
  details: EmailDetails,
  emailData?: any,
): Promise<{ data; error }> => {
  return await resend.emails.send({
    from: 'Invoice-app <verify-email@sda-click.space>',
    ...details,
    react: templates[template](emailData),
  });
};

export const createArchive = async (urls: string[]): Promise<Buffer> => {
  const zip = new JSZip();

  const downloadPromises = urls.map(async (url, index) => {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    const fileName = `${index}${url.split('/').pop()}`;
    zip.file(fileName, response.data);
  });

  await Promise.all(downloadPromises);
  return zip.generateAsync({ type: 'nodebuffer' });
};
