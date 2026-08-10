import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
  ManyToOne,
  JoinColumn,
  Index
} from 'typeorm';
import { Group } from './group.entity';
import { Tenant } from './tenant.entity';

@Entity('users')
@Index('unique_tenant_email_idx', ['email', 'tenantUid'], { unique: true, where: '"tenantUid" IS NOT NULL' })
@Index('unique_global_admin_idx', ['email'], { unique: true, where: '"isSuperAdmin" = true' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  uid: string;

  @Column({ nullable: true })
  name: string;

  @Column()
  email: string;

  @Column()
  passwordHash: string;

  @Column({ default: false })
  isSuperAdmin: boolean;

  @Column({ type: 'uuid', nullable: true })
  tenantUid: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantUid' })
  tenant: Tenant;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToMany(() => Group, group => group.users)
  @JoinTable({ name: 'user_groups' })
  groups: Group[];
}
