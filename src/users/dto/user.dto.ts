import { IsEmail, IsIn, IsOptional } from 'class-validator';

const roles = ['user', 'admin'] as const;
export type BranchOperatorRole = (typeof roles)[number];

export class UserDto {
  _id?: string;

  @IsOptional()
  name: string;

  @IsOptional()
  @IsEmail()
  email: string;

  @IsOptional()
  password: string;

  @IsOptional()
  @IsIn(roles)
  role: BranchOperatorRole;

  @IsOptional()
  lastSeen: Date;
}
