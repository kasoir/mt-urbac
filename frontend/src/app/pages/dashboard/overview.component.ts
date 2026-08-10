import { Component, OnInit } from '@angular/core';

import { AuthService } from '../../core/services/auth.service';
import { ContextService } from '../../core/services/context.service';
import { User } from '../../core/models/mt-urbac.models';
import { HasPermissionDirective } from '../../core/directives/has-permission.directive';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-overview',
    imports: [HasPermissionDirective, RouterLink],
    template: `
    <div class="space-y-8">
      
      <!-- Welcome Hero Banner -->
      <div class="bg-white p-8 rounded-2xl border border-blue-200 shadow-lg shadow-blue-500/20 relative overflow-hidden">
        <div class="absolute -right-10 -bottom-10 w-64 h-64 bg-blue-100 rounded-full blur-3xl pointer-events-none"></div>
        <div class="relative z-10 space-y-3">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            System Active Context Loaded
          </div>
          <h1 class="text-3xl font-extrabold text-gray-900 tracking-tight">
            Welcome back, {{ currentUser?.username || 'User' }}!
          </h1>
          <p class="text-gray-600 text-sm max-w-2xl leading-relaxed">
            MT-URBAC delivers hierarchical group-based role and privilege management. Access parameters are dynamically evaluated based on your current active context: <span class="text-blue-600 font-semibold">{{ activeGroup?.name || 'Global' }}</span>.
          </p>
        </div>
      </div>

      <!-- Quick Metrics Grid -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div class="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:shadow-blue-500/10 transition-shadow space-y-2">
          <div class="flex items-center justify-between text-gray-500">
            <span class="text-xs font-semibold uppercase">SuperAdmin Status</span>
            <i class="pi pi-shield text-blue-500"></i>
          </div>
          <div class="text-2xl font-bold text-gray-900">
            {{ currentUser?.isSuperAdmin ? 'YES' : 'NO' }}
          </div>
          <div class="text-xs text-gray-500">Unrestricted system override</div>
        </div>

        <div class="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:shadow-blue-500/10 transition-shadow space-y-2">
          <div class="flex items-center justify-between text-gray-500">
            <span class="text-xs font-semibold uppercase">Max Role Level</span>
            <i class="pi pi-sliders-h text-blue-500"></i>
          </div>
          <div class="text-2xl font-bold text-gray-900">
            Level {{ maxRoleLevel }}
          </div>
          <div class="text-xs text-gray-500">Authority threshold for role assignments</div>
        </div>

        <div class="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:shadow-blue-500/10 transition-shadow space-y-2">
          <div class="flex items-center justify-between text-gray-500">
            <span class="text-xs font-semibold uppercase">Active Privileges</span>
            <i class="pi pi-key text-blue-500"></i>
          </div>
          <div class="text-2xl font-bold text-gray-900">
            {{ isSuperAdmin ? 'Full Access (*)' : activePrivileges.length }}
          </div>
          <div class="text-xs text-gray-500">Actions allowed in active context</div>
        </div>

        <div class="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:shadow-blue-500/10 transition-shadow space-y-2">
          <div class="flex items-center justify-between text-gray-500">
            <span class="text-xs font-semibold uppercase">Assigned Groups</span>
            <i class="pi pi-folder text-blue-500"></i>
          </div>
          <div class="text-2xl font-bold text-gray-900">
            {{ userGroups.length || 0 }}
          </div>
          <div class="text-xs text-gray-500">Group memberships</div>
        </div>
      </div>

      <!-- Quick Action Modules -->
      <div class="space-y-4">
        <h3 class="text-lg font-bold text-gray-900">Quick Management Links</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <ng-container *hasPermission="['user:read', 'user:manage', 'MANAGE_USERS', '*']">
            <a routerLink="../users" class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-lg hover:shadow-blue-500/20 hover:border-blue-300 transition-all group flex flex-col justify-between">
              <div class="space-y-2">
                <div class="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <i class="pi pi-users text-lg"></i>
                </div>
                <h4 class="font-semibold text-gray-900">User Directory</h4>
                <p class="text-xs text-gray-500">Manage user accounts, assign group memberships and roles.</p>
              </div>
              <div class="mt-4 text-xs font-semibold text-blue-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Open Directory <i class="pi pi-arrow-right text-[10px]"></i>
              </div>
            </a>
          </ng-container>

          <ng-container *hasPermission="['group:read', 'group:manage', 'MANAGE_GROUPS', '*']">
            <a routerLink="../groups" class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-lg hover:shadow-blue-500/20 hover:border-blue-300 transition-all group flex flex-col justify-between">
              <div class="space-y-2">
                <div class="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <i class="pi pi-folder text-lg"></i>
                </div>
                <h4 class="font-semibold text-gray-900">Group Management</h4>
                <p class="text-xs text-gray-500">Create enterprise groups and configure group-level role sets.</p>
              </div>
              <div class="mt-4 text-xs font-semibold text-blue-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Manage Groups <i class="pi pi-arrow-right text-[10px]"></i>
              </div>
            </a>
          </ng-container>

          <ng-container *hasPermission="['role:create', 'role:manage', 'MANAGE_ROLES', '*']">
            <a routerLink="../roles" class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-lg hover:shadow-blue-500/20 hover:border-blue-300 transition-all group flex flex-col justify-between">
              <div class="space-y-2">
                <div class="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <i class="pi pi-key text-lg"></i>
                </div>
                <h4 class="font-semibold text-gray-900">Role Hierarchies</h4>
                <p class="text-xs text-gray-500">Define role levels and attach privilege actions.</p>
              </div>
              <div class="mt-4 text-xs font-semibold text-blue-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Manage Roles <i class="pi pi-arrow-right text-[10px]"></i>
              </div>
            </a>
          </ng-container>

          <ng-container *hasPermission="['privilege:create', 'privilege:manage', 'MANAGE_PRIVILEGES', '*']">
            <a routerLink="../privileges" class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-lg hover:shadow-blue-500/20 hover:border-blue-300 transition-all group flex flex-col justify-between">
              <div class="space-y-2">
                <div class="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <i class="pi pi-lock text-lg"></i>
                </div>
                <h4 class="font-semibold text-gray-900">Privilege Registry</h4>
                <p class="text-xs text-gray-500">Register granular system permissions and action strings.</p>
              </div>
              <div class="mt-4 text-xs font-semibold text-blue-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Manage Privileges <i class="pi pi-arrow-right text-[10px]"></i>
              </div>
            </a>
          </ng-container>

        </div>
      </div>

    </div>
  `
})
export class OverviewComponent implements OnInit {
  currentUser: User | null = null;
  activeGroup: any = null;
  maxRoleLevel = 9999;
  activePrivileges: string[] = [];
  isSuperAdmin = false;
  userGroups: any[] = [];

  constructor(
    private authService: AuthService,
    private contextService: ContextService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(u => {
      this.currentUser = u;
      this.isSuperAdmin = !!u?.isSuperAdmin;
      this.userGroups = u?.groups || [];
    });

    this.contextService.activeGroup$.subscribe(g => this.activeGroup = g);
    this.contextService.maxRoleLevel$.subscribe(l => this.maxRoleLevel = l);
    this.contextService.privileges$.subscribe(p => this.activePrivileges = p);
  }
}
