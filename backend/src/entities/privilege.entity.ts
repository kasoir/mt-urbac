import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Tenant } from './tenant.entity';

@Entity('privileges')
@Index('unique_tenant_privilege_action_idx', ['action', 'tenantUid'], { unique: true })
export class Privilege {
  @PrimaryGeneratedColumn('uuid')
  uid: string;
  
  @Column({ nullable: true })
  name: string;

  @Column()
  action: string;

  @Column({ type: 'uuid', nullable: true })
  tenantUid: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantUid' })
  tenant: Tenant;
}
