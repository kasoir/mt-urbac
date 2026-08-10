import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Privilege } from '../entities';
import { CreatePrivilegeDto } from './dto/create-privilege.dto';
import { UpdatePrivilegeDto } from './dto/update-privilege.dto';
import { UserPayload } from '../auth/decorators/current-user.decorator';

@Injectable()
export class PrivilegesService {
  constructor(
    @InjectRepository(Privilege)
    private privilegeRepository: Repository<Privilege>,
  ) {}

  async findAll(currentUser: UserPayload) {
    const whereClause = currentUser.isSuperAdmin ? {} : { tenantUid: currentUser.tenantUid || null };
    return this.privilegeRepository.find({ where: whereClause });
  }

  async findOne(uid: string, currentUser: UserPayload) {
    const whereClause: any = { uid };
    if (!currentUser.isSuperAdmin) {
      whereClause.tenantUid = currentUser.tenantUid || null;
    }
    const privilege = await this.privilegeRepository.findOne({ where: whereClause });
    if (!privilege) {
      throw new NotFoundException(`Privilege with UID ${uid} not found`);
    }
    return privilege;
  }

  async create(dto: CreatePrivilegeDto, currentUser: UserPayload) {
    const existingWhere: any = { action: dto.action };
    if (!currentUser.isSuperAdmin) {
      existingWhere.tenantUid = currentUser.tenantUid || null;
    }
    const existing = await this.privilegeRepository.findOne({
      where: existingWhere,
    });
    if (existing) {
      throw new ConflictException('Privilege action already exists');
    }

    const targetTenantUid = currentUser.isSuperAdmin ? ((dto as any).tenantUid || null) : (currentUser.tenantUid || null);
    const privilege = this.privilegeRepository.create({
      ...dto,
      tenantUid: targetTenantUid,
    });
    return this.privilegeRepository.save(privilege);
  }

  async update(uid: string, dto: UpdatePrivilegeDto, currentUser: UserPayload) {
    const whereClause: any = { uid };
    if (!currentUser.isSuperAdmin) {
      whereClause.tenantUid = currentUser.tenantUid || null;
    }
    const privilege = await this.privilegeRepository.findOne({ where: whereClause });
    if (!privilege) {
      throw new NotFoundException(`Privilege with UID ${uid} not found`);
    }

    const existingWhere: any = { action: dto.action };
    if (!currentUser.isSuperAdmin) {
      existingWhere.tenantUid = currentUser.tenantUid || null;
    }
    const existing = await this.privilegeRepository.findOne({
      where: existingWhere,
    });
    if (existing && existing.uid !== uid) {
      throw new ConflictException('Privilege action already exists');
    }

    if (dto.action) {
      privilege.action = dto.action;
    }
    if (dto.name) {
      privilege.name = dto.name;
    }
    const targetTenantUid = currentUser.isSuperAdmin ? ((dto as any).tenantUid || null) : (currentUser.tenantUid || null);
    privilege.tenantUid = targetTenantUid;
    return this.privilegeRepository.save(privilege);
  }

  async remove(uid: string, currentUser: UserPayload) {
    const whereClause: any = { uid };
    if (!currentUser.isSuperAdmin) {
      whereClause.tenantUid = currentUser.tenantUid || null;
    }
    const privilege = await this.privilegeRepository.findOne({ where: whereClause });
    if (!privilege) {
      throw new NotFoundException(`Privilege with UID ${uid} not found`);
    }

    await this.privilegeRepository.remove(privilege);
    return { message: `Privilege with UID ${uid} deleted successfully` };
  }
}

