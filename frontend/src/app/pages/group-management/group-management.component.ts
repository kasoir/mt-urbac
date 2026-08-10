import { Component, OnInit } from '@angular/core';

import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { GroupService } from '../../core/services/group.service';
import { RoleService } from '../../core/services/role.service';
import { ContextService } from '../../core/services/context.service';
import { TenantService } from '../../core/services/tenant.service';
import { Group, Role } from '../../core/models/mt-urbac.models';
import { HasPermissionDirective } from '../../core/directives/has-permission.directive';

// @openng/optimus-ui Imports
import { TableModule } from '@openng/optimus-ui/table';
import { DialogModule } from '@openng/optimus-ui/dialog';
import { MultiSelectModule } from '@openng/optimus-ui/multiselect';
import { InputTextModule } from '@openng/optimus-ui/inputtext';
import { TextareaModule } from '@openng/optimus-ui/textarea';
import { ButtonModule } from '@openng/optimus-ui/button';
import { ToastModule } from '@openng/optimus-ui/toast';
import { MessageService } from '@openng/optimus-ui/api';

@Component({
    selector: 'app-group-management',
    imports: [
    FormsModule,
    ReactiveFormsModule,
    TableModule,
    DialogModule,
    MultiSelectModule,
    InputTextModule,
    TextareaModule,
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
          <h2 class="text-2xl font-bold text-gray-900 tracking-tight">Group Management</h2>
          <p class="text-gray-500 text-sm mt-0.5">Define organization groups and assign group-level security roles.</p>
        </div>
    
        <button
          *hasPermission="['group:create', 'group:manage', 'MANAGE_GROUPS', '*']"
          (click)="openCreateModal()"
          class="py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl shadow-sm flex items-center gap-2 text-sm transition-all cursor-pointer w-fit"
          >
          <i class="pi pi-plus"></i>
          <span>Create New Group</span>
        </button>
      </div>
    
      <!-- Groups Table -->
      <div class="bg-white rounded-2xl p-4 border border-gray-200 overflow-hidden shadow-sm">
        <p-table
          [value]="groups"
          [loading]="isLoading"
          [paginator]="true"
          [rows]="8"
          responsiveLayout="scroll"
          styleClass="p-datatable-sm"
          >
          <ng-template pTemplate="header">
            <tr>
              <th>Group Name</th>
              <th>Tenant</th>
              <th>Description</th>
              <th>Assigned Group Roles</th>
              <th class="text-right">Actions</th>
            </tr>
          </ng-template>
    
          <ng-template pTemplate="body" let-group>
            <tr>
              <td>
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center font-bold text-blue-600 text-sm">
                    <i class="pi pi-folder"></i>
                  </div>
                  <span class="font-semibold text-gray-900 text-sm">{{ group.name }}</span>
                </div>
              </td>
              <td>
                <span class="text-xs text-gray-600">{{ getTenantName(group.tenantUid) }}</span>
              </td>
              <td class="text-gray-500 text-sm">
                {{ group.description || 'No description provided' }}
              </td>
              <td>
                <div class="flex flex-wrap gap-1">
                  @for (role of group.roles; track role) {
                    <span class="px-2 py-0.5 text-[11px] bg-cyan-50 text-cyan-700 border border-cyan-200 rounded">
                      {{ role.name }} (Lvl {{ role.level }})
                    </span>
                  }
                  @if (!group.roles || group.roles.length === 0) {
                    <span class="text-xs text-gray-400 italic">No roles attached</span>
                  }
                </div>
              </td>
              <td class="text-right">
                <div class="flex items-center justify-end gap-2">
                  <button
                    *hasPermission="['group:update', 'group:manage', 'MANAGE_GROUPS', '*']"
                    (click)="openEditModal(group)"
                    class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit Group"
                    >
                    <i class="pi pi-pencil"></i>
                  </button>
                  <button
                    *hasPermission="['group:assign', 'group:manage', 'MANAGE_GROUPS', '*']"
                    (click)="openAssignRolesModal(group)"
                    class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Assign Group Roles"
                    >
                    <i class="pi pi-key"></i>
                  </button>
                  <button
                    *hasPermission="['group:delete', 'group:manage', 'MANAGE_GROUPS', '*']"
                    (click)="deleteGroup(group)"
                    class="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete Group"
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
                No groups defined yet.
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>
    
      <!-- CREATE GROUP MODAL -->
      <p-dialog
        header="Create Organization Group"
        [(visible)]="showCreateModal"
        [modal]="true"
        [style]="{ width: '450px' }"
        >
        <form [formGroup]="createGroupForm" (ngSubmit)="submitCreateGroup()" class="space-y-4 pt-2">
          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">Group Name</label>
            <input type="text" pInputText formControlName="name" placeholder="e.g. Engineering, Sales, DevOps" class="w-full !bg-white !border-gray-300 !text-gray-900 focus:!border-blue-500 rounded-lg p-2.5" />
          </div>
    
          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">Description</label>
            <textarea pInputTextarea formControlName="description" rows="3" placeholder="Brief summary of group scope..." class="w-full !bg-white !border-gray-300 !text-gray-900 focus:!border-blue-500 rounded-lg p-2.5"></textarea>
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
            <button type="submit" [disabled]="createGroupForm.invalid || isSaving" class="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg text-sm disabled:opacity-50">
              Save Group
            </button>
          </div>
        </form>
      </p-dialog>
    
      <!-- EDIT GROUP MODAL -->
      <p-dialog
        header="Edit Organization Group"
        [(visible)]="showEditModal"
        [modal]="true"
        [style]="{ width: '450px' }"
        >
        <form [formGroup]="editGroupForm" (ngSubmit)="submitEditGroup()" class="space-y-4 pt-2">
          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">Group Name</label>
            <input type="text" pInputText formControlName="name" class="w-full !bg-white !border-gray-300 !text-gray-900 focus:!border-blue-500 rounded-lg p-2.5" />
          </div>
    
          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">Description</label>
            <textarea pInputTextarea formControlName="description" rows="3" class="w-full !bg-white !border-gray-300 !text-gray-900 focus:!border-blue-500 rounded-lg p-2.5"></textarea>
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
            <button type="submit" [disabled]="editGroupForm.invalid || isSaving" class="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg text-sm disabled:opacity-50">
              Update Group
            </button>
          </div>
        </form>
      </p-dialog>
    
      <!-- ASSIGN ROLES TO GROUP MODAL -->
      <p-dialog
        header="Assign Roles to Group"
        [(visible)]="showAssignRolesModal"
        [modal]="true"
        [style]="{ width: '500px' }"
        >
        @if (selectedGroup) {
          <div class="space-y-5 pt-2">
            <div class="p-3 bg-gray-50 rounded-xl border border-gray-200">
              <div class="text-xs text-gray-500 uppercase tracking-wider">Target Group</div>
              <div class="text-base font-bold text-gray-900">{{ selectedGroup.name }}</div>
            </div>
            <div>
              <div class="flex items-center justify-between mb-1">
                <label class="block text-xs font-semibold uppercase tracking-wider text-gray-600">
                  Select Roles for Group
                </label>
                <span class="text-[11px] text-blue-600 font-medium">
                  Filtered by Max Level Authority (< {{ currentUserMaxLevel }})
                </span>
              </div>
              <p-multiSelect
                [options]="filteredRoles"
                [(ngModel)]="selectedRoleIds"
                optionLabel="name"
                optionValue="uid"
                placeholder="Choose Roles"
                appendTo="body"
                styleClass="w-full !bg-white !border-gray-300"
                >
                <ng-template let-role pTemplate="item">
                  <div class="flex items-center justify-between w-full">
                    <span>{{ role.name }}</span>
                    <span class="text-xs px-2 py-0.5 rounded bg-gray-100 text-cyan-700 border border-gray-200">
                      Level {{ role.level }}
                    </span>
                  </div>
                </ng-template>
              </p-multiSelect>
            </div>
            <div class="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button type="button" (click)="showAssignRolesModal = false" class="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm">Cancel</button>
              <button type="button" (click)="submitAssignRoles()" [disabled]="isSaving" class="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg text-sm disabled:opacity-50">
                Apply Group Roles
              </button>
            </div>
          </div>
        }
      </p-dialog>
    </div>
    `
})
export class GroupManagementComponent implements OnInit {
  groups: Group[] = [];
  allRoles: Role[] = [];
  filteredRoles: Role[] = [];
  allTenants: any[] = [];

  isLoading = true;
  isSaving = false;
  showCreateModal = false;
  showEditModal = false;
  showAssignRolesModal = false;

  createGroupForm!: FormGroup;
  editGroupForm!: FormGroup;
  selectedGroup: Group | null = null;
  selectedRoleIds: string[] = [];

  currentUserMaxLevel = 9999;
  isSuperAdmin = false;

  constructor(
    private fb: FormBuilder,
    private groupService: GroupService,
    private roleService: RoleService,
    private contextService: ContextService,
    private tenantService: TenantService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.createGroupForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      tenantUid: ['']
    });

    this.editGroupForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      tenantUid: ['']
    });

    this.currentUserMaxLevel = this.contextService.getMaxRoleLevel();
    this.isSuperAdmin = this.contextService.hasPermission('*');

    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    this.groupService.getGroups().subscribe({
      next: (res) => {
        this.groups = res;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load groups.' });
      }
    });

    this.roleService.getRoles().subscribe(roles => {
      this.allRoles = roles;
      if (this.isSuperAdmin) {
        this.filteredRoles = roles;
      } else {
        this.filteredRoles = roles.filter(r => r.level < this.currentUserMaxLevel);
      }
    });

    if (this.isSuperAdmin) {
      this.tenantService.getTenants().subscribe(tenants => this.allTenants = tenants);
    }
  }

  openCreateModal(): void {
    this.createGroupForm.reset();
    this.showCreateModal = true;
  }

  submitCreateGroup(): void {
    if (this.createGroupForm.invalid) return;

    this.isSaving = true;
    this.groupService.createGroup(this.createGroupForm.value).subscribe({
      next: () => {
        this.isSaving = false;
        this.showCreateModal = false;
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Group created successfully.' });
        this.loadData();
      },
      error: (err) => {
        this.isSaving = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'Failed to create group.' });
      }
    });
  }

  openEditModal(group: Group): void {
    this.selectedGroup = group;
    this.editGroupForm.patchValue({
      name: group.name,
      description: group.description,
      tenantUid: (group as any).tenantUid || ''
    });
    this.showEditModal = true;
  }

  submitEditGroup(): void {
    if (this.editGroupForm.invalid || !this.selectedGroup) return;

    this.isSaving = true;
    this.groupService.updateGroup(this.selectedGroup.uid, this.editGroupForm.value).subscribe({
      next: () => {
        this.isSaving = false;
        this.showEditModal = false;
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Group updated successfully.' });
        this.loadData();
      },
      error: (err) => {
        this.isSaving = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'Failed to update group.' });
      }
    });
  }

  openAssignRolesModal(group: Group): void {
    this.selectedGroup = group;
    this.selectedRoleIds = group.roles?.map(r => r.uid) || [];

    if (this.isSuperAdmin) {
      this.filteredRoles = this.allRoles;
    } else {
      this.filteredRoles = this.allRoles.filter(r => r.level < this.currentUserMaxLevel);
    }

    this.showAssignRolesModal = true;
  }

  submitAssignRoles(): void {
    if (!this.selectedGroup) return;

    this.isSaving = true;
    this.groupService.assignRolesToGroup(this.selectedGroup.uid, this.selectedRoleIds).subscribe({
      next: () => {
        this.isSaving = false;
        this.showAssignRolesModal = false;
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Roles assigned to group.' });
        this.loadData();
      },
      error: (err) => {
        this.isSaving = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'Failed to assign roles.' });
      }
    });
  }

  deleteGroup(group: Group): void {
    if (confirm(`Are you sure you want to delete group ${group.name}?`)) {
      this.groupService.deleteGroup(group.uid).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Deleted', detail: 'Group deleted.' });
          this.loadData();
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete group.' });
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
