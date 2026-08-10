import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface UserPayload {
  userUid: string;
  email: string;
  name: string | null;
  groupUids: number[];
  privileges: string[];
  roles: { uid: string; name: string; level: number }[];
  maxRoleLevel: number;
  tenantUid: string | null;
  isSuperAdmin: boolean;
}

export const CurrentUser = createParamDecorator(
  (data: keyof UserPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    return data ? user?.[data] : user;
  },
);

