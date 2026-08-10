import { Routes, UrlSegment, UrlMatchResult } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { permissionGuard } from './core/guards/permission.guard';

import { LoginComponent } from './pages/login/login.component';
import { SignupComponent } from './pages/signup/signup.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { OverviewComponent } from './pages/dashboard/overview.component';
import { UserManagementComponent } from './pages/user-management/user-management.component';
import { GroupManagementComponent } from './pages/group-management/group-management.component';
import { RoleManagementComponent } from './pages/role-management/role-management.component';
import { PrivilegeManagementComponent } from './pages/privilege-management/privilege-management.component';
import { NotFoundComponent } from './pages/not-found/not-found.component';
import { AppPortalComponent } from './pages/app-portal/app-portal.component';
import { TenantManagementComponent } from './pages/tenant-management/tenant-management.component';
export function tenantMatcher(segments: UrlSegment[]): UrlMatchResult | null {
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    if (segments.length > 0 && segments[0].path !== 'admin' && segments[0].path !== 'not-found') {
      return { consumed: [segments[0]], posParams: { tenantSlug: segments[0] } };
    }
    return null;
  } else {
    if (segments.length > 0 && segments[0].path === 'admin') {
       return null;
    }
    return { consumed: [] };
  }
}

const dashboardChildren: Routes = [
  { path: '', redirectTo: 'overview', pathMatch: 'full' },
  { path: 'overview', component: OverviewComponent },
  {
    path: 'tenants',
    component: TenantManagementComponent,
    canActivate: [permissionGuard],
    data: { requiredPermission: '*' }
  },
  {
    path: 'users',
    component: UserManagementComponent,
    canActivate: [permissionGuard],
    data: { requiredPermission: 'user:read' }
  },
  {
    path: 'groups',
    component: GroupManagementComponent,
    canActivate: [permissionGuard],
    data: { requiredPermission: 'group:read' }
  },
  {
    path: 'roles',
    component: RoleManagementComponent,
    canActivate: [permissionGuard],
    data: { requiredPermission: 'role:create' }
  },
  {
    path: 'privileges',
    component: PrivilegeManagementComponent,
    canActivate: [permissionGuard],
    data: { requiredPermission: 'privilege:create' }
  }
];

export const routes: Routes = [
  { path: '', redirectTo: '/admin/login', pathMatch: 'full' },
  {
    path: 'admin',
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'login', component: LoginComponent },
      { path: 'signup', component: SignupComponent },
      {
        path: 'app',
        component: AppPortalComponent,
        canActivate: [authGuard]
      },
      {
        path: 'dashboard',
        component: DashboardComponent,
        canActivate: [authGuard],
        children: dashboardChildren
      }
    ]
  },
  {
    matcher: tenantMatcher,
    children: [
      { path: 'login', component: LoginComponent },
      { path: 'signup', component: SignupComponent },
      {
        path: 'app',
        component: AppPortalComponent,
        canActivate: [authGuard]
      },
      {
        path: 'dashboard',
        component: DashboardComponent,
        canActivate: [authGuard],
        children: dashboardChildren
      },
      { path: '', redirectTo: 'app', pathMatch: 'full' }
    ]
  },
  {
    path: 'not-found',
    component: NotFoundComponent
  },
  { path: '**', redirectTo: '/not-found' }
];
