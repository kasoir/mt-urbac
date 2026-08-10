import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from '../entities/tenant.entity';

@Injectable()
export class TenantsService {
  constructor(
    @InjectRepository(Tenant)
    private tenantRepo: Repository<Tenant>,
  ) {}

  findAll() {
    return this.tenantRepo.find();
  }

  async findBySlug(slug: string) {
    const tenant = await this.tenantRepo.findOne({ where: { slug } });
    if (!tenant) {
      throw new NotFoundException(`Tenant with slug ${slug} not found`);
    }
    return tenant;
  }

  create(dto: Partial<Tenant>) {
    const tenant = this.tenantRepo.create(dto);
    return this.tenantRepo.save(tenant);
  }

  async update(uid: string, dto: Partial<Tenant>) {
    const tenant = await this.tenantRepo.findOne({ where: { uid } });
    if (!tenant) {
      throw new NotFoundException(`Tenant with uid ${uid} not found`);
    }
    Object.assign(tenant, dto);
    return this.tenantRepo.save(tenant);
  }

  async remove(uid: string) {
    const tenant = await this.tenantRepo.findOne({ where: { uid } });
    if (!tenant) {
      throw new NotFoundException(`Tenant with uid ${uid} not found`);
    }
    return this.tenantRepo.remove(tenant);
  }
}
