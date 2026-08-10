export interface Privilege {
  uid: string;
  name: string;
  action: string;
  resource?: string;
  description?: string;
  tenantUid?: string;
  createdAt?: string;
}

export interface Role {
  uid: string;
  name: string;
  level: number;
  description?: string;
  privileges?: Privilege[];
  tenantUid?: string;
  createdAt?: string;
}

export interface Group {
  uid: string;
  name: string;
  description?: string;
  roles?: Role[];
  tenantUid?: string;
  createdAt?: string;
}

export interface UserGroupRoleLink {
  groupUid: string;
  groupName: string;
  roles: Role[];
}

export interface User {
  uid: string;
  username: string;
  email: string;
  isSuperAdmin: boolean;
  maxRoleLevel?: number;
  groups?: Group[];
  userGroupRoles?: UserGroupRoleLink[];
  roles?: Role[]; // direct user roles if applicable
  tenantUid?: string;
  createdAt?: string;
}

export interface LoginDto {
  username?: string;
  email?: string;
  password: string;
}

export interface SignupDto {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken?: string;
  access_token?: string;
  user: User;
}

export interface SignupStatusResponse {
  allowed: boolean;
  message?: string;
}
