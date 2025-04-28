import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { passwordRegex } from 'src/_config/regex';

export class UserSignUpDto {
  _id?: string;

  @IsNotEmpty()
  @MinLength(4)
  name: string;

  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(512)
  @Matches(passwordRegex, {
    message: 'password too weak',
  })
  password: string;
}
