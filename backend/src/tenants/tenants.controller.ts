import { Controller, Get, Post, Patch, Delete, Param, Body, Req, ForbiddenException } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller('api/tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  private checkSuperAdmin(req: any) {
    if (!req.isGlobalAdmin && !req.user?.isSuperAdmin) {
      throw new ForbiddenException('Only SuperAdmins can manage tenants');
    }
  }

  @Public()
  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.tenantsService.findBySlug(slug);
  }

  @Get()
  findAll(@Req() req: any) {
    this.checkSuperAdmin(req);
    return this.tenantsService.findAll();
  }

  @Post()
  create(@Req() req: any, @Body() dto: any) {
    this.checkSuperAdmin(req);
    return this.tenantsService.create(dto);
  }

  @Patch(':uid')
  update(@Req() req: any, @Param('uid') uid: string, @Body() dto: any) {
    this.checkSuperAdmin(req);
    return this.tenantsService.update(uid, dto);
  }

  @Delete(':uid')
  remove(@Req() req: any, @Param('uid') uid: string) {
    this.checkSuperAdmin(req);
    return this.tenantsService.remove(uid);
  }
}
