import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AssignGroupsDto } from './dto/assign-groups.dto';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { CurrentUser, UserPayload } from '../auth/decorators/current-user.decorator';

@Controller('users')
@UseGuards(PermissionsGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @RequirePermissions('user:read')
  findAll(@CurrentUser() currentUser: UserPayload) {
    return this.usersService.findAll(currentUser);
  }

  @Get(':uid')
  @RequirePermissions('user:read')
  findOne(@Param('uid') uid: string, @CurrentUser() currentUser: UserPayload) {
    return this.usersService.findOne(uid, currentUser);
  }

  @Post()
  @RequirePermissions('user:create')
  create(@Body() createUserDto: CreateUserDto, @CurrentUser() currentUser: UserPayload) {
    return this.usersService.create(createUserDto, currentUser);
  }

  @Patch(':uid')
  @RequirePermissions('user:update')
  update(
    @Param('uid') uid: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() currentUser: UserPayload,
  ) {
    return this.usersService.update(uid, updateUserDto, currentUser);
  }

  @Delete(':uid')
  @RequirePermissions('user:delete')
  remove(@Param('uid') uid: string, @CurrentUser() currentUser: UserPayload) {
    return this.usersService.remove(uid, currentUser);
  }

  @Post(':uid/groups')
  @RequirePermissions('user:update')
  assignGroups(
    @Param('uid') uid: string,
    @Body() dto: AssignGroupsDto,
    @CurrentUser() currentUser: UserPayload,
  ) {
    return this.usersService.assignGroups(uid, dto, currentUser);
  }
}

