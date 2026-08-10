import { IsInt, IsNotEmpty, IsOptional } from 'class-validator';

export class AssignUserRoleDto {
  @IsInt()
  @IsNotEmpty()
  roleUid: string;

  @IsInt()
  @IsOptional()
  groupId?: number;
}

