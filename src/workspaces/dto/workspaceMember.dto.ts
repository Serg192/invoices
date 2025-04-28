import { IsIn, IsNotEmpty, IsString } from 'class-validator';
import {
  BranchOperatorWMemberRole,
  workspaceRoles,
} from 'src/_config/workspace';

export class WorkspaceMemberDto {
  _id?: string;

  @IsString()
  @IsNotEmpty()
  user: string;

  @IsIn(workspaceRoles)
  memberRole: BranchOperatorWMemberRole;
}
