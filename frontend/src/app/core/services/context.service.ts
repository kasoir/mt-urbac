import { Injectable, signal, computed } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Group, Privilege, Role, User } from '../models/mt-urbac.models';

@Injectable({
  providedIn: 'root'
})
export class ContextService {
  private activeGroupSubject = new BehaviorSubject<Group | null>(null);
  public activeGroup$: Observable<Group | null> = this.activeGroupSubject.asObservable();

  private privilegesSubject = new BehaviorSubject<string[]>([]);
  public privileges$: Observable<string[]> = this.privilegesSubject.asObservable();

  private maxRoleLevelSubject = new BehaviorSubject<number>(9999);
  public maxRoleLevel$: Observable<number> = this.maxRoleLevelSubject.asObservable();

  // Angular Signals for modern reactive component bindings
  public activeGroupSignal = signal<Group | null>(null);
  public privilegesSignal = signal<string[]>([]);
  public maxRoleLevelSignal = signal<number>(9999);

  private currentUser: User | null = null;

  constructor() {}

  /**
   * Initialize or update context when user logs in or switches active group
   */
  public setContext(user: User | null, selectedGroup?: Group | null): void {
    this.currentUser = user;
    if (!user) {
      this.clearContext();
      return;
    }

    // Determine available groups
    const availableGroups: Group[] = user.groups || [];

    // Determine active group (prefer selected, then stored, then first available)
    let activeGroup: Group | null = selectedGroup || null;
    if (!activeGroup && availableGroups.length > 0) {
      const savedGroupId = localStorage.getItem('mt_urbac_active_group_id');
      if (savedGroupId) {
        activeGroup = availableGroups.find(g => g.uid === savedGroupId) || availableGroups[0];
      } else {
        activeGroup = availableGroups[0];
      }
    }

    if (activeGroup) {
      localStorage.setItem('mt_urbac_active_group_id', activeGroup.uid);
    }

    this.activeGroupSubject.next(activeGroup);
    this.activeGroupSignal.set(activeGroup);

    // Calculate flattened privileges and max role level
    const privileges = this.calculatePrivileges(user, activeGroup);
    const maxRoleLevel = this.calculateMaxRoleLevel(user, activeGroup);

    this.privilegesSubject.next(privileges);
    this.privilegesSignal.set(privileges);

    this.maxRoleLevelSubject.next(maxRoleLevel);
    this.maxRoleLevelSignal.set(maxRoleLevel);
  }

  /**
   * Switch active group context dynamically
   */
  public setActiveGroup(group: Group | null): void {
    if (this.currentUser) {
      this.setContext(this.currentUser, group);
    }
  }

  /**
   * Check if action is contained in current active context privileges or user is superadmin
   */
  public hasPermission(action: string): boolean {
    if (this.currentUser?.isSuperAdmin) {
      return true;
    }
    const currentPrivileges = this.privilegesSignal();
    if (currentPrivileges.includes('*') || currentPrivileges.includes('ALL')) {
      return true;
    }
    return currentPrivileges.includes(action);
  }

  /**
   * Get active group
   */
  public getActiveGroup(): Group | null {
    return this.activeGroupSignal();
  }

  /**
   * Get flattened privileges array
   */
  public getPrivileges(): string[] {
    return this.privilegesSignal();
  }

  /**
   * Get max role level of current user in current context
   */
  public getMaxRoleLevel(): number {
    return this.maxRoleLevelSignal();
  }

  /**
   * Clear all active context
   */
  public clearContext(): void {
    this.currentUser = null;
    this.activeGroupSubject.next(null);
    this.activeGroupSignal.set(null);
    this.privilegesSubject.next([]);
    this.privilegesSignal.set([]);
    this.maxRoleLevelSubject.next(9999);
    this.maxRoleLevelSignal.set(9999);
    localStorage.removeItem('mt_urbac_active_group_id');
  }

  /**
   * Helper: Flatten privileges from user roles and active group roles
   */
  private calculatePrivileges(user: User, activeGroup: Group | null): string[] {
    if (user.isSuperAdmin) {
      return ['*'];
    }

    const actionSet = new Set<string>();

    // 1. Direct user roles privileges
    if (user.roles) {
      user.roles.forEach(role => {
        role.privileges?.forEach(priv => actionSet.add(priv.action));
      });
    }

    // 2. Group roles privileges
    if (activeGroup && activeGroup.roles) {
      activeGroup.roles.forEach(role => {
        role.privileges?.forEach(priv => actionSet.add(priv.action));
      });
    }

    // 3. User Group Role links if present
    if (user.userGroupRoles) {
      user.userGroupRoles.forEach(ugr => {
        if (!activeGroup || ugr.groupUid === activeGroup.uid) {
          ugr.roles.forEach(role => {
            role.privileges?.forEach(priv => actionSet.add(priv.action));
          });
        }
      });
    }

    return Array.from(actionSet);
  }

  /**
   * Helper: Calculate highest authority role level (e.g. lowest level number = highest privilege, or highest level number)
   * Note: In MT-URBAC systems, lower level number often denotes higher authority (Level 1 > Level 10).
   * SuperAdmin level = 100.
   */
  private calculateMaxRoleLevel(user: User, activeGroup: Group | null): number {
    if (user.isSuperAdmin) {
      return 100; // Highest authority
    }

    let minLevel = 9999;

    const checkRoles = (roles?: Role[]) => {
      roles?.forEach(role => {
        if (role.level !== undefined && role.level < minLevel) {
          minLevel = role.level;
        }
      });
    };

    // Always consider roles from all groups the user belongs to
    // to determine their absolute max level threshold for creating/assigning
    if (user.groups) {
      user.groups.forEach(group => {
        checkRoles(group.roles);
      });
    }

    // Direct roles and user-group roles
    checkRoles(user.roles);
    if (user.userGroupRoles) {
      user.userGroupRoles.forEach(ugr => {
        checkRoles(ugr.roles);
      });
    }

    return minLevel === 9999 ? 0 : minLevel;
  }
}
