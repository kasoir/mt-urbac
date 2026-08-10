import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Group, Role, User } from '../entities';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { AssignGroupRoleDto } from './dto/assign-group-role.dto';
import { UserPayload } from '../auth/decorators/current-user.decorator';

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(Group)
    private groupRepository: Repository<Group>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findAll(currentUser: UserPayload) {
    const whereClause = currentUser.isSuperAdmin ? {} : { tenantUid: currentUser.tenantUid || null };
    const groups = await this.groupRepository.find({ where: whereClause, relations: ['roles', 'users'] });
    return groups.map((g) => ({
      ...g,
      members: g.users?.map((u) => ({
        userUid: u.uid,
        userEmail: u.email,
        userName: u.name,
      })) || [],
    }));
  }

  async findOne(uid: string, currentUser: UserPayload) {
    const whereClause: any = { uid };
    if (!currentUser.isSuperAdmin) {
      whereClause.tenantUid = currentUser.tenantUid || null;
    }
    const group = await this.groupRepository.findOne({ 
      where: whereClause,
      relations: ['roles', 'users']
    });
    
    if (!group) {
      throw new NotFoundException(`Group with UID ${uid} not found`);
    }

    return {
      ...group,
      members: group.users?.map((u) => ({
        userUid: u.uid,
        userEmail: u.email,
        userName: u.name,
      })) || [],
    };
  }

  async create(createGroupDto: CreateGroupDto, currentUser: UserPayload) {
    const existingWhere: any = { name: createGroupDto.name };
    if (!currentUser.isSuperAdmin) {
      existingWhere.tenantUid = currentUser.tenantUid || null;
    }
    const existing = await this.groupRepository.findOne({
      where: existingWhere,
    });
    if (existing) {
      throw new ConflictException('Group with this name already exists');
    }

    const targetTenantUid = currentUser.isSuperAdmin ? ((createGroupDto as any).tenantUid || null) : (currentUser.tenantUid || null);
    const group = this.groupRepository.create({
      ...createGroupDto,
      tenantUid: targetTenantUid,
    });
    return this.groupRepository.save(group);
  }

  async update(uid: string, updateGroupDto: UpdateGroupDto, currentUser: UserPayload) {
    const whereClause: any = { uid };
    if (!currentUser.isSuperAdmin) {
      whereClause.tenantUid = currentUser.tenantUid || null;
    }
    const group = await this.groupRepository.findOne({ where: whereClause });
    if (!group) {
      throw new NotFoundException(`Group with UID ${uid} not found`);
    }

    if (updateGroupDto.name) {
      const existingWhere: any = { name: updateGroupDto.name };
      if (!currentUser.isSuperAdmin) {
        existingWhere.tenantUid = currentUser.tenantUid || null;
      }
      const existing = await this.groupRepository.findOne({
        where: existingWhere,
      });
      if (existing && existing.uid !== uid) {
        throw new ConflictException('Group with this name already exists');
      }
      group.name = updateGroupDto.name;
    }

    if (updateGroupDto.description !== undefined) {
      group.description = updateGroupDto.description;
    }

    const targetTenantUid = currentUser.isSuperAdmin ? ((updateGroupDto as any).tenantUid || null) : (currentUser.tenantUid || null);
    group.tenantUid = targetTenantUid;

    return this.groupRepository.save(group);
  }

  async remove(uid: string, currentUser: UserPayload) {
    const whereClause: any = { uid };
    if (!currentUser.isSuperAdmin) {
      whereClause.tenantUid = currentUser.tenantUid || null;
    }
    const group = await this.groupRepository.findOne({ where: whereClause });
    if (!group) {
      throw new NotFoundException(`Group with UID ${uid} not found`);
    }

    await this.groupRepository.remove(group);
    return { message: `Group with UID ${uid} deleted successfully` };
  }

  async assignRole(groupUid: string, dto: AssignGroupRoleDto, currentUser: UserPayload) {
    const whereClause: any = { uid: groupUid };
    if (!currentUser.isSuperAdmin) {
      whereClause.tenantUid = currentUser.tenantUid || null;
    }
    const group = await this.groupRepository.findOne({ 
      where: whereClause,
      relations: ['roles']
    });
    
    if (!group) {
      throw new NotFoundException(`Group with UID ${groupUid} not found`);
    }

    let targetRoles: Role[] = [];
    if (dto.roleUids && dto.roleUids.length > 0) {
      const rolesWhere = dto.roleUids.map(uid => {
        const cond: any = { uid };
        if (!currentUser.isSuperAdmin) cond.tenantUid = currentUser.tenantUid || null;
        return cond;
      });
      targetRoles = await this.roleRepository.find({
        where: rolesWhere
      });
      
      for (const role of targetRoles) {
        if (currentUser.maxRoleLevel < 100 && role.level >= currentUser.maxRoleLevel) {
          throw new ForbiddenException(
            `Cannot assign role with level (${role.level}) equal to or higher than your max role level (${currentUser.maxRoleLevel})`,
          );
        }
      }
    }

    group.roles = targetRoles;
    return this.groupRepository.save(group);
  }

  async removeRole(groupUid: string, roleUid: string, userUid: string, currentUser: UserPayload) {
    throw new ConflictException('Group role assignments to specific users are no longer supported. Roles are assigned to groups, and users inherit them from groups.');
  }
}

