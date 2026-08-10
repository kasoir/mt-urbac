import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface TenantConfig {
  uid: string;
  name?: string;
  slug: string;
  contact_details?: string;
  config: {
    themePrimary?: string;
    fontFamily?: string;
    backgroundImage?: string;
  };
}

import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class TenantConfigService {
  private currentTenant: TenantConfig | null = null;
  private readonly adminPath = '/admin';

  constructor(private http: HttpClient, private router: Router) {}

  get tenant(): TenantConfig | null {
    return this.currentTenant;
  }

  async init(): Promise<void> {
    const isGlobalAdmin = window.location.pathname.startsWith(this.adminPath);
    if (isGlobalAdmin) {
      return;
    }

    const slug = this.extractTenantSlug();
    if (!slug) {
      return;
    }

    try {
      const tenant = await firstValueFrom(
         this.http.get<TenantConfig>(`http://localhost:3000/api/tenants/slug/${slug}`)
      );

      this.currentTenant = tenant;
      this.applyTheme(tenant);
    } catch (e) {
      console.error('Failed to load tenant config', e);
      // If tenant is not found or error occurs, redirect to 404
      setTimeout(() => {
        this.router.navigate(['/not-found'], { replaceUrl: true });
      });
    }
  }

  private extractTenantSlug(): string {
    const hostname = window.location.hostname;
    
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      const pathSegments = window.location.pathname.split('/').filter(p => p);
      if (pathSegments.length > 0 && pathSegments[0] !== 'admin' && pathSegments[0] !== 'not-found') {
         return pathSegments[0];
      }
      return '';
    } else {
      const parts = hostname.split('.');
      if (parts.length > 2) {
        return parts[0];
      }
      return '';
    }
  }

  private applyTheme(tenant: TenantConfig) {
    if (!tenant.config) return;
    
    const root = document.documentElement;
    
    if (tenant.config.themePrimary) {
      root.style.setProperty('--theme-primary', tenant.config.themePrimary);
    }
    
    if (tenant.config.fontFamily) {
      root.style.setProperty('--theme-font', tenant.config.fontFamily);
    }

    if (tenant.config.backgroundImage) {
      root.style.setProperty('--theme-bg-image', `url(${tenant.config.backgroundImage})`);
    }
  }
}
