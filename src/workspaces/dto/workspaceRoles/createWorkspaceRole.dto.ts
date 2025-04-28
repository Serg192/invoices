import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { assignablePermissions } from 'src/_config/workspace';

export class CreateWorkspaceRoleDto {
  @IsNotEmpty()
  @IsString()
  roleName: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  description: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  criticalRoleFeature: string;

  @IsOptional()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @IsIn(assignablePermissions, { each: true })
  permissions: string[];
}
