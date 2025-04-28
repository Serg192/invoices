//import * as oauthClientCredentials from './json/credentials.json';
import { google } from 'googleapis';

export const jwtConfig = {
  secret: process.env.JWT_ACCESS_TOKEN_SECRET,
  signOptions: { expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRATION_TIME },
};

export const jwtRefreshConfig = {
  secret: process.env.JWT_REFRESH_TOKEN_SECRET,
  expiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRATION_TIME,
};

export const jwtEmailVerificationConfig = {
  secret: process.env.JWT_EMAIL_VERIFICATION_TOKEN_SECRET,
  expiresIn: process.env.JWT_EMAIL_VERIFICATION_EXPIRATION_TIME,
};

export const jwtResetConfig = {
  secret: process.env.JWT_RESET_TOKEN_SECRET,
  expiresIn: process.env.JWT_RESET_TOKEN_EXPIRATION_TIME,
};

// OAuth2
const clientId = process.env.OAUTH_CLIENT_ID;
const clientSecret = process.env.OAUTH_CLIENT_SECRET;
const redirectUris = [
  'https://invoice-bk.onrender.com/v1/emails/confirm-download-inv',
];

export const OAUTH_SCOPE = [
  'https://www.googleapis.com/auth/drive.metadata.readonly https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/drive.file',
];
export const oAuth2Client = new google.auth.OAuth2(
  clientId,
  clientSecret,
  redirectUris[0],
);
