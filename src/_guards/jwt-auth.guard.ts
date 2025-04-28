import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/user.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const request = context.switchToHttp().getRequest();
      const token = this.extractTokenFromRequest(request);

      if (!token) {
        return false;
      }

      const jwtData = this.jwtService.verify(token, {
        secret: process.env.JWT_ACCESS_TOKEN_SECRET,
      });

      const user = await this.usersService.findOne(jwtData.id);

      if (!user || user.accountDeleted) {
        return false;
      }

      request.user = user;
      return true;
    } catch (error) {
      console.log('auth error - ', error.message);
      throw new ForbiddenException(
        error.message || 'session expired! Please sign In',
      );
    }
  }

  private extractTokenFromRequest(request: any): string | null {
    // Extract the token from the request, you might need to adjust this based on your setup (e.g., from headers, cookies, etc.)
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    return authHeader.slice(7);
  }
}
