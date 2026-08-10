import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role, Privilege, RolePrivilege } from '../entities';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { AssignRolePrivilegeDto } from './dto/assign-role-privilege.dto';
import { UserPayload } from '../auth/decorators/current-user.decorator';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(Privilege)
    private privilegeRepository: Repository<Privilege>,
    @InjectRepository(RolePrivilege)
    private rolePrivilegeRepository: Repository<RolePrivilege>,
  ) {}

  async findAll(currentUser: UserPayload) {
    const whereClause = currentUser.isSuperAdmin ? {} : { tenantUid: currentUser.tenantUid || null };
    const roles = await this.roleRepository.find({ where: whereClause });
    return Promise.all(
      roles.map(async (r) => {
        const rps = await this.rolePrivilegeRepository.find({
          where: { roleUid: r.uid },
          relations: ['privilege'],
        });
        return {
          ...r,
          privileges: rps.map((rp) => rp.privilege),
        };
      }),
    );
  }

  async findOne(uid: string, currentUser: UserPayload) {
    const whereClause: any = { uid };
    if (!currentUser.isSuperAdmin) {
      whereClause.tenantUid = currentUser.tenantUid || null;
    }
    const role = await this.roleRepository.findOne({ where: whereClause });
    if (!role) {
      throw new NotFoundException(`Role with UID ${uid} not found`);
    }

    const rps = await this.rolePrivilegeRepository.find({
      where: { roleUid: uid },
      relations: ['privilege'],
    });

    return {
      ...role,
      privileges: rps.map((rp) => rp.privilege),
    };
  }

  async create(dto: CreateRoleDto, currentUser: UserPayload) {
    const level = dto.level ?? 10;

    if (currentUser.maxRoleLevel < 100 && level >= currentUser.maxRoleLevel) {
      throw new ForbiddenException(
        `Cannot create role with level (${level}) equal to or higher than your max level (${currentUser.maxRoleLevel})`,
      );
    }

    const existingWhere: any = { name: dto.name };
    if (!currentUser.isSuperAdmin) {
      existingWhere.tenantUid = currentUser.tenantUid || null;
    }
    const existing = await this.roleRepository.findOne({
      where: existingWhere,
    });
    if (existing) {
      throw new ConflictException('Role with this name already exists');
    }

    const targetTenantUid = currentUser.isSuperAdmin ? ((dto as any).tenantUid || null) : (currentUser.tenantUid || null);
    const role = this.roleRepository.create({
      name: dto.name,
      level,
      tenantUid: targetTenantUid,
    });
    return this.roleRepository.save(role);
  }

  async update(uid: string, dto: UpdateRoleDto, currentUser: UserPayload) {
    const whereClause: any = { uid };
    if (!currentUser.isSuperAdmin) {
      whereClause.tenantUid = currentUser.tenantUid || null;
    }
    const role = await this.roleRepository.findOne({ where: whereClause });
    if (!role) {
      throw new NotFoundException(`Role with UID ${uid} not found`);
    }

    if (currentUser.maxRoleLevel < 100) {
      if (role.level >= currentUser.maxRoleLevel) {
        throw new ForbiddenException(
          `Cannot edit role with level (${role.level}) equal to or higher than your max level (${currentUser.maxRoleLevel})`,
        );
      }
      if (dto.level !== undefined && dto.level >= currentUser.maxRoleLevel) {
        throw new ForbiddenException(
          `Cannot update role level to (${dto.level}) which is equal to or higher than your max level (${currentUser.maxRoleLevel})`,
        );
      }
    }

    if (dto.name) {
      const existingWhere: any = { name: dto.name };
      if (!currentUser.isSuperAdmin) {
        existingWhere.tenantUid = currentUser.tenantUid || null;
      }
      const existing = await this.roleRepository.findOne({
        where: existingWhere,
      });
      if (existing && existing.uid !== uid) {
        throw new ConflictException('Role with this name already exists');
      }
      role.name = dto.name;
    }

    if (dto.level !== undefined) {
      role.level = dto.level;
    }

    const targetTenantUid = currentUser.isSuperAdmin ? ((dto as any).tenantUid || null) : (currentUser.tenantUid || null);
    role.tenantUid = targetTenantUid;

    return this.roleRepository.save(role);
  }

  async remove(uid: string, currentUser: UserPayload) {
    const whereClause: any = { uid };
    if (!currentUser.isSuperAdmin) {
      whereClause.tenantUid = currentUser.tenantUid || null;
    }
    const role = await this.roleRepository.findOne({ where: whereClause });
    if (!role) {
      throw new NotFoundException(`Role with UID ${uid} not found`);
    }

    if (currentUser.maxRoleLevel < 100 && role.level >= currentUser.maxRoleLevel) {
      throw new ForbiddenException(
        `Cannot delete role with level (${role.level}) equal to or higher than your max level (${currentUser.maxRoleLevel})`,
      );
    }

    await this.roleRepository.remove(role);
    return { message: `Role with UID ${uid} deleted successfully` };
  }

  async assignPrivilege(roleUid: string, dto: AssignRolePrivilegeDto, currentUser: UserPayload) {
    const whereClause: any = { uid: roleUid };
    if (!currentUser.isSuperAdmin) {
      whereClause.tenantUid = currentUser.tenantUid || null;
    }
    const role = await this.roleRepository.findOne({ where: whereClause });
    if (!role) {
      throw new NotFoundException(`Role with UID ${roleUid} not found`);
    }

    if (currentUser.maxRoleLevel < 100 && role.level >= currentUser.maxRoleLevel) {
      throw new ForbiddenException(
        `Cannot modify privileges for role with level (${role.level}) equal to or higher than your max level (${currentUser.maxRoleLevel})`,
      );
    }

    await this.rolePrivilegeRepository.delete({ roleUid });

    if (dto.privilegeUids && dto.privilegeUids.length > 0) {
      const newAssignments = dto.privilegeUids.map(privilegeUid => 
        this.rolePrivilegeRepository.create({ roleUid, privilegeUid })
      );
      await this.rolePrivilegeRepository.save(newAssignments);
    }

    return this.findOne(roleUid, currentUser);
  }

  async removePrivilege(roleUid: string, privilegeUid: string, currentUser: UserPayload) {
    const whereClause: any = { uid: roleUid };
    if (!currentUser.isSuperAdmin) {
      whereClause.tenantUid = currentUser.tenantUid || null;
    }
    const role = await this.roleRepository.findOne({ where: whereClause });
    if (!role) {
      throw new NotFoundException(`Role with UID ${roleUid} not found`);
    }

    if (currentUser.maxRoleLevel < 100 && role.level >= currentUser.maxRoleLevel) {
      throw new ForbiddenException(
        `Cannot modify privileges for role with level (${role.level}) equal to or higher than your max level (${currentUser.maxRoleLevel})`,
      );
    }

    const rp = await this.rolePrivilegeRepository.findOne({
      where: { roleUid, privilegeUid },
    });

    if (!rp) {
      throw new NotFoundException('Role privilege assignment not found');
    }

    await this.rolePrivilegeRepository.remove(rp);
    return { message: 'Privilege removed from role successfully' };
  }
}

