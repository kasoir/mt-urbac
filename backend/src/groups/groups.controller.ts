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
} from '@nestjs/common';
import { GroupsService } from './groups.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { AssignGroupRoleDto } from './dto/assign-group-role.dto';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { CurrentUser, UserPayload } from '../auth/decorators/current-user.decorator';

@Controller('groups')
@UseGuards(PermissionsGuard)
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Get()
  @RequirePermissions('group:read')
  findAll(@CurrentUser() currentUser: UserPayload) {
    return this.groupsService.findAll(currentUser);
  }

  @Get(':uid')
  @RequirePermissions('group:read')
  findOne(@Param('uid') uid: string, @CurrentUser() currentUser: UserPayload) {
    return this.groupsService.findOne(uid, currentUser);
  }

  @Post()
  @RequirePermissions('group:create')
  create(@Body() createGroupDto: CreateGroupDto, @CurrentUser() currentUser: UserPayload) {
    return this.groupsService.create(createGroupDto, currentUser);
  }

  @Patch(':uid')
  @RequirePermissions('group:update')
  update(
    @Param('uid') uid: string,
    @Body() updateGroupDto: UpdateGroupDto,
    @CurrentUser() currentUser: UserPayload,
  ) {
    return this.groupsService.update(uid, updateGroupDto, currentUser);
  }

  @Delete(':uid')
  @RequirePermissions('group:delete')
  remove(@Param('uid') uid: string, @CurrentUser() currentUser: UserPayload) {
    return this.groupsService.remove(uid, currentUser);
  }

  @Post(':uid/roles')
  @RequirePermissions('group:update')
  assignRole(
    @Param('uid') uid: string,
    @Body() dto: AssignGroupRoleDto,
    @CurrentUser() currentUser: UserPayload,
  ) {
    return this.groupsService.assignRole(uid, dto, currentUser);
  }

  @Delete(':uid/roles/:roleUid/users/:userUid')
  @RequirePermissions('group:update')
  removeRole(
    @Param('uid') uid: string,
    @Param('roleUid') roleUid: string,
    @Param('userUid') userUid: string,
    @CurrentUser() currentUser: UserPayload,
  ) {
    return this.groupsService.removeRole(uid, roleUid, userUid, currentUser);
  }
}

