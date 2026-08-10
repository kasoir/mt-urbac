import { IsArray, IsInt, IsNotEmpty, IsOptional } from 'class-validator';

export class AssignGroupsRolesDto {
  @IsInt()
  @IsOptional()
  groupId?: number;

  @IsArray()
  @IsInt({ each: true })
  roleUids: number[];
}

