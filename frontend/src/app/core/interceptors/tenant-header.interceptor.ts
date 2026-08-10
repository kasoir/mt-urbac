import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { TenantConfigService } from '../services/tenant-config.service';

export const tenantHeaderInterceptor: HttpInterceptorFn = (req, next) => {
  if (window.location.pathname.startsWith('/admin')) {
    return next(req);
  }

  const tenantService = inject(TenantConfigService);
  const tenant = tenantService.tenant;

  if (tenant && tenant.uid) {
    const cloned = req.clone({
      headers: req.headers.set('X-Tenant-ID', tenant.uid)
    });
    return next(cloned);
  }

  return next(req);
};
