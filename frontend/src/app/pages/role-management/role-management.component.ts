import { Component, OnInit } from '@angular/core';

import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RoleService } from '../../core/services/role.service';
import { PrivilegeService } from '../../core/services/privilege.service';
import { ContextService } from '../../core/services/context.service';
import { TenantService } from '../../core/services/tenant.service';
import { Privilege, Role } from '../../core/models/mt-urbac.models';
import { HasPermissionDirective } from '../../core/directives/has-permission.directive';

// @openng/optimus-ui Imports
import { TableModule } from '@openng/optimus-ui/table';
import { DialogModule } from '@openng/optimus-ui/dialog';
import { MultiSelectModule } from '@openng/optimus-ui/multiselect';
import { InputTextModule } from '@openng/optimus-ui/inputtext';
import { InputNumberModule } from '@openng/optimus-ui/inputnumber';
import { ButtonModule } from '@openng/optimus-ui/button';
import { ToastModule } from '@openng/optimus-ui/toast';
import { MessageService } from '@openng/optimus-ui/api';

@Component({
    selector: 'app-role-management',
    imports: [
    FormsModule,
    ReactiveFormsModule,
    TableModule,
    DialogModule,
    MultiSelectModule,
    InputTextModule,
    InputNumberModule,
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
          <h2 class="text-2xl font-bold text-gray-900 tracking-tight">Role Hierarchies</h2>
          <p class="text-gray-500 text-sm mt-0.5">Manage security roles, authority levels, and attach granular privilege actions.</p>
        </div>
    
        <button
          *hasPermission="['role:create', 'role:manage', 'MANAGE_ROLES', '*']"
          (click)="openCreateModal()"
          class="py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl shadow-sm flex items-center gap-2 text-sm transition-all cursor-pointer w-fit"
          >
          <i class="pi pi-plus"></i>
          <span>Create New Role</span>
        </button>
      </div>
    
      <!-- Roles Table -->
      <div class="bg-white rounded-2xl p-4 border border-gray-200 overflow-hidden shadow-sm">
        <p-table
          [value]="roles"
          [loading]="isLoading"
          [paginator]="true"
          [rows]="8"
          responsiveLayout="scroll"
          styleClass="p-datatable-sm"
          >
          <ng-template pTemplate="header">
            <tr>
              <th>Role Name</th>
              <th>Tenant</th>
              <th>Authority Level</th>
              <th>Attached Privileges</th>
              <th class="text-right">Actions</th>
            </tr>
          </ng-template>
    
          <ng-template pTemplate="body" let-role>
            <tr>
              <td>
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-xl bg-cyan-50 border border-cyan-100 flex items-center justify-center font-bold text-cyan-600 text-sm">
                    <i class="pi pi-key"></i>
                  </div>
                  <div>
                    <span class="font-semibold text-gray-900 text-sm">{{ role.name }}</span>
                    @if (role.description) {
                      <div class="text-xs text-gray-500">{{ role.description }}</div>
                    }
                  </div>
                </div>
              </td>
              <td>
                <span class="text-xs text-gray-600">{{ getTenantName(role.tenantUid) }}</span>
              </td>
              <td>
                <span class="px-3 py-1 text-xs font-bold bg-gray-100 text-cyan-700 border border-gray-200 rounded-lg">
                  Level {{ role.level }}
                </span>
              </td>
              <td>
                <div class="flex flex-wrap gap-1">
                  @for (priv of role.privileges; track priv) {
                    <span class="px-2 py-0.5 text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-200 rounded">
                      {{ priv.action }}
                    </span>
                  }
                  @if (!role.privileges || role.privileges.length === 0) {
                    <span class="text-xs text-gray-400 italic">No privileges attached</span>
                  }
                </div>
              </td>
              <td class="text-right">
                <div class="flex items-center justify-end gap-2">
                  <button
                    *hasPermission="['role:update', 'role:manage', 'MANAGE_ROLES', '*']"
                    (click)="openEditModal(role)"
                    class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit Role"
                    >
                    <i class="pi pi-pencil"></i>
                  </button>
                  <button
                    *hasPermission="['role:assign', 'role:manage', 'MANAGE_ROLES', '*']"
                    (click)="openAssignPrivilegesModal(role)"
                    class="p-2 text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors"
                    title="Assign Privileges"
                    >
                    <i class="pi pi-lock"></i>
                  </button>
                  <button
                    *hasPermission="['role:delete', 'role:manage', 'MANAGE_ROLES', '*']"
                    (click)="deleteRole(role)"
                    class="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete Role"
                    >
                    <i class="pi pi-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
          </ng-template>
    
          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="4" class="text-center py-8 text-gray-500">
                No roles defined in database.
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>
    
      <!-- CREATE ROLE MODAL -->
      <p-dialog
        header="Create Role Definition"
        [(visible)]="showCreateModal"
        [modal]="true"
        [style]="{ width: '450px' }"
        >
        <form [formGroup]="createRoleForm" (ngSubmit)="submitCreateRole()" class="space-y-4 pt-2">
          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">Role Name</label>
            <input type="text" pInputText formControlName="name" placeholder="e.g. System Administrator, Billing Manager" class="w-full !bg-white !border-gray-300 !text-gray-900 focus:!border-blue-500 rounded-lg p-2.5" />
          </div>
    
          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="block text-xs font-semibold uppercase tracking-wider text-gray-600">Hierarchy Level (Number)</label>
              @if (!isSuperAdmin) {
                <span class="text-[11px] text-blue-600 font-medium">
                  Max Allowed Level: < {{ currentUserMaxLevel }}
                </span>
              }
            </div>
            <p-inputNumber
              formControlName="level"
              [min]="0"
              [max]="999"
              placeholder="e.g. 10, 50, 100"
              styleClass="w-full"
              inputStyleClass="w-full !bg-white !border-gray-300 !text-gray-900 focus:!border-blue-500 rounded-lg p-2.5"
            ></p-inputNumber>
            @if (levelError) {
              <div class="text-red-500 text-xs mt-1">
                {{ levelError }}
              </div>
            }
          </div>
    
          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">Description</label>
            <input type="text" pInputText formControlName="description" placeholder="Short scope summary" class="w-full !bg-white !border-gray-300 !text-gray-900 focus:!border-blue-500 rounded-lg p-2.5" />
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
            <button type="submit" [disabled]="createRoleForm.invalid || isSaving" class="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg text-sm disabled:opacity-50">
              Save Role
            </button>
          </div>
        </form>
      </p-dialog>
    
      <!-- EDIT ROLE MODAL -->
      <p-dialog
        header="Edit Role Definition"
        [(visible)]="showEditModal"
        [modal]="true"
        [style]="{ width: '450px' }"
        >
        <form [formGroup]="editRoleForm" (ngSubmit)="submitEditRole()" class="space-y-4 pt-2">
          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">Role Name</label>
            <input type="text" pInputText formControlName="name" class="w-full !bg-white !border-gray-300 !text-gray-900 focus:!border-blue-500 rounded-lg p-2.5" />
          </div>
    
          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="block text-xs font-semibold uppercase tracking-wider text-gray-600">Hierarchy Level (Number)</label>
              @if (!isSuperAdmin) {
                <span class="text-[11px] text-blue-600 font-medium">
                  Max Allowed Level: < {{ currentUserMaxLevel }}
                </span>
              }
            </div>
            <p-inputNumber
              formControlName="level"
              [min]="0"
              [max]="999"
              styleClass="w-full"
              inputStyleClass="w-full !bg-white !border-gray-300 !text-gray-900 focus:!border-blue-500 rounded-lg p-2.5"
            ></p-inputNumber>
            @if (levelError) {
              <div class="text-red-500 text-xs mt-1">
                {{ levelError }}
              </div>
            }
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
            <button type="submit" [disabled]="editRoleForm.invalid || isSaving" class="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg text-sm disabled:opacity-50">
              Update Role
            </button>
          </div>
        </form>
      </p-dialog>
    
      <!-- ASSIGN PRIVILEGES MODAL -->
      <p-dialog
        header="Assign Privileges to Role"
        [(visible)]="showAssignPrivilegesModal"
        [modal]="true"
        [style]="{ width: '500px' }"
        >
        @if (selectedRole) {
          <div class="space-y-5 pt-2">
            <div class="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
              <div>
                <div class="text-xs text-gray-500 uppercase tracking-wider">Target Role</div>
                <div class="text-base font-bold text-gray-900">{{ selectedRole.name }}</div>
              </div>
              <span class="px-3 py-1 bg-gray-100 text-cyan-700 border border-gray-200 rounded-lg text-xs font-bold">
                Level {{ selectedRole.level }}
              </span>
            </div>
            <div>
              <label class="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">Select Granted Privileges</label>
              <p-multiSelect
                [options]="allPrivileges"
                [(ngModel)]="selectedPrivilegeIds"
                optionLabel="name"
                optionValue="uid"
                placeholder="Choose Privileges"
                appendTo="body"
                styleClass="w-full !bg-white !border-gray-300"
                >
                <ng-template let-priv pTemplate="item">
                  <div class="flex items-center justify-between w-full">
                    <span>{{ priv.name }}</span>
                    <span class="text-xs font-mono px-2 py-0.5 rounded bg-gray-100 text-emerald-600 border border-gray-200">
                      {{ priv.action }}
                    </span>
                  </div>
                </ng-template>
              </p-multiSelect>
            </div>
            <div class="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button type="button" (click)="showAssignPrivilegesModal = false" class="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm">Cancel</button>
              <button type="button" (click)="submitAssignPrivileges()" [disabled]="isSaving" class="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg text-sm disabled:opacity-50">
                Save Role Privileges
              </button>
            </div>
          </div>
        }
      </p-dialog>
    </div>
    `
})
export class RoleManagementComponent implements OnInit {
  roles: Role[] = [];
  allPrivileges: Privilege[] = [];
  allTenants: any[] = [];

  isLoading = true;
  isSaving = false;
  showCreateModal = false;
  showEditModal = false;
  showAssignPrivilegesModal = false;

  createRoleForm!: FormGroup;
  editRoleForm!: FormGroup;
  selectedRole: Role | null = null;
  selectedPrivilegeIds: string[] = [];

  currentUserMaxLevel = 9999;
  isSuperAdmin = false;
  levelError = '';

  constructor(
    private fb: FormBuilder,
    private roleService: RoleService,
    private privilegeService: PrivilegeService,
    private contextService: ContextService,
    private tenantService: TenantService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.createRoleForm = this.fb.group({
      name: ['', Validators.required],
      level: [50, [Validators.required, Validators.min(0)]],
      description: [''],
      tenantUid: ['']
    });

    this.editRoleForm = this.fb.group({
      name: ['', Validators.required],
      level: [50, [Validators.required, Validators.min(0)]],
      description: [''],
      tenantUid: ['']
    });

    this.currentUserMaxLevel = this.contextService.getMaxRoleLevel();
    this.isSuperAdmin = this.contextService.hasPermission('*');

    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    this.roleService.getRoles().subscribe({
      next: (res) => {
        this.roles = res;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load roles.' });
      }
    });

    this.privilegeService.getPrivileges().subscribe(privs => this.allPrivileges = privs);

    if (this.isSuperAdmin) {
      this.tenantService.getTenants().subscribe(tenants => this.allTenants = tenants);
    }
  }

  openCreateModal(): void {
    this.levelError = '';
    this.createRoleForm.reset({ level: 50 });
    this.showCreateModal = true;
  }

  submitCreateRole(): void {
    this.levelError = '';
    if (this.createRoleForm.invalid) return;

    const requestedLevel = Number(this.createRoleForm.value.level);

    // Enforce level restriction for non-superadmin: role level must be < current user max level
    if (!this.isSuperAdmin && requestedLevel >= this.currentUserMaxLevel) {
      this.levelError = `Non-superadmin users cannot create roles with level >= your current authority level (${this.currentUserMaxLevel}).`;
      return;
    }

    this.isSaving = true;
    this.roleService.createRole(this.createRoleForm.value).subscribe({
      next: () => {
        this.isSaving = false;
        this.showCreateModal = false;
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Role created successfully.' });
        this.loadData();
      },
      error: (err) => {
        this.isSaving = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'Failed to create role.' });
      }
    });
  }

  openEditModal(role: Role): void {
    this.levelError = '';
    this.selectedRole = role;
    this.editRoleForm.patchValue({
      name: role.name,
      level: role.level,
      description: role.description,
      tenantUid: (role as any).tenantUid || ''
    });
    this.showEditModal = true;
  }

  submitEditRole(): void {
    this.levelError = '';
    if (this.editRoleForm.invalid || !this.selectedRole) return;

    const requestedLevel = Number(this.editRoleForm.value.level);

    if (!this.isSuperAdmin && requestedLevel >= this.currentUserMaxLevel) {
      this.levelError = `Non-superadmin users cannot update roles to a level >= your current authority level (${this.currentUserMaxLevel}).`;
      return;
    }

    this.isSaving = true;
    this.roleService.updateRole(this.selectedRole.uid, this.editRoleForm.value).subscribe({
      next: () => {
        this.isSaving = false;
        this.showEditModal = false;
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Role updated successfully.' });
        this.loadData();
      },
      error: (err) => {
        this.isSaving = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'Failed to update role.' });
      }
    });
  }

  openAssignPrivilegesModal(role: Role): void {
    this.selectedRole = role;
    this.selectedPrivilegeIds = role.privileges?.map(p => p.uid) || [];
    this.showAssignPrivilegesModal = true;
  }

  submitAssignPrivileges(): void {
    if (!this.selectedRole) return;

    this.isSaving = true;
    this.roleService.assignPrivilegesToRole(this.selectedRole.uid, this.selectedPrivilegeIds).subscribe({
      next: () => {
        this.isSaving = false;
        this.showAssignPrivilegesModal = false;
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Role privileges updated.' });
        this.loadData();
      },
      error: (err) => {
        this.isSaving = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'Failed to assign privileges.' });
      }
    });
  }

  deleteRole(role: Role): void {
    if (confirm(`Are you sure you want to delete role ${role.name}?`)) {
      this.roleService.deleteRole(role.uid).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Deleted', detail: 'Role deleted.' });
          this.loadData();
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete role.' });
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
