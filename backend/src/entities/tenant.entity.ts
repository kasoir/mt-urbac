import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('tenants')
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  uid: string;

  @Column({ unique: true })
  slug: string;
  @Column({ nullable: true })
  name: string;

  @Column({ type: 'text', nullable: true })
  contact_details: string;

  @Column({ type: 'jsonb', nullable: true })
  tenant_config: any;
}
