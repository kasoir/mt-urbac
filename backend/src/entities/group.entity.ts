import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Role } from './role.entity';
import { User } from './user.entity';
import { Tenant } from './tenant.entity';

@Entity('groups')
@Index('unique_tenant_group_name_idx', ['name', 'tenantUid'], { unique: true })
export class Group {
  @PrimaryGeneratedColumn('uuid')
  uid: string;

  @Column()
  name: string;

  @Column({ type: 'uuid', nullable: true })
  tenantUid: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantUid' })
  tenant: Tenant;

  @Column({ nullable: true })
  description: string;

  @ManyToMany(() => Role)
  @JoinTable({ name: 'group_roles' })
  roles: Role[];

  @ManyToMany(() => User, user => user.groups)
  users: User[];
}
