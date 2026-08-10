import { IsArray, IsUUID } from 'class-validator';

export class AssignRolePrivilegeDto {
  @IsArray()
  @IsUUID('all', { each: true })
  privilegeUids: string[];
}

