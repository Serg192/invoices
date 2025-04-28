import { IsString, IsNotEmpty, MaxLength, Matches } from 'class-validator';
import { passwordRegex } from 'src/_config/regex';

/*
Note: Possibly we can also implement IsStrongPassword check
from class-validator. However, I'm not certainly sure
about the criteria that it's checking, so I didn't add it
yet. But it looks interesting
*/

export class VerifyResetPasswordDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(512)
  token: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(512)
  @Matches(passwordRegex, {
    message: 'password too weak',
  })
  newPassword: string;
}
