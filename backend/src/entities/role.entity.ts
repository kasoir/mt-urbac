import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Tenant } from './tenant.entity';

@Entity('roles')
@Index('unique_tenant_role_name_idx', ['name', 'tenantUid'], { unique: true })
export class Role {
  @PrimaryGeneratedColumn('uuid')
  uid: string;

  @Column()
  name: string;

  @Column({ type: 'uuid', nullable: true })
  tenantUid: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantUid' })
  tenant: Tenant;

  @Column({ type: 'int', default: 10 })
  level: number;
}
