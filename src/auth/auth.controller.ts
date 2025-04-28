import {
  Controller,
  Post,
  Body,
  Res,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserDto } from '../users/dto/user.dto';
import { ResetPasswordDto } from './dto/resetPassword.dto';
import { VerifyResetPasswordDto } from './dto/verifyResetPassword.dto';
import { UserSignUpDto } from 'src/users/dto/userSignUp.dto';
import { Request, Response } from 'express';
import { VerifyWithJwtDto } from './dto/verifyWithJwt.dto';
import { EmailService } from 'src/emails/email.service';

@Controller({
  path: 'auth',
  version: '1',
})
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly emailService: EmailService,
  ) {}

  @Post('login')
  async login(
    @Body('email') email: string,
    @Body('password') password: string,
    @Res() res,
  ): Promise<{ accessToken: string }> {
    const user = await this.authService.validateUser(email, password);
    const tokens = await this.authService.login(user);

    // Cookies do not work yet because of different domains

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
    });

    return res.status(201).json({ accessToken: tokens.accessToken });
  }

  @Post('signup')
  async signup(
    @Body('user') userSignUp: UserSignUpDto,
  ): Promise<{ accessToken: string }> {
    const newUser = await this.authService.signup({
      ...new UserDto(),
      ...userSignUp,
    });
    return newUser;
  }

  @Post('refresh-token')
  async refreshToken(@Req() req: Request, @Res() res: Response): Promise<any> {
    const refreshT = req.cookies['refreshToken'];
    if (!refreshT)
      throw new UnauthorizedException('Refresh token was not found');

    const tokens = await this.authService.refreshToken(refreshT);
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
    });

    return res.status(201).json({ accessToken: tokens.accessToken });
  }

  @Post('logout')
  async logout(@Res() res: Response): Promise<any> {
    this.authService.logout(res);
    return res.sendStatus(200);
  }

  @Post('reset')
  async resetPassword(
    @Body() resetPasswordBody: ResetPasswordDto,
  ): Promise<boolean> {
    const { email } = resetPasswordBody;
    return this.authService.sendResetPasswordEmail(email);
  }

  @Post('validate-reset')
  async validateResetPassword(
    @Body() verifyResetPassword: VerifyResetPasswordDto,
  ): Promise<boolean> {
    const { token, newPassword } = verifyResetPassword;
    console.log('in controller', { token, newPassword });
    return this.authService.validateResetPassword(token, newPassword);
  }

  @Post('verify-email')
  async verifyEmail(
    @Body() verifyWithToken: VerifyWithJwtDto,
  ): Promise<boolean> {
    return this.authService.validateEmailVerification(verifyWithToken.token);
  }

  @Post('send-email-verification')
  async sendEmailVerification(@Body('email') email: string): Promise<boolean> {
    //TODO: Secure this endpoint from spamming
    return await this.emailService.sendEmailVerificationEmail(email);
  }
}
