import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TenantService } from '../../core/services/tenant.service';

@Component({
  selector: 'app-tenant-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-6">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold">Tenant Management</h1>
        <button (click)="openCreateModal()" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          Create Tenant
        </button>
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table class="w-full text-left">
          <thead class="bg-gray-50 border-b border-gray-200">
            <tr>
              <th class="px-6 py-3 font-semibold text-gray-600 text-sm">UID</th>
              <th class="px-6 py-3 font-semibold text-gray-600 text-sm">Name</th>
              <th class="px-6 py-3 font-semibold text-gray-600 text-sm">Slug</th>
              <th class="px-6 py-3 font-semibold text-gray-600 text-sm">Contact</th>
              <th class="px-6 py-3 font-semibold text-gray-600 text-sm">Theme</th>
              <th class="px-6 py-3 font-semibold text-gray-600 text-sm">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            @for (tenant of tenants; track tenant.uid) {
              <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 text-sm font-medium">{{ tenant.uid }}</td>
                <td class="px-6 py-4 text-sm">{{ tenant.name }}</td>
                <td class="px-6 py-4 text-sm">{{ tenant.slug }}</td>
                <td class="px-6 py-4 text-sm">{{ tenant.contact_details }}</td>
                <td class="px-6 py-4 text-sm">
                  <div class="w-6 h-6 rounded border" [style.backgroundColor]="tenant.themePrimary || '#000'"></div>
                </td>
                <td class="px-6 py-4 text-sm flex gap-3">
                  <button (click)="openEditModal(tenant)" class="text-blue-600 hover:underline">Edit</button>
                  <button (click)="deleteTenant(tenant.uid)" class="text-red-600 hover:underline">Delete</button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <!-- Modal -->
      @if (showModal) {
        <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div class="bg-white rounded-xl p-6 w-[400px]">
            <h2 class="text-xl font-bold mb-4">{{ isEditing ? 'Edit Tenant' : 'Create Tenant' }}</h2>
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-semibold mb-1">Name</label>
                <input [(ngModel)]="currentTenant.name" class="w-full border rounded-lg px-3 py-2" placeholder="e.g. Acme Corp" />
              </div>
              <div>
                <label class="block text-sm font-semibold mb-1">Slug</label>
                <input [(ngModel)]="currentTenant.slug" class="w-full border rounded-lg px-3 py-2" placeholder="e.g. acme" />
              </div>
              <div>
                <label class="block text-sm font-semibold mb-1">Contact Details</label>
                <textarea [(ngModel)]="currentTenant.contact_details" class="w-full border rounded-lg px-3 py-2" placeholder="Email, Phone, etc." rows="2"></textarea>
              </div>
              <div>
                <label class="block text-sm font-semibold mb-1">Theme Primary Color</label>
                <input type="color" [(ngModel)]="currentTenant.themePrimary" class="w-full border rounded-lg h-10" />
              </div>
            </div>
            <div class="flex justify-end gap-3 mt-6">
              <button (click)="closeModal()" class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
              <button (click)="saveTenant()" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save</button>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class TenantManagementComponent implements OnInit {
  tenants: any[] = [];
  showModal = false;
  isEditing = false;
  currentTenant: any = { name: '', slug: '', contact_details: '', themePrimary: '#3b82f6' };

  constructor(private tenantService: TenantService) {}

  ngOnInit() {
    this.loadTenants();
  }

  loadTenants() {
    this.tenantService.getTenants().subscribe(res => {
      this.tenants = res;
    });
  }

  openCreateModal() {
    this.isEditing = false;
    this.currentTenant = { name: '', slug: '', contact_details: '', themePrimary: '#3b82f6' };
    this.showModal = true;
  }

  openEditModal(tenant: any) {
    this.isEditing = true;
    this.currentTenant = { ...tenant };
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  saveTenant() {
    if (this.isEditing) {
      this.tenantService.updateTenant(this.currentTenant.uid, this.currentTenant).subscribe(() => {
        this.loadTenants();
        this.closeModal();
      });
    } else {
      this.tenantService.createTenant(this.currentTenant).subscribe(() => {
        this.loadTenants();
        this.closeModal();
      });
    }
  }

  deleteTenant(uid: string) {
    if (confirm('Are you sure you want to delete this tenant?')) {
      this.tenantService.deleteTenant(uid).subscribe(() => {
        this.loadTenants();
      });
    }
  }
}
