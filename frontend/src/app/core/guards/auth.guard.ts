import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  let loginPath = '/login';
  if (state.url.startsWith('/admin')) {
    loginPath = '/admin/login';
  } else if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    const segments = state.url.split('?')[0].split('/').filter(s => s.length > 0);
    if (segments.length > 0 && segments[0] !== 'admin') {
      loginPath = `/${segments[0]}/login`;
    }
  }

  router.navigate([loginPath], { queryParams: { returnUrl: state.url } });
  return false;
};
