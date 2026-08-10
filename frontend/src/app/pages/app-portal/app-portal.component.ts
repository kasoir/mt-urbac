import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { TenantConfigService } from '../../core/services/tenant-config.service';
import { User } from '../../core/models/mt-urbac.models';

@Component({
  selector: 'app-portal',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
      <div class="bg-white p-12 rounded-xl shadow-lg max-w-lg w-full text-center space-y-6">
        <h1 class="text-3xl font-bold text-gray-900">Application Workspace</h1>
        <p class="text-gray-500">
          This is a dummy component representing the actual SaaS application workspace for <strong class="text-gray-800">{{ getTenantName() }}</strong>.
        </p>
        
        @if (canManage()) {
          <div class="pt-6 border-t border-gray-200">
            <a routerLink="../dashboard" class="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
              <i class="pi pi-cog"></i>
              Go to Admin Dashboard
            </a>
          </div>
        }
      </div>
    </div>
  `
})
export class AppPortalComponent implements OnInit {
  currentUser: User | null = null;

  constructor(
    private authService: AuthService,
    private tenantConfigService: TenantConfigService
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  canManage(): boolean {
    if (!this.currentUser) return false;
    return !!this.currentUser.isSuperAdmin || (this.currentUser.groups && this.currentUser.groups.length > 0) || false;
  }

  getTenantName(): string {
    const tenant = this.tenantConfigService.tenant;
    if (tenant) {
      return tenant.name || tenant.slug;
    }
    return 'Admin Plane';
  }
}
