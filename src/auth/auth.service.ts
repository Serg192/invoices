import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { UsersService } from '../users/user.service';
import { UserDto } from '../users/dto/user.dto';
import { JwtService } from '@nestjs/jwt';
import {
  jwtEmailVerificationConfig,
  jwtRefreshConfig,
  jwtResetConfig,
} from '../_config';
import * as bcrypt from 'bcryptjs';
import { Response } from 'express';
import { EmailService } from 'src/emails/email.service';

@Injectable()
export class AuthService {
  /*
  TODO: Should be implemented using Redis. Due to time economy reasons,
  it works via JS Map at the moment. With this approach if server will be
  restarted - saved tokens will be lost, causing a security hole.
  */
  private expiredRefreshTokens: Map<string, boolean> = new Map();
  private expiredPasswordResetTokens: Map<string, boolean> = new Map();
  private expiredVerificationTokens: Map<string, boolean> = new Map();

  constructor(
    private readonly usersService: UsersService,
    private readonly emailService: EmailService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email, {});

    //should also check if email is verified, but frontend doesn't have this functionality yet
    //if(!user.emailVerified) throw new UnauthorizedException("Please verify you email");

    if (
      user &&
      !user.accountDeleted &&
      (await bcrypt.compare(password, user.password))
    ) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = user.toObject();
      return result;
    }

    throw new UnauthorizedException();
  }

  async signup(user: UserDto): Promise<any> {
    const existingUser = await this.usersService.findByEmail(user.email);
    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    const newUser = await this.usersService.create({
      ...user,
      role: 'user',
    });

    delete newUser.password;

    await this.emailService.sendEmailVerificationEmail(newUser.email);

    return newUser;
  }

  async login(
    user: UserDto,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = { id: user._id };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, jwtRefreshConfig);

    return {
      accessToken,
      refreshToken,
    };
  }

  async logout(res: Response): Promise<boolean> {
    const refreshToken = res.cookie['refreshToken'];
    res.clearCookie('refreshToken', { httpOnly: true });

    if (refreshToken) this.expiredRefreshTokens.set(refreshToken, true);

    return true;
  }

  async refreshToken(
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      if (this.expiredRefreshTokens.has(refreshToken)) {
        throw new UnauthorizedException('Expired refresh token');
      }

      const decoded = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_TOKEN_SECRET,
      });

      // Implement additional checks if needed, such as checking if the user still exists, etc.

      const payload = {
        id: decoded.id,
      };

      const newAccessToken = this.jwtService.sign(payload);
      const newRefreshToken = this.jwtService.sign(payload, jwtRefreshConfig);

      // Add the old refresh token to the expired list
      this.expiredRefreshTokens.set(refreshToken, true);

      return { accessToken: newAccessToken, refreshToken: newRefreshToken };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async sendResetPasswordEmail(email: string): Promise<boolean> {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new Error('User not found');

    await this.emailService.sendResetPasswordEmail(email, user._id);
    return true;
  }

  async validateResetPassword(
    token: string,
    newPassword: string,
  ): Promise<boolean> {
    try {
      if (this.expiredPasswordResetTokens.has(token)) {
        throw new UnauthorizedException('Expired password reset token');
      }

      const user = this.jwtService.verify(token, {
        secret: process.env.JWT_RESET_TOKEN_SECRET,
      });

      await this.usersService.resetPassword(user._id, newPassword);
      await this.emailService.sendPasswordChangedNotification(user.email);

      // Add the old password reset token to the expired list
      this.expiredPasswordResetTokens.set(token, true);

      return true;
    } catch (error) {
      const errorText = error.toString().split(': ')[1];

      throw new HttpException(
        errorText || 'Something went wrong. Double check the token',
        HttpStatus.FORBIDDEN,
      );
    }
  }

  async validateEmailVerification(token: string): Promise<boolean> {
    try {
      if (this.expiredVerificationTokens.has(token)) {
        throw new UnauthorizedException('ALREADY VERIFIED OR EXPIRED TOKEN');
      }

      const { email } = this.jwtService.verify(token, {
        secret: jwtEmailVerificationConfig.secret,
      });

      this.expiredVerificationTokens.set(token, true);

      const user = await this.usersService.findByEmail(email);
      if (!user) throw new Error('User not found');

      user.emailVerified = true;
      await user.save();

      return true;
    } catch (error) {
      const errorText = error.toString().split(': ')[1];

      throw new HttpException(
        errorText || 'Something went wrong. Double check the token',
        HttpStatus.FORBIDDEN,
      );
    }
  }
}
