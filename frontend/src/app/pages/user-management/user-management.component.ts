import { Component, OnInit } from '@angular/core';

import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserService } from '../../core/services/user.service';
import { GroupService } from '../../core/services/group.service';
import { RoleService } from '../../core/services/role.service';
import { ContextService } from '../../core/services/context.service';
import { TenantService } from '../../core/services/tenant.service';
import { Group, Role, User } from '../../core/models/mt-urbac.models';
import { HasPermissionDirective } from '../../core/directives/has-permission.directive';

// @openng/optimus-ui Imports
import { TableModule } from '@openng/optimus-ui/table';
import { DialogModule } from '@openng/optimus-ui/dialog';
import { SelectModule } from '@openng/optimus-ui/select';
import { MultiSelectModule } from '@openng/optimus-ui/multiselect';
import { InputTextModule } from '@openng/optimus-ui/inputtext';
import { ButtonModule } from '@openng/optimus-ui/button';
import { ToastModule } from '@openng/optimus-ui/toast';
import { TagModule } from '@openng/optimus-ui/tag';
import { MessageService } from '@openng/optimus-ui/api';

@Component({
    selector: 'app-user-management',
    imports: [
    FormsModule,
    ReactiveFormsModule,
    TableModule,
    DialogModule,
    SelectModule,
    MultiSelectModule,
    InputTextModule,
    ButtonModule,
    ToastModule,
    TagModule,
    HasPermissionDirective
],
    providers: [MessageService],
    template: `
    <div class="space-y-6">
      <p-toast></p-toast>
    
      <!-- Header Section -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 class="text-2xl font-bold text-gray-900 tracking-tight">User Directory</h2>
          <p class="text-gray-500 text-sm mt-0.5">Manage enterprise accounts, group context associations, and roles.</p>
        </div>
    
        <button
          *hasPermission="['user:create', 'user:manage', 'MANAGE_USERS', '*']"
          (click)="openCreateModal()"
          class="py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl shadow-sm flex items-center gap-2 text-sm transition-all cursor-pointer w-fit"
          >
          <i class="pi pi-user-plus"></i>
          <span>Create New User</span>
        </button>
      </div>
    
      <!-- Users Datatable -->
      <div class="bg-white rounded-2xl p-4 border border-gray-200 overflow-hidden shadow-sm">
        <p-table
          [value]="users"
          [loading]="isLoading"
          [paginator]="true"
          [rows]="8"
          responsiveLayout="scroll"
          styleClass="p-datatable-sm"
          >
          <ng-template pTemplate="header">
            <tr>
              <th>User Details</th>
              <th>Tenant</th>
              <th>Groups</th>
              <th>Roles</th>
              <th class="text-right">Actions</th>
            </tr>
          </ng-template>
    
          <ng-template pTemplate="body" let-user>
            <tr>
              <td>
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center font-bold text-blue-600 text-sm">
                    {{ getDisplayName(user).charAt(0).toUpperCase() }}
                  </div>
                  <div>
                    <div class="font-semibold text-gray-900 text-sm">{{ getDisplayName(user) }}</div>
                    <div class="text-xs text-gray-500">{{ user.email }}</div>
                  </div>
                </div>
              </td>
              <td>
                <span class="text-xs text-gray-600">{{ getTenantName(user.tenantUid) }}</span>
              </td>
              <td>
                <div class="flex flex-wrap gap-1">
                  @for (g of user.groups; track g) {
                    <span class="px-2 py-0.5 text-[11px] bg-blue-50 text-blue-700 border border-blue-200 rounded">
                      {{ g.name }}
                    </span>
                  }
                  @if (!user.groups || user.groups.length === 0) {
                    <span class="text-xs text-gray-400 italic">No groups</span>
                  }
                </div>
              </td>
              <td>
                <div class="flex flex-wrap gap-1">
                  @for (r of user.roles; track r) {
                    <span class="px-2 py-0.5 text-[11px] bg-cyan-50 text-cyan-700 border border-cyan-200 rounded">
                      {{ r.name }} (Lvl {{ r.level }})
                    </span>
                  }
                  @if (!user.roles || user.roles.length === 0) {
                    <span class="text-xs text-gray-400 italic">No direct roles</span>
                  }
                </div>
              </td>
              <td class="text-right">
                <div class="flex items-center justify-end gap-2">
                  <button
                    *hasPermission="['user:update', 'user:manage', 'MANAGE_USERS', '*']"
                    (click)="openEditModal(user)"
                    class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit User"
                    >
                    <i class="pi pi-pencil"></i>
                  </button>
                  <button
                    *hasPermission="['user:assign', 'user:manage', 'MANAGE_USERS', '*']"
                    (click)="openAssignModal(user)"
                    class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Assign Groups"
                    >
                    <i class="pi pi-[cog] pi-sliders-h"></i>
                  </button>
                  <button
                    *hasPermission="['user:delete', 'user:manage', 'MANAGE_USERS', '*']"
                    (click)="deleteUser(user)"
                    class="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete User"
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
                No users found in database.
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>
    
      <!-- CREATE USER MODAL -->
      <p-dialog
        header="Create New Enterprise User"
        [(visible)]="showCreateModal"
        [modal]="true"
        [style]="{ width: '450px' }"
        >
        <form [formGroup]="createUserForm" (ngSubmit)="submitCreateUser()" class="space-y-4 pt-2">
          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">Name</label>
            <input type="text" pInputText formControlName="username" class="w-full !bg-white !border-gray-300 !text-gray-900 focus:!border-blue-500 rounded-lg p-2.5" />
          </div>
    
          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">Email Address</label>
            <input type="email" pInputText formControlName="email" class="w-full !bg-white !border-gray-300 !text-gray-900 focus:!border-blue-500 rounded-lg p-2.5" />
          </div>
    
          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">Password</label>
            <input type="password" pInputText formControlName="password" class="w-full !bg-white !border-gray-300 !text-gray-900 focus:!border-blue-500 rounded-lg p-2.5" />
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

          <div class="flex items-center gap-2 pt-2">
            <input type="checkbox" id="isSuperAdmin" formControlName="isSuperAdmin" class="rounded bg-white border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4" />
            <label for="isSuperAdmin" class="text-sm font-medium text-gray-700">Grant SuperAdmin Privilege</label>
          </div>
    
          <div class="flex justify-end gap-3 pt-4 border-t border-gray-200 mt-4">
            <button type="button" (click)="showCreateModal = false" class="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm">Cancel</button>
            <button type="submit" [disabled]="createUserForm.invalid || isSaving" class="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg text-sm disabled:opacity-50">
              Create User
            </button>
          </div>
        </form>
      </p-dialog>
    
      <!-- EDIT USER MODAL -->
      <p-dialog
        header="Edit User Details"
        [(visible)]="showEditModal"
        [modal]="true"
        [style]="{ width: '450px' }"
        >
        <form [formGroup]="editUserForm" (ngSubmit)="submitEditUser()" class="space-y-4 pt-2">
          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">Name</label>
            <input type="text" pInputText formControlName="name" class="w-full !bg-white !border-gray-300 !text-gray-900 focus:!border-blue-500 rounded-lg p-2.5" />
          </div>
    
          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">Email Address</label>
            <input type="email" pInputText formControlName="email" class="w-full !bg-white !border-gray-300 !text-gray-900 focus:!border-blue-500 rounded-lg p-2.5" />
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
            <button type="submit" [disabled]="editUserForm.invalid || isSaving" class="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg text-sm disabled:opacity-50">
              Update User
            </button>
          </div>
        </form>
      </p-dialog>
    
      <!-- ASSIGN GROUPS MODAL -->
      <p-dialog
        header="Assign Groups"
        [(visible)]="showAssignModal"
        [modal]="true"
        [style]="{ width: '500px' }"
        >
        @if (selectedUser) {
          <div class="space-y-5 pt-2">
            <div class="p-3 bg-gray-50 rounded-xl border border-gray-200">
              <div class="text-xs text-gray-500 uppercase tracking-wider">Target User</div>
              <div class="text-base font-bold text-gray-900">{{ getDisplayName(selectedUser) }} ({{ selectedUser.email }})</div>
            </div>
            <div>
              <label class="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">Target Groups</label>
              <p-multiSelect
                [options]="allGroups"
                [(ngModel)]="assignTargetGroupIds"
                optionLabel="name"
                optionValue="uid"
                placeholder="Select Groups"
                appendTo="body"
                styleClass="w-full !bg-white !border-gray-300"
              ></p-multiSelect>
            </div>
            <div class="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button type="button" (click)="showAssignModal = false" class="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm">Cancel</button>
              <button type="button" (click)="submitAssignGroups()" [disabled]="isSaving" class="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg text-sm disabled:opacity-50">
                Save Assignments
              </button>
            </div>
          </div>
        }
      </p-dialog>
    </div>
    `
})
export class UserManagementComponent implements OnInit {
  users: User[] = [];
  allGroups: Group[] = [];
  allRoles: Role[] = [];
  filteredRoles: Role[] = [];
  allTenants: any[] = [];

  isLoading = true;
  isSaving = false;
  showCreateModal = false;
  showEditModal = false;
  showAssignModal = false;

  createUserForm!: FormGroup;
  editUserForm!: FormGroup;
  selectedUser: User | null = null;
  assignTargetGroupIds: string[] = [];

  currentUserMaxLevel = 9999;
  isSuperAdmin = false;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private groupService: GroupService,
    private contextService: ContextService,
    private tenantService: TenantService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.createUserForm = this.fb.group({
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      isSuperAdmin: [false],
      tenantUid: ['']
    });

    this.editUserForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      tenantUid: ['']
    });

    this.currentUserMaxLevel = this.contextService.getMaxRoleLevel();
    const currentUser = this.contextService['currentUser'];
    this.isSuperAdmin = this.contextService.hasPermission('*');

    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    this.userService.getUsers().subscribe({
      next: (res) => {
        this.users = res;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load users.' });
      }
    });

    this.groupService.getGroups().subscribe(groups => this.allGroups = groups);
    if (this.isSuperAdmin) {
      this.tenantService.getTenants().subscribe(tenants => this.allTenants = tenants);
    }
  }

  openCreateModal(): void {
    this.createUserForm.reset({ isSuperAdmin: false });
    this.showCreateModal = true;
  }

  submitCreateUser(): void {
    if (this.createUserForm.invalid) return;

    this.isSaving = true;
    this.userService.createUser(this.createUserForm.value).subscribe({
      next: () => {
        this.isSaving = false;
        this.showCreateModal = false;
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'User created successfully.' });
        this.loadData();
      },
      error: (err) => {
        this.isSaving = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'Failed to create user.' });
      }
    });
  }

  openEditModal(user: User): void {
    this.selectedUser = user;
    this.editUserForm.patchValue({
      name: this.getDisplayName(user),
      email: user.email,
      tenantUid: user.tenantUid || ''
    });
    this.showEditModal = true;
  }

  submitEditUser(): void {
    if (this.editUserForm.invalid || !this.selectedUser) return;

    this.isSaving = true;
    this.userService.updateUser(this.selectedUser.uid, this.editUserForm.value).subscribe({
      next: () => {
        this.isSaving = false;
        this.showEditModal = false;
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'User updated successfully.' });
        this.loadData();
      },
      error: (err) => {
        this.isSaving = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'Failed to update user.' });
      }
    });
  }

  openAssignModal(user: User): void {
    this.selectedUser = user;
    this.assignTargetGroupIds = user.groups?.map(g => g.uid) || [];
    this.showAssignModal = true;
  }

  submitAssignGroups(): void {
    if (!this.selectedUser) return;

    this.isSaving = true;
    this.userService.assignGroups(this.selectedUser.uid, {
      groupUids: this.assignTargetGroupIds
    }).subscribe({
      next: () => {
        this.isSaving = false;
        this.showAssignModal = false;
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'User group assignments updated.' });
        this.loadData();
      },
      error: (err) => {
        this.isSaving = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'Failed to update assignments.' });
      }
    });
  }

  deleteUser(user: User): void {
    const displayName = this.getDisplayName(user);
    if (confirm(`Are you sure you want to delete user ${displayName}?`)) {
      this.userService.deleteUser(user.uid).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Deleted', detail: 'User removed.' });
          this.loadData();
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete user.' });
        }
      });
    }
  }

  getDisplayName(user: User): string {
    if (!user) return '?';
    const name = user.username || (user as any).name;
    if (name) return name;
    if (user.email) return user.email.split('@')[0];
    return '?';
  }

  getTenantName(uid?: string): string {
    if (!uid) return 'System / No Tenant';
    const t = this.allTenants.find(x => x.uid === uid);
    return t ? t.name : uid;
  }
}
