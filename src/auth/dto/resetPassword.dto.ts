import { IsEmail, IsNotEmpty, MaxLength } from 'class-validator';

export class ResetPasswordDto {
  @IsNotEmpty()
  @IsEmail()
  @MaxLength(512)
  email: string;
}
