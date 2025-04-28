import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getWelcomeMessage(): string {
    return 'SDA Backend v1. Docs are under GET /docs endpoint.';
  }
}
