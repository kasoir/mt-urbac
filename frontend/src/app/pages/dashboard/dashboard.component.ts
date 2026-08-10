import { Component, OnInit } from '@angular/core';

import { Router, RouterLink, RouterOutlet, RouterLinkActive } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ContextService } from '../../core/services/context.service';
import { HasPermissionDirective } from '../../core/directives/has-permission.directive';
import { Group, User } from '../../core/models/mt-urbac.models';

// @openng/optimus-ui Imports
import { SelectModule } from '@openng/optimus-ui/select';
import { ButtonModule } from '@openng/optimus-ui/button';
import { TagModule } from '@openng/optimus-ui/tag';
import { TooltipModule } from '@openng/optimus-ui/tooltip';

@Component({
    selector: 'app-dashboard',
    imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    FormsModule,
    SelectModule,
    ButtonModule,
    TagModule,
    TooltipModule,
    HasPermissionDirective
],
    template: `
    <div class="min-h-screen flex flex-col bg-gray-50 text-gray-900 font-['Plus_Jakarta_Sans',sans-serif]">
    
      <!-- TOP NAVIGATION BAR -->
      <header class="h-16 border-b border-gray-200 bg-white sticky top-0 z-50 px-6 flex items-center justify-between">
    
        <!-- Left: Logo & Brand -->
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold">
            <i class="pi pi-shield text-xl"></i>
          </div>
          <div>
            <h2 class="font-bold text-lg leading-tight tracking-tight text-gray-900">MT-URBAC</h2>
            <p class="text-[10px] uppercase font-semibold tracking-wider text-blue-600">Enterprise Access Control</p>
          </div>
        </div>
    
        <!-- Right: Active Group Switcher & User Profile & Logout -->
        <div class="flex items-center gap-6">

          <!-- User Profile & Status -->
          @if (currentUser) {
            <div class="flex items-center gap-3 border-gray-200 pl-6">
              <div class="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">
                {{ getDisplayName().charAt(0).toUpperCase() }}
              </div>
              <div class="hidden md:flex flex-col">
                <div class="flex items-center gap-2">
                  <span class="text-sm font-semibold text-gray-900">{{ getDisplayName() }}</span>
                  @if (currentUser.isSuperAdmin) {
                    <span class="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide bg-amber-100 text-amber-700 rounded-full">
                      SuperAdmin
                    </span>
                  }
                  @if (!currentUser.isSuperAdmin) {
                    <span class="px-2 py-0.5 text-[10px] font-semibold bg-blue-50 border border-blue-200 text-blue-700 rounded-full">
                      Lvl {{ maxRoleLevel }}
                    </span>
                  }
                </div>
                <span class="text-xs text-gray-500">{{ currentUser.email }}</span>
              </div>
            </div>
          }
    
          <!-- Logout Button -->
          <button
            (click)="logout()"
            class="p-2 text-gray-400 hover:text-red-500 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            pTooltip="Sign Out"
            tooltipPosition="bottom"
            >
            <i class="pi pi-power-off text-lg"></i>
          </button>
        </div>
      </header>
    
      <!-- BODY: SIDEBAR + CONTENT -->
      <div class="flex flex-1 overflow-hidden">
    
        <!-- SIDEBAR NAVIGATION -->
        <aside class="w-64 bg-white border-r border-gray-200 p-4 flex flex-col justify-between shrink-0">
          <div class="space-y-6">
    
            <div class="text-[11px] font-extrabold uppercase tracking-wider text-gray-400 px-3">
              Management Modules
            </div>
    
            <nav class="space-y-1">
    
              <!-- Overview Link -->
              <a
                routerLink="./overview"
                routerLinkActive="bg-blue-50 text-blue-700 font-semibold"
                class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-600 hover:bg-gray-50 transition-all border border-transparent text-sm"
                >
                <i class="pi pi-home text-base"></i>
                <span>Overview</span>
              </a>
    
              <!-- Users Link -->
              <ng-container *hasPermission="['user:read', 'user:manage', 'MANAGE_USERS', '*']">
                <a
                  routerLink="./users"
                  routerLinkActive="bg-blue-50 text-blue-700 font-semibold"
                  class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-600 hover:bg-gray-50 transition-all border border-transparent text-sm"
                  >
                  <i class="pi pi-users text-base"></i>
                  <span>User Management</span>
                </a>
              </ng-container>
    
              <!-- Groups Link -->
              <ng-container *hasPermission="['group:read', 'group:manage', 'MANAGE_GROUPS', '*']">
                <a
                  routerLink="./groups"
                  routerLinkActive="bg-blue-50 text-blue-700 font-semibold"
                  class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-600 hover:bg-gray-50 transition-all border border-transparent text-sm"
                  >
                  <i class="pi pi-folder text-base"></i>
                  <span>Group Management</span>
                </a>
              </ng-container>
    
              <!-- Roles Link -->
              <ng-container *hasPermission="['role:create', 'role:manage', 'MANAGE_ROLES', '*']">
                <a
                  routerLink="./roles"
                  routerLinkActive="bg-blue-50 text-blue-700 font-semibold"
                  class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-600 hover:bg-gray-50 transition-all border border-transparent text-sm"
                  >
                  <i class="pi pi-key text-base"></i>
                  <span>Role Management</span>
                </a>
              </ng-container>
    
              <!-- Privileges Link -->
              <ng-container *hasPermission="['privilege:read', 'privilege:manage', 'MANAGE_PRIVILEGES', '*']">
                <a
                  routerLink="./privileges"
                  routerLinkActive="bg-blue-50 text-blue-700 font-semibold"
                  class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-600 hover:bg-gray-50 transition-all border border-transparent text-sm"
                  >
                  <i class="pi pi-lock text-base"></i>
                  <span>Privilege Actions</span>
                </a>
              </ng-container>

              <!-- Tenant Management Link -->
              @if (isSuperAdmin) {
                <a
                  routerLink="./tenants"
                  routerLinkActive="bg-blue-50 text-blue-700 font-semibold"
                  class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-600 hover:bg-gray-50 transition-all border border-transparent text-sm"
                  >
                  <i class="pi pi-building text-base"></i>
                  <span>Tenant Management</span>
                </a>
              }
    
            </nav>
          </div>
    
          <!-- Bottom Active Context Info Card -->
          <div class="mt-auto">
            <a routerLink="../app" class="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 rounded-xl transition-colors text-sm font-semibold">
              <i class="pi pi-arrow-left"></i>
              Back to Application
            </a>
          </div>
        </aside>
    
        <!-- MAIN CONTENT AREA -->
        <main class="flex-1 overflow-y-auto p-8 bg-gray-50">
          <router-outlet></router-outlet>
        </main>
      </div>
    
    </div>
    `
})
export class DashboardComponent implements OnInit {
  currentUser: User | null = null;
  userGroups: Group[] = [];
  selectedGroup: Group | null = null;
  activePrivileges: string[] = [];
  maxRoleLevel = 9999;
  isSuperAdmin = false;

  constructor(
    private authService: AuthService,
    private contextService: ContextService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.isSuperAdmin = !!user?.isSuperAdmin;
      this.userGroups = user?.groups || [];
    });

    this.contextService.activeGroup$.subscribe(group => {
      this.selectedGroup = group;
    });

    this.contextService.privileges$.subscribe(privs => {
      this.activePrivileges = privs;
    });

    this.contextService.maxRoleLevel$.subscribe(level => {
      this.maxRoleLevel = level;
    });
  }

  onGroupChange(group: Group): void {
    this.contextService.setActiveGroup(group);
  }

  logout(): void {
    this.authService.logout();
  }

  getDisplayName(): string {
    if (!this.currentUser) return '?';
    // Handle both username (frontend model) and name (backend model fallback)
    const name = this.currentUser.username || (this.currentUser as any).name;
    if (name) return name;
    if (this.currentUser.email) {
      return this.currentUser.email.split('@')[0];
    }
    return '?';
  }
}
