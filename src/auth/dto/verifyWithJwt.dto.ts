import { IsString, IsNotEmpty, MaxLength, Matches } from 'class-validator';

export class VerifyWithJwtDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(512)
  token: string;
}
