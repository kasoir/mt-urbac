import { Component, OnInit } from '@angular/core';

import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PrivilegeService } from '../../core/services/privilege.service';
import { ContextService } from '../../core/services/context.service';
import { TenantService } from '../../core/services/tenant.service';
import { Privilege } from '../../core/models/mt-urbac.models';
import { HasPermissionDirective } from '../../core/directives/has-permission.directive';

// @openng/optimus-ui Imports
import { TableModule } from '@openng/optimus-ui/table';
import { DialogModule } from '@openng/optimus-ui/dialog';
import { InputTextModule } from '@openng/optimus-ui/inputtext';
import { ButtonModule } from '@openng/optimus-ui/button';
import { ToastModule } from '@openng/optimus-ui/toast';
import { MessageService } from '@openng/optimus-ui/api';

@Component({
    selector: 'app-privilege-management',
    imports: [
    ReactiveFormsModule,
    TableModule,
    DialogModule,
    InputTextModule,
    ButtonModule,
    ToastModule,
    HasPermissionDirective
],
    providers: [MessageService],
    template: `
    <div class="space-y-6">
      <p-toast></p-toast>

      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 class="text-2xl font-bold text-gray-900 tracking-tight">Privilege Action Registry</h2>
          <p class="text-gray-500 text-sm mt-0.5">Register granular permission actions for system resource authorization control.</p>
        </div>

        <button 
          *hasPermission="['privilege:create', 'privilege:manage', 'MANAGE_PRIVILEGES', '*']"
          (click)="openCreateModal()" 
          class="py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl shadow-sm flex items-center gap-2 text-sm transition-all cursor-pointer w-fit"
        >
          <i class="pi pi-plus"></i>
          <span>Create New Privilege</span>
        </button>
      </div>

      <!-- Privileges Table -->
      <div class="bg-white rounded-2xl p-4 border border-gray-200 overflow-hidden shadow-sm">
        <p-table 
          [value]="privileges" 
          [loading]="isLoading" 
          [paginator]="true" 
          [rows]="8"
          responsiveLayout="scroll"
          styleClass="p-datatable-sm"
        >
          <ng-template pTemplate="header">
            <tr>
              <th>Privilege Name</th>
              <th>Tenant</th>
              <th>Action Identifier</th>
              <th>Resource Domain</th>
              <th>Description</th>
              <th class="text-right">Actions</th>
            </tr>
          </ng-template>

          <ng-template pTemplate="body" let-priv>
            <tr>
              <td>
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center font-bold text-emerald-600 text-sm">
                    <i class="pi pi-lock"></i>
                  </div>
                  <span class="font-semibold text-gray-900 text-sm">{{ priv.name }}</span>
                </div>
              </td>
              <td>
                <span class="text-xs text-gray-600">{{ getTenantName(priv.tenantUid) }}</span>
              </td>
              <td>
                <span class="px-2.5 py-1 text-xs font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md">
                  {{ priv.action }}
                </span>
              </td>
              <td>
                <span class="text-xs text-gray-500 font-medium">
                  {{ priv.resource || 'GLOBAL' }}
                </span>
              </td>
              <td class="text-gray-500 text-sm">
                {{ priv.description || 'No description' }}
              </td>
              <td class="text-right">
                <div class="flex items-center justify-end gap-2">
                  <button 
                    *hasPermission="['privilege:update', 'privilege:manage', 'MANAGE_PRIVILEGES', '*']"
                    (click)="openEditModal(priv)" 
                    class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit Privilege"
                  >
                    <i class="pi pi-pencil"></i>
                  </button>
                  <button 
                    *hasPermission="['privilege:delete', 'privilege:manage', 'MANAGE_PRIVILEGES', '*']"
                    (click)="deletePrivilege(priv)" 
                    class="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete Privilege"
                  >
                    <i class="pi pi-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
          </ng-template>

          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="5" class="text-center py-8 text-gray-500">
                No privileges registered yet.
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>

      <!-- CREATE PRIVILEGE MODAL -->
      <p-dialog 
        header="Register System Privilege Action" 
        [(visible)]="showCreateModal" 
        [modal]="true" 
        [style]="{ width: '450px' }"
      >
        <form [formGroup]="createPrivilegeForm" (ngSubmit)="submitCreatePrivilege()" class="space-y-4 pt-2">
          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">Privilege Display Name</label>
            <input type="text" pInputText formControlName="name" placeholder="e.g. Read Users Directory" class="w-full !bg-white !border-gray-300 !text-gray-900 focus:!border-blue-500 rounded-lg p-2.5" />
          </div>

          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">Action Identifier Key</label>
            <input type="text" pInputText formControlName="action" placeholder="e.g. user:read, role:assign" class="w-full !bg-white !border-gray-300 !text-gray-900 focus:!border-blue-500 font-mono rounded-lg p-2.5" />
          </div>

          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">Target Resource Domain</label>
            <input type="text" pInputText formControlName="resource" placeholder="e.g. users, roles, billing" class="w-full !bg-white !border-gray-300 !text-gray-900 focus:!border-blue-500 rounded-lg p-2.5" />
          </div>

          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">Description</label>
            <input type="text" pInputText formControlName="description" placeholder="Short description of privilege scope" class="w-full !bg-white !border-gray-300 !text-gray-900 focus:!border-blue-500 rounded-lg p-2.5" />
          </div>

          @if (isSuperAdmin) {
            <div>
              <label class="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">Tenant</label>
              <select formControlName="tenantUid" class="w-full !bg-white !border-gray-300 !text-gray-900 focus:!border-blue-500 rounded-lg p-2.5 border">
                <option value="">None (Current/System)</option>
                @for (t of allTenants; track t.uid) {
                  <option [value]="t.uid">{{ t.name }}</option>
                }
              </select>
            </div>
          }

          <div class="flex justify-end gap-3 pt-4 border-t border-gray-200 mt-4">
            <button type="button" (click)="showCreateModal = false" class="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm">Cancel</button>
            <button type="submit" [disabled]="createPrivilegeForm.invalid || isSaving" class="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg text-sm disabled:opacity-50">
              Save Privilege Action
            </button>
          </div>
        </form>
      </p-dialog>

      <!-- EDIT PRIVILEGE MODAL -->
      <p-dialog 
        header="Edit System Privilege Action" 
        [(visible)]="showEditModal" 
        [modal]="true" 
        [style]="{ width: '450px' }"
      >
        <form [formGroup]="editPrivilegeForm" (ngSubmit)="submitEditPrivilege()" class="space-y-4 pt-2">
          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">Privilege Display Name</label>
            <input type="text" pInputText formControlName="name" class="w-full !bg-white !border-gray-300 !text-gray-900 focus:!border-blue-500 rounded-lg p-2.5" />
          </div>

          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">Action Identifier Key</label>
            <input type="text" pInputText formControlName="action" class="w-full !bg-white !border-gray-300 !text-gray-900 focus:!border-blue-500 font-mono rounded-lg p-2.5" />
          </div>

          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">Target Resource Domain</label>
            <input type="text" pInputText formControlName="resource" class="w-full !bg-white !border-gray-300 !text-gray-900 focus:!border-blue-500 rounded-lg p-2.5" />
          </div>

          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">Description</label>
            <input type="text" pInputText formControlName="description" class="w-full !bg-white !border-gray-300 !text-gray-900 focus:!border-blue-500 rounded-lg p-2.5" />
          </div>

          @if (isSuperAdmin) {
            <div>
              <label class="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">Tenant</label>
              <select formControlName="tenantUid" class="w-full !bg-white !border-gray-300 !text-gray-900 focus:!border-blue-500 rounded-lg p-2.5 border">
                <option value="">None (Current/System)</option>
                @for (t of allTenants; track t.uid) {
                  <option [value]="t.uid">{{ t.name }}</option>
                }
              </select>
            </div>
          }

          <div class="flex justify-end gap-3 pt-4 border-t border-gray-200 mt-4">
            <button type="button" (click)="showEditModal = false" class="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm">Cancel</button>
            <button type="submit" [disabled]="editPrivilegeForm.invalid || isSaving" class="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg text-sm disabled:opacity-50">
              Update Privilege Action
            </button>
          </div>
        </form>
      </p-dialog>
    </div>
  `
})
export class PrivilegeManagementComponent implements OnInit {
  privileges: Privilege[] = [];
  isLoading = true;
  isSaving = false;
  showCreateModal = false;
  showEditModal = false;
  createPrivilegeForm!: FormGroup;
  editPrivilegeForm!: FormGroup;
  selectedPrivilegeId: string | null = null;
  allTenants: any[] = [];
  isSuperAdmin = false;

  constructor(
    private fb: FormBuilder,
    private privilegeService: PrivilegeService,
    private contextService: ContextService,
    private tenantService: TenantService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.createPrivilegeForm = this.fb.group({
      name: ['', Validators.required],
      action: ['', [Validators.required, Validators.pattern('^[a-zA-Z0-9:*_-]+$')]],
      resource: [''],
      description: [''],
      tenantUid: ['']
    });

    this.editPrivilegeForm = this.fb.group({
      name: ['', Validators.required],
      action: ['', [Validators.required, Validators.pattern('^[a-zA-Z0-9:*_-]+$')]],
      resource: [''],
      description: [''],
      tenantUid: ['']
    });

    this.isSuperAdmin = this.contextService.hasPermission('*');

    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    this.privilegeService.getPrivileges().subscribe({
      next: (res) => {
        this.privileges = res;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load privileges.' });
      }
    });

    if (this.isSuperAdmin) {
      this.tenantService.getTenants().subscribe(tenants => this.allTenants = tenants);
    }
  }

  openCreateModal(): void {
    this.createPrivilegeForm.reset();
    this.showCreateModal = true;
  }

  submitCreatePrivilege(): void {
    if (this.createPrivilegeForm.invalid) return;

    this.isSaving = true;
    this.privilegeService.createPrivilege(this.createPrivilegeForm.value).subscribe({
      next: () => {
        this.isSaving = false;
        this.showCreateModal = false;
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Privilege action registered.' });
        this.loadData();
      },
      error: (err) => {
        this.isSaving = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'Failed to create privilege.' });
      }
    });
  }

  openEditModal(priv: Privilege): void {
    this.selectedPrivilegeId = priv.uid;
    this.editPrivilegeForm.patchValue({
      name: priv.name,
      action: priv.action,
      resource: priv.resource,
      description: priv.description,
      tenantUid: (priv as any).tenantUid || ''
    });
    this.showEditModal = true;
  }

  submitEditPrivilege(): void {
    if (this.editPrivilegeForm.invalid || !this.selectedPrivilegeId) return;

    this.isSaving = true;
    this.privilegeService.updatePrivilege(this.selectedPrivilegeId, this.editPrivilegeForm.value).subscribe({
      next: () => {
        this.isSaving = false;
        this.showEditModal = false;
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Privilege action updated.' });
        this.loadData();
      },
      error: (err) => {
        this.isSaving = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'Failed to update privilege.' });
      }
    });
  }

  deletePrivilege(priv: Privilege): void {
    if (confirm(`Are you sure you want to delete privilege ${priv.name} (${priv.action})?`)) {
      this.privilegeService.deletePrivilege(priv.uid).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Deleted', detail: 'Privilege action removed.' });
          this.loadData();
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete privilege.' });
        }
      });
    }
  }

  getTenantName(uid?: string): string {
    if (!uid) return 'System / No Tenant';
    const t = this.allTenants.find(x => x.uid === uid);
    return t ? t.name : uid;
  }
}
