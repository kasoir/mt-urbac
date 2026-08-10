import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ContextService } from '../services/context.service';

export const permissionGuard: CanActivateFn = (route, state) => {
  const contextService = inject(ContextService);
  const router = inject(Router);

  const requiredPermission = route.data?.['requiredPermission'] as string;

  if (!requiredPermission || contextService.hasPermission(requiredPermission)) {
    return true;
  }

  // If unauthorized, redirect to the overview page of the current context
  let fallbackUrl = '/';
  const urlParts = state.url.split('?')[0].split('/').filter(Boolean);
  
  if (urlParts.length > 0) {
    if (urlParts[0] === 'admin') {
      fallbackUrl = '/admin/dashboard/overview';
    } else {
      fallbackUrl = `/${urlParts[0]}/dashboard/overview`;
    }
  }

  router.navigate([fallbackUrl]);
  return false;
};
