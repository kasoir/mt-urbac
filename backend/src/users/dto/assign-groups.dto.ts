import { IsArray, IsUUID } from 'class-validator';

export class AssignGroupsDto {
  @IsArray()
  @IsUUID('all', { each: true })
  groupUids: string[];
}

