import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { AssignRolePrivilegeDto } from './dto/assign-role-privilege.dto';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { CurrentUser, UserPayload } from '../auth/decorators/current-user.decorator';

@Controller('roles')
@UseGuards(PermissionsGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @RequirePermissions('role:read')
  findAll(@CurrentUser() currentUser: UserPayload) {
    return this.rolesService.findAll(currentUser);
  }

  @Get(':uid')
  @RequirePermissions('role:read')
  findOne(@Param('uid', ParseUUIDPipe) uid: string, @CurrentUser() currentUser: UserPayload) {
    return this.rolesService.findOne(uid, currentUser);
  }

  @Post()
  @RequirePermissions('role:create')
  create(@Body() dto: CreateRoleDto, @CurrentUser() currentUser: UserPayload) {
    return this.rolesService.create(dto, currentUser);
  }

  @Patch(':uid')
  @RequirePermissions('role:update')
  update(
    @Param('uid', ParseUUIDPipe) uid: string,
    @Body() dto: UpdateRoleDto,
    @CurrentUser() currentUser: UserPayload,
  ) {
    return this.rolesService.update(uid, dto, currentUser);
  }

  @Delete(':uid')
  @RequirePermissions('role:delete')
  remove(@Param('uid', ParseUUIDPipe) uid: string, @CurrentUser() currentUser: UserPayload) {
    return this.rolesService.remove(uid, currentUser);
  }

  @Post(':uid/privileges')
  @RequirePermissions('role:update')
  assignPrivilege(
    @Param('uid', ParseUUIDPipe) uid: string,
    @Body() dto: AssignRolePrivilegeDto,
    @CurrentUser() currentUser: UserPayload,
  ) {
    return this.rolesService.assignPrivilege(uid, dto, currentUser);
  }

  @Delete(':uid/privileges/:privilegeUid')
  @RequirePermissions('role:update')
  removePrivilege(
    @Param('uid', ParseUUIDPipe) uid: string,
    @Param('privilegeUid', ParseUUIDPipe) privilegeUid: string,
    @CurrentUser() currentUser: UserPayload,
  ) {
    return this.rolesService.removePrivilege(uid, privilegeUid, currentUser);
  }
}

