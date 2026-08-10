import { IsNotEmpty, IsString } from 'class-validator';

export class UpdatePrivilegeDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  action: string;
}
