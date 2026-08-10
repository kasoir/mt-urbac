import { Injectable, CanActivate, ExecutionContext, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reflector } from '@nestjs/core';
import { Tenant } from '../entities/tenant.entity';
import { IS_PUBLIC_KEY } from './guards/jwt-auth.guard';

@Injectable()
export class TenantHeaderGuard implements CanActivate {
  constructor(
    @InjectRepository(Tenant)
    private tenantRepository: Repository<Tenant>,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (user && user.isSuperAdmin) {
      request['isGlobalAdmin'] = true;
      return true;
    }

    const tenantId = request.headers['x-tenant-id'];
    
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!tenantId) {
      if (isPublic) {
        request['isGlobalAdmin'] = false;
        request['tenantUid'] = null;
        return true;
      }
      throw new BadRequestException('X-Tenant-ID header is missing');
    }

    const tenant = await this.tenantRepository.findOne({ where: { uid: tenantId } });
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    request['tenantUid'] = tenant.uid;
    request['isGlobalAdmin'] = false;
    return true;
  }
}
