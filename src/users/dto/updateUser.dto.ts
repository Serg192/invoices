import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { passwordRegex } from 'src/_config/regex';

const roles = ['user', 'admin'] as const;
export type BranchOperatorRole = (typeof roles)[number];

export class UpdateUserDto {
  @IsOptional()
  @IsNotEmpty()
  @MinLength(4)
  name: string;

  @IsOptional()
  @IsIn(roles)
  role: BranchOperatorRole;

  @IsOptional()
  @IsEmail()
  email: string;

  @IsOptional()
  @IsNotEmpty()
  @IsString()
  about: string;

  @IsOptional()
  @IsNotEmpty()
  @IsString()
  @MaxLength(512)
  @Matches(passwordRegex, {
    message: 'password too weak',
  })
  password: string;

  @IsOptional()
  lastSeen: Date;
}
