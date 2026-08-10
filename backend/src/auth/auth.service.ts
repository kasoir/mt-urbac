import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { Group } from '../entities/group.entity';
import { Role } from '../entities/role.entity';
import { RolePrivilege } from '../entities/role-privilege.entity';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Group)
    private groupRepository: Repository<Group>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(RolePrivilege)
    private rolePrivilegeRepository: Repository<RolePrivilege>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  getPublicConfig() {
    const allowPublicSignupRaw = this.configService.get<string>('ALLOW_PUBLIC_SIGNUP');
    const allowPublicSignup =
      allowPublicSignupRaw === 'true' || allowPublicSignupRaw === '1' || allowPublicSignupRaw === true as any;
    return { allowPublicSignup };
  }

  async buildUserPayload(user: User) {
    const userWithGroups = await this.userRepository.findOne({
      where: { uid: user.uid },
      relations: ['groups', 'groups.roles'],
    });

    const fullGroups = userWithGroups?.groups || [];
    
    // We still want to extract the global roles and privileges arrays for the top-level payload 
    // to maintain backward compatibility with any other frontend features expecting them.
    const roleMap = new Map<string, any>();
    
    if (fullGroups) {
      for (const group of fullGroups) {
        if (group.roles) {
          for (const role of group.roles) {
            roleMap.set(role.uid, role);
          }
        }
      }
    }
    
    const roles = Array.from(roleMap.values());
    const roleUids = roles.map((r) => r.uid);

    let privileges: string[] = [];
    if (roleUids.length > 0) {
      const rolePrivileges = await this.rolePrivilegeRepository.find({
        where: { roleUid: In(roleUids) },
        relations: ['privilege'],
      });

      // Manually attach privileges to roles so the frontend can properly calculate them per group context
      for (const role of roles) {
        role.privileges = rolePrivileges
          .filter(rp => rp.roleUid === role.uid && rp.privilege)
          .map(rp => rp.privilege);
      }

      const privActions = rolePrivileges
        .filter((rp) => rp.privilege)
        .map((rp) => rp.privilege.action);
      privileges = Array.from(new Set(privActions));
    }

    const isSuperAdmin = roles.some(r => r.level >= 100);

    return {
      userUid: user.uid,
      email: user.email,
      name: user.name,
      groups: fullGroups,
      privileges,
      roles,
      isSuperAdmin,
      tenantUid: user.tenantUid,
    };
  }

  async login(loginDto: LoginDto, tenantUid: string | null) {
    const identifier = (loginDto.email || loginDto.username || '').trim().toLowerCase();
    if (!identifier) {
      throw new UnauthorizedException('Email or username is required');
    }

    const user = await this.userRepository.findOne({
      where: [
        { email: identifier, tenantUid: tenantUid || null },
        { name: identifier, tenantUid: tenantUid || null },
      ],
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = await this.buildUserPayload(user);
    const token = this.jwtService.sign(payload);

    return {
      accessToken: token,
      access_token: token,
      user: payload,
    };
  }

  async signup(signupDto: SignupDto, tenantUid: string | null) {
    const { allowPublicSignup } = this.getPublicConfig();
    if (!allowPublicSignup) {
      throw new ForbiddenException('Public signup is currently disabled');
    }

    const existingUser = await this.userRepository.findOne({
      where: { email: signupDto.email.toLowerCase(), tenantUid: tenantUid || null },
    });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const passwordHash = await bcrypt.hash(signupDto.password, 10);
    const newUser = this.userRepository.create({
      email: signupDto.email.toLowerCase(),
      name: signupDto.name || null,
      passwordHash,
      tenantUid: tenantUid || null,
    });
    await this.userRepository.save(newUser);

    // Auto assign to "Users" group with "Standard User" role
    let usersGroup = await this.groupRepository.findOne({ where: { name: 'Users', tenantUid: tenantUid || null } });
    if (!usersGroup) {
      usersGroup = await this.groupRepository.save(
        this.groupRepository.create({ name: 'Users', description: 'Standard Users Group', tenantUid: tenantUid || null }),
      );
    }

    let standardRole = await this.roleRepository.findOne({ where: { name: 'Standard User', tenantUid: tenantUid || null } });
    if (!standardRole) {
      standardRole = await this.roleRepository.save(
        this.roleRepository.create({ name: 'Standard User', level: 10, tenantUid: tenantUid || null }),
      );
    }
    
    // Ensure Users group has Standard User role
    if (!usersGroup.roles) {
      const g = await this.groupRepository.findOne({ where: { uid: usersGroup.uid }, relations: ['roles'] });
      usersGroup.roles = g?.roles || [];
    }
    if (!usersGroup.roles.some(r => r.uid === standardRole!.uid)) {
      usersGroup.roles.push(standardRole);
      await this.groupRepository.save(usersGroup);
    }

    // Auto assign to Users group
    newUser.groups = [usersGroup];
    await this.userRepository.save(newUser);

    const payload = await this.buildUserPayload(newUser);
    const token = this.jwtService.sign(payload);

    return {
      access_token: token,
      user: payload,
    };
  }

  async getFreshProfile(userUid: string) {
    const user = await this.userRepository.findOne({ where: { uid: userUid } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return this.buildUserPayload(user);
  }
}

