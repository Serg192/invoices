import { IsOptional } from 'class-validator';
import { CreateWorkspaceRoleDto } from './createWorkspaceRole.dto';

export class UpdateWorkspaceRoleDto extends CreateWorkspaceRoleDto {
  @IsOptional()
  roleName: string;
}
