import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class AssignMemberRoleDto {
  @IsString()
  @IsNotEmpty()
  memberId: string;

  @IsString()
  @IsNotEmpty()
  roleId: string;
}
