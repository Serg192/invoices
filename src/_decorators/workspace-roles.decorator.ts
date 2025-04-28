import { SetMetadata } from '@nestjs/common';

export const WRoles = (...roles: string[]) => SetMetadata('wRoles', roles);
