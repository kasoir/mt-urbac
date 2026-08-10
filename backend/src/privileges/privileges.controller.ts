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
import { PrivilegesService } from './privileges.service';
import { CreatePrivilegeDto } from './dto/create-privilege.dto';
import { UpdatePrivilegeDto } from './dto/update-privilege.dto';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { CurrentUser, UserPayload } from '../auth/decorators/current-user.decorator';

@Controller('privileges')
@UseGuards(PermissionsGuard)
export class PrivilegesController {
  constructor(private readonly privilegesService: PrivilegesService) {}

  @Get()
  @RequirePermissions('privilege:read')
  findAll(@CurrentUser() currentUser: UserPayload) {
    return this.privilegesService.findAll(currentUser);
  }

  @Get(':uid')
  @RequirePermissions('privilege:read')
  findOne(@Param('uid', ParseUUIDPipe) uid: string, @CurrentUser() currentUser: UserPayload) {
    return this.privilegesService.findOne(uid, currentUser);
  }

  @Post()
  @RequirePermissions('privilege:create')
  create(@Body() dto: CreatePrivilegeDto, @CurrentUser() currentUser: UserPayload) {
    return this.privilegesService.create(dto, currentUser);
  }

  @Patch(':uid')
  @RequirePermissions('privilege:update')
  update(
    @Param('uid', ParseUUIDPipe) uid: string,
    @Body() dto: UpdatePrivilegeDto,
    @CurrentUser() currentUser: UserPayload,
  ) {
    return this.privilegesService.update(uid, dto, currentUser);
  }

  @Delete(':uid')
  @RequirePermissions('privilege:delete')
  remove(@Param('uid', ParseUUIDPipe) uid: string, @CurrentUser() currentUser: UserPayload) {
    return this.privilegesService.remove(uid, currentUser);
  }
}
