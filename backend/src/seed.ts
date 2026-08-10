import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import { User, Group, Role, Privilege, RolePrivilege, Tenant } from './entities';

import { Client } from 'pg';

dotenv.config({ path: '.env' });
dotenv.config({ path: '../.env' });

async function ensureDatabaseExists() {
  const host = process.env.DB_HOST || 'localhost';
  const port = parseInt(process.env.DB_PORT || '5432', 10);
  const username = process.env.DB_USERNAME || 'postgres';
  const password = process.env.DB_PASSWORD || 'postgres';
  const dbName = process.env.DB_DATABASE || 'mt_urbac_db';

  const client = new Client({ host, port, user: username, password, database: 'postgres' });
  try {
    await client.connect();
    const res = await client.query(`SELECT 1 FROM pg_database WHERE datname = '${dbName}'`);
    if (res.rowCount === 0) {
      console.log(`Database "${dbName}" does not exist. Creating...`);
      await client.query(`CREATE DATABASE "${dbName}"`);
      console.log(`Database "${dbName}" created successfully.`);
    }
  } catch (err) {
    console.warn('Could not auto-create database (might already exist or permission restricted):', err);
  } finally {
    await client.end().catch(() => {});
  }
}

async function seed() {
  await ensureDatabaseExists();

  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'mt_urbac_db',
    entities: [Tenant, User, Group, Role, Privilege, RolePrivilege],
    synchronize: true,
    dropSchema: true,
  });

  await dataSource.initialize();
  console.log('Database connection initialized for seeding.');

  const privilegeRepo = dataSource.getRepository(Privilege);
  const roleRepo = dataSource.getRepository(Role);
  const rolePrivilegeRepo = dataSource.getRepository(RolePrivilege);
  const groupRepo = dataSource.getRepository(Group);
  const userRepo = dataSource.getRepository(User);
  const tenantRepo = dataSource.getRepository(Tenant);

  let defaultTenant = await tenantRepo.findOne({ where: { slug: 'default' } });
  if (!defaultTenant) {
    defaultTenant = await tenantRepo.save(tenantRepo.create({ slug: 'default', tenant_config: {} }));
    console.log('Created default tenant.');
  }

  // 1. Privileges
  const Privileges = [
    { name: 'User Read', action: 'user:read' },
    { name: 'User Create', action: 'user:create' },
    { name: 'User Update', action: 'user:update' },
    { name: 'User Delete', action: 'user:delete' },
    { name: 'Group Read', action: 'group:read' },
    { name: 'Group Create', action: 'group:create' },
    { name: 'Group Update', action: 'group:update' },
    { name: 'Group Delete', action: 'group:delete' },
    { name: 'Role Read', action: 'role:read' },
    { name: 'Role Create', action: 'role:create' },
    { name: 'Role Update', action: 'role:update' },
    { name: 'Role Delete', action: 'role:delete' },
    { name: 'Privilege Read', action: 'privilege:read' },
    { name: 'Privilege Create', action: 'privilege:create' },
    { name: 'Privilege Update', action: 'privilege:update' },
    { name: 'Privilege Delete', action: 'privilege:delete' },
  ];

  const privilegesMap = new Map<string, Privilege>();
  for (const { name, action } of Privileges) {
    let priv = await privilegeRepo.findOne({ where: { action } });
    if (!priv) {
      priv = await privilegeRepo.save(privilegeRepo.create({ name, action, tenantUid: null }));
    }
    privilegesMap.set(action, priv);
  }
  console.log(`Seeded ${Privileges.length} privileges.`);

  // 2. Roles
  const rolesData = [
    { name: 'Super Admin', level: 100, tenantUid: null },
    { name: 'Admin', level: 50, tenantUid: defaultTenant.uid },
    { name: 'Standard User', level: 10, tenantUid: defaultTenant.uid },
  ];

  const rolesMap = new Map<string, Role>();
  for (const r of rolesData) {
    // Note: TypeORM's findOne with tenantUid: null acts as IS NULL.
    let role = await roleRepo.findOne({ where: { name: r.name, tenantUid: r.tenantUid ?? undefined } });
    if (!role) {
      role = await roleRepo.save(roleRepo.create(r));
    } else {
      role.level = r.level;
      role = await roleRepo.save(role);
    }
    rolesMap.set(r.name, role);
  }
  console.log(`Seeded ${rolesData.length} roles.`);

  // 3. Map Privileges to Roles
  const superAdminRole = rolesMap.get('Super Admin')!;
  const adminRole = rolesMap.get('Admin')!;
  const standardRole = rolesMap.get('Standard User')!;

  const assignPrivilegesToRole = async (role: Role, privs: Privilege[]) => {
    for (const priv of privs) {
      const existing = await rolePrivilegeRepo.findOne({
        where: { roleUid: role.uid, privilegeUid: priv.uid },
      });
      if (!existing) {
        await rolePrivilegeRepo.save(
          rolePrivilegeRepo.create({ roleUid: role.uid, privilegeUid: priv.uid }),
        );
      }
    }
  };

  const allPrivs = Array.from(privilegesMap.values());
  const adminPrivs = allPrivs.filter(
    (p) => p.action.startsWith('user:') || p.action.startsWith('group:') || p.action === 'role:read'
  );
  const readPrivs = allPrivs.filter((p) => p.action.endsWith(':read'));

  await assignPrivilegesToRole(superAdminRole, allPrivs);
  await assignPrivilegesToRole(adminRole, adminPrivs);
  await assignPrivilegesToRole(standardRole, readPrivs);
  console.log('Mapped privileges to roles.');

  // 4. Groups
  const groupsData = [
    { name: 'Super Admins', description: 'Super Administrator Group', tenantUid: null },
    { name: 'Admins', description: 'Administrator Group', tenantUid: defaultTenant.uid },
    { name: 'Users', description: 'Standard Users Group', tenantUid: defaultTenant.uid },
    { name: 'Engineering', description: 'Engineering Team', tenantUid: defaultTenant.uid },
  ];

  const groupsMap = new Map<string, Group>();
  for (const g of groupsData) {
    let group = await groupRepo.findOne({ where: { name: g.name, tenantUid: g.tenantUid ?? undefined }, relations: ['roles'] });
    if (!group) {
      group = await groupRepo.save(groupRepo.create(g));
    }
    
    // Assign role to group
    if (g.name === 'Super Admins') group.roles = [superAdminRole];
    else if (g.name === 'Admins') group.roles = [adminRole];
    else if (g.name === 'Users') group.roles = [standardRole];
    else if (g.name === 'Engineering') group.roles = [standardRole];
    
    await groupRepo.save(group);
    groupsMap.set(g.name, group);
  }
  console.log(`Seeded ${groupsData.length} groups with roles.`);

  // 5. Super Admin User
  const adminEmail = 'admin@mt-urbac.com';
  let adminUser = await userRepo.findOne({ where: { email: adminEmail } });
  if (!adminUser) {
    const passwordHash = await bcrypt.hash('Admin123!', 10);
    adminUser = await userRepo.save(
      userRepo.create({
        name: 'Super Admin',
        email: adminEmail,
        passwordHash,
        isSuperAdmin: true,
        tenantUid: null,
      }),
    );
    console.log(`Created Super Admin user (${adminEmail}).`);
  }

  // Assign Super Admin User to "Super Admins" group and "Engineering" group
  const superAdminsGroup = groupsMap.get('Super Admins')!;
  const engineeringGroup = groupsMap.get('Engineering')!;

  adminUser.groups = [superAdminsGroup, engineeringGroup];
  await userRepo.save(adminUser);

  console.log('Seeding completed successfully!');
  await dataSource.destroy();
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});

