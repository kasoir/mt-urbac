import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Role } from './role.entity';
import { Privilege } from './privilege.entity';

@Entity('role_privileges')
@Unique(['roleUid', 'privilegeUid'])
export class RolePrivilege {
  @PrimaryGeneratedColumn('uuid')
  uid: string;

  @Column('uuid')
  roleUid: string;

  @Column('uuid')
  privilegeUid: string;

  @ManyToOne(() => Role, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'roleUid' })
  role: Role;

  @ManyToOne(() => Privilege, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'privilegeUid' })
  privilege: Privilege;
}
