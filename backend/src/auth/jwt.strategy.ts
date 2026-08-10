import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

export interface JwtPayload {
  userUid: string;
  email: string;
  name: string | null;
  groupUids: number[];
  privileges: string[];
  roles: { uid: string; name: string; level: number }[];
  isSuperAdmin?: boolean;
  tenantUid?: string | null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'urbac_super_secret_jwt_key_2026',
    });
  }

  async validate(payload: JwtPayload) {
    if (!payload || !payload.userUid) {
      throw new UnauthorizedException('Invalid token payload');
    }

    const roles = payload.roles || [];
    const maxRoleLevel = roles.length > 0 ? Math.max(...roles.map((r) => r.level)) : 0;

    return {
      userUid: payload.userUid,
      email: payload.email,
      name: payload.name,
      groupUids: payload.groupUids || [],
      privileges: payload.privileges || [],
      roles: roles,
      maxRoleLevel,
      isSuperAdmin: (payload as any).isSuperAdmin || false,
      tenantUid: (payload as any).tenantUid || null,
    };
  }
}

