import { IsArray, IsUUID } from 'class-validator';

export class AssignGroupRoleDto {
  @IsArray()
  @IsUUID('all', { each: true })
  roleUids: string[];
}
