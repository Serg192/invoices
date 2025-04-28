import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  Matches,
  MinLength,
} from 'class-validator';
import { ourDomainEmailRegex } from 'src/_config/regex';

export class UpdateWorkspaceDto {
  @IsOptional()
  @IsNotEmpty()
  @MinLength(4)
  name: string;

  @IsOptional()
  @IsNotEmpty()
  about: string;

  @IsOptional()
  @IsEmail()
  @IsEmail()
  @Matches(ourDomainEmailRegex, {
    message: 'Email is not valid',
  })
  email: string;
}
