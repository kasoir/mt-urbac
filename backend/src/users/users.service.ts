import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, Role, Group } from '../entities';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AssignGroupsDto } from './dto/assign-groups.dto';
import { UserPayload } from '../auth/decorators/current-user.decorator';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(Group)
    private groupRepository: Repository<Group>,
  ) {}

  async getUserMaxRoleLevel(userUid: string): Promise<number> {
    const user = await this.userRepository.findOne({
      where: { uid: userUid },
      relations: ['groups', 'groups.roles'],
    });
    if (!user || !user.groups) return 0;
    
    let maxLevel = 0;
    for (const group of user.groups) {
      if (group.roles) {
        for (const role of group.roles) {
          if (role.level > maxLevel) maxLevel = role.level;
        }
      }
    }
    return maxLevel;
  }

  async findAll(currentUser: UserPayload) {
    const whereClause = currentUser.isSuperAdmin ? {} : { tenantUid: currentUser.tenantUid || null };
    const users = await this.userRepository.find({
      where: whereClause,
      select: ['uid', 'name', 'email', 'createdAt', 'updatedAt', 'tenantUid'],
      relations: ['groups', 'groups.roles'],
    });

    return users.map(user => {
      const rolesMap = new Map();
      if (user.groups) {
        for (const group of user.groups) {
          if (group.roles) {
            for (const role of group.roles) {
              if (!rolesMap.has(role.uid)) {
                rolesMap.set(role.uid, role);
              }
            }
          }
        }
      }
      return {
        ...user,
        roles: Array.from(rolesMap.values()),
      };
    });
  }

  async findOne(uid: string, currentUser: UserPayload) {
    const whereClause: any = { uid: uid };
    if (!currentUser.isSuperAdmin) {
      whereClause.tenantUid = currentUser.tenantUid || null;
    }
    const user = await this.userRepository.findOne({
      where: whereClause,
      select: ['uid', 'name', 'email', 'createdAt', 'updatedAt', 'tenantUid'],
      relations: ['groups', 'groups.roles'],
    });
    
    if (!user) {
      throw new NotFoundException(`User with UID ${uid} not found`);
    }

    const rolesMap = new Map();
    if (user.groups) {
      for (const group of user.groups) {
        if (group.roles) {
          for (const role of group.roles) {
            if (!rolesMap.has(role.uid)) {
              rolesMap.set(role.uid, role);
            }
          }
        }
      }
    }

    return {
      ...user,
      roles: Array.from(rolesMap.values()),
    };
  }

  async create(createUserDto: CreateUserDto, currentUser: UserPayload) {
    const whereClause: any = { email: createUserDto.email.toLowerCase() };
    if (!currentUser.isSuperAdmin) {
      whereClause.tenantUid = currentUser.tenantUid || null;
    }
    const existing = await this.userRepository.findOne({
      where: whereClause,
    });
    if (existing) {
      throw new ConflictException('User with this email already exists');
    }

    const passwordHash = await bcrypt.hash(createUserDto.password, 10);
    const targetTenantUid = currentUser.isSuperAdmin ? ((createUserDto as any).tenantUid || null) : (currentUser.tenantUid || null);
    const newUser = this.userRepository.create({
      email: createUserDto.email.toLowerCase(),
      name: createUserDto.name || null,
      passwordHash,
      tenantUid: targetTenantUid,
    });

    const saved = await this.userRepository.save(newUser);
    const { passwordHash: _, ...result } = saved;
    return result;
  }

  async update(uid: string, updateUserDto: UpdateUserDto, currentUser: UserPayload) {
    const whereClause: any = { uid: uid };
    if (!currentUser.isSuperAdmin) {
      whereClause.tenantUid = currentUser.tenantUid || null;
    }
    const user = await this.userRepository.findOne({ where: whereClause });
    if (!user) {
      throw new NotFoundException(`User with UID ${uid} not found`);
    }

    // Level check
    if (currentUser.maxRoleLevel < 100) {
      const targetMaxLevel = await this.getUserMaxRoleLevel(uid);
      if (targetMaxLevel >= currentUser.maxRoleLevel) {
        throw new ForbiddenException(
          'Cannot edit user with role level equal to or higher than your own max role level',
        );
      }
    }

    if (updateUserDto.email) {
      const existingWhere: any = { email: updateUserDto.email.toLowerCase() };
      if (!currentUser.isSuperAdmin) {
        existingWhere.tenantUid = currentUser.tenantUid || null;
      }
      const existing = await this.userRepository.findOne({
        where: existingWhere,
      });
      if (existing && existing.uid !== uid) {
        throw new ConflictException('Email already in use');
      }
      user.email = updateUserDto.email.toLowerCase();
    }

    if (updateUserDto.name !== undefined) {
      user.name = updateUserDto.name;
    }

    if (updateUserDto.password) {
      user.passwordHash = await bcrypt.hash(updateUserDto.password, 10);
    }

    const targetTenantUid = currentUser.isSuperAdmin ? ((updateUserDto as any).tenantUid || null) : (currentUser.tenantUid || null);
    user.tenantUid = targetTenantUid;

    const updated = await this.userRepository.save(user);
    const { passwordHash: _, ...result } = updated;
    return result;
  }

  async remove(uid: string, currentUser: UserPayload) {
    if (uid === currentUser.userUid) {
      throw new BadRequestException('You cannot delete your own account');
    }

    const whereClause: any = { uid: uid };
    if (!currentUser.isSuperAdmin) {
      whereClause.tenantUid = currentUser.tenantUid || null;
    }
    const user = await this.userRepository.findOne({ where: whereClause });
    if (!user) {
      throw new NotFoundException(`User with UID ${uid} not found`);
    }

    // Level check
    if (currentUser.maxRoleLevel < 100) {
      const targetMaxLevel = await this.getUserMaxRoleLevel(uid);
      if (targetMaxLevel >= currentUser.maxRoleLevel) {
        throw new ForbiddenException(
          'Cannot delete user with role level equal to or higher than your own max role level',
        );
      }
    }

    await this.userRepository.remove(user);
    return { message: `User with UID ${uid} deleted successfully` };
  }

  async assignGroups(userUid: string, dto: AssignGroupsDto, currentUser: UserPayload) {
    const whereClause: any = { uid: userUid };
    if (!currentUser.isSuperAdmin) {
      whereClause.tenantUid = currentUser.tenantUid || null;
    }
    const user = await this.userRepository.findOne({ where: whereClause, relations: ['groups'] });
    if (!user) {
      throw new NotFoundException(`User with UID ${userUid} not found`);
    }

    if (currentUser.maxRoleLevel < 100) {
      const targetMaxLevel = await this.getUserMaxRoleLevel(userUid);
      if (targetMaxLevel >= currentUser.maxRoleLevel) {
        throw new ForbiddenException('Cannot modify groups for user with role level equal to or higher than your own max role level');
      }
    }

    if (dto.groupUids && dto.groupUids.length > 0) {
      const groupWhere: any = { uid: In(dto.groupUids) };
      if (!currentUser.isSuperAdmin) {
        groupWhere.tenantUid = currentUser.tenantUid || null;
      }
      const groups = await this.groupRepository.find({ where: groupWhere });
      user.groups = groups;
    } else {
      user.groups = [];
    }

    await this.userRepository.save(user);
    
    return { success: true };
  }
}

