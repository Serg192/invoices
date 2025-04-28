import { IsNotEmpty, MinLength } from 'class-validator';

export class WorkspaceDto {
  @IsNotEmpty()
  @MinLength(4)
  name: string;

  // It is auto generated now
  // @IsEmail()
  // @Matches(ourDomainEmailRegex, {
  //   message: 'Email is not valid',
  // })
  // email: string;
}
