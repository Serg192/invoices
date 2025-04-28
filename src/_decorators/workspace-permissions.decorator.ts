import { SetMetadata } from '@nestjs/common';

export const WPermissions = (...roles: string[]) =>
  SetMetadata('wPermissions', roles);
