import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create roles based on new structure
  const roles = [
    {
      name: 'Super Admin',
      code: 'SUPER_ADMIN',
      description: 'Kelola seluruh sistem',
      is_super_admin: true,
      is_active: true,
    },
    {
      name: 'Admin TU',
      code: 'ADMIN_TU',
      description: 'Agenda surat, penomoran, tata naskah',
      is_super_admin: false,
      is_active: true,
    },
    {
      name: 'Aspri Dirjen',
      code: 'ASPRI_DIRJEN',
      description: 'Aspirasi Dirjen - mengelola jadwal pimpinan',
      is_super_admin: false,
      is_active: true,
    },
    {
      name: 'Operator',
      code: 'OPERATOR',
      description: 'Input draft, upload dokumen, revisi',
      is_super_admin: false,
      is_active: true,
    },
    {
      name: 'Verifikator',
      code: 'VERIFIKATOR',
      description: 'Verifikasi administrasi dan disposisi',
      is_super_admin: false,
      is_active: true,
    },
    {
      name: 'Reviewer',
      code: 'REVIEWER',
      description: 'Telaah substansi dan hukum',
      is_super_admin: false,
      is_active: true,
    },
    {
      name: 'Approver',
      code: 'APPROVER',
      description: 'Persetujuan/TTD dokumen',
      is_super_admin: false,
      is_active: true,
    },
    {
      name: 'Arsiparis',
      code: 'ARSIPARIS',
      description: 'Salinan, scan, arsip dokumen',
      is_super_admin: false,
      is_active: true,
    },
    {
      name: 'Monitoring',
      code: 'MONITORING',
      description: 'Hanya melihat laporan dan progres',
      is_super_admin: false,
      is_active: true,
    },
  ];

  // Create/update roles
  for (const role of roles) {
    await prisma.mst_roles.upsert({
      where: { code: role.code },
      update: {
        name: role.name,
        description: role.description,
        is_super_admin: role.is_super_admin,
        is_active: role.is_active,
      },
      create: role,
    });
    console.log(`✅ Role ${role.code} created/updated`);
  }

  // Default permissions
  const permissions = [
    // Document/Surat permissions
    { name: 'Lihat Surat', code: 'surat.view', module: 'surat', action: 'view' },
    { name: 'Buat Surat', code: 'surat.create', module: 'surat', action: 'create' },
    { name: 'Edit Surat', code: 'surat.update', module: 'surat', action: 'update' },
    { name: 'Hapus Surat', code: 'surat.delete', module: 'surat', action: 'delete' },
    { name: 'Verifikasi Surat', code: 'surat.verify', module: 'surat', action: 'verify' },
    { name: 'Review Surat', code: 'surat.review', module: 'surat', action: 'review' },
    { name: 'Approve Surat', code: 'surat.approve', module: 'surat', action: 'approve' },
    { name: 'Arsip Surat', code: 'surat.archive', module: 'surat', action: 'archive' },
    { name: 'Download Surat', code: 'surat.download', module: 'surat', action: 'download' },

    // Disposisi permissions
    { name: 'Lihat Disposisi', code: 'disposisi.view', module: 'disposisi', action: 'view' },
    { name: 'Buat Disposisi', code: 'disposisi.create', module: 'disposisi', action: 'create' },
    { name: 'Edit Disposisi', code: 'disposisi.update', module: 'disposisi', action: 'update' },
    { name: 'Hapus Disposisi', code: 'disposisi.delete', module: 'disposisi', action: 'delete' },
    { name: 'Verifikasi Disposisi', code: 'disposisi.verify', module: 'disposisi', action: 'verify' },

    // User management
    { name: 'Lihat Pengguna', code: 'user.view', module: 'user', action: 'view' },
    { name: 'Buat Pengguna', code: 'user.create', module: 'user', action: 'create' },
    { name: 'Edit Pengguna', code: 'user.update', module: 'user', action: 'update' },
    { name: 'Hapus Pengguna', code: 'user.delete', module: 'user', action: 'delete' },

    // Role management
    { name: 'Lihat Role', code: 'role.view', module: 'role', action: 'view' },
    { name: 'Kelola Role', code: 'role.manage', module: 'role', action: 'manage' },

    // Menu management
    { name: 'Lihat Menu', code: 'menu.view', module: 'menu', action: 'view' },
    { name: 'Kelola Menu', code: 'menu.manage', module: 'menu', action: 'manage' },

    // Position/Unit management
    { name: 'Lihat Jabatan', code: 'position.view', module: 'position', action: 'view' },
    { name: 'Kelola Jabatan', code: 'position.manage', module: 'position', action: 'manage' },
    { name: 'Lihat Unit', code: 'unit.view', module: 'unit', action: 'view' },
    { name: 'Kelola Unit', code: 'unit.manage', module: 'unit', action: 'manage' },

    // Settings
    { name: 'Lihat Pengaturan', code: 'setting.view', module: 'setting', action: 'view' },
    { name: 'Kelola Pengaturan', code: 'setting.manage', module: 'setting', action: 'manage' },

    // Logs
    { name: 'Lihat Log Aktivitas', code: 'log.view', module: 'log', action: 'view' },

    // WhatsApp
    { name: 'Lihat WhatsApp', code: 'wa.view', module: 'wa', action: 'view' },
    { name: 'Kirim WhatsApp', code: 'wa.send', module: 'wa', action: 'send' },
    { name: 'Kelola WhatsApp', code: 'wa.manage', module: 'wa', action: 'manage' },

    // Reports/Dashboard
    { name: 'Lihat Dashboard', code: 'dashboard.view', module: 'dashboard', action: 'view' },
    { name: 'Lihat Laporan', code: 'laporan.view', module: 'laporan', action: 'view' },
    { name: 'Export Laporan', code: 'laporan.export', module: 'laporan', action: 'export' },

    // Jadwal Pimpinan
    { name: 'Lihat Jadwal', code: 'jadwal.view', module: 'jadwal', action: 'view' },
    { name: 'Buat Jadwal', code: 'jadwal.create', module: 'jadwal', action: 'create' },
    { name: 'Edit Jadwal', code: 'jadwal.update', module: 'jadwal', action: 'update' },
    { name: 'Hapus Jadwal', code: 'jadwal.delete', module: 'jadwal', action: 'delete' },
    { name: 'Kelola Jadwal', code: 'jadwal.manage', module: 'jadwal', action: 'manage' },

    // Pegawai
    { name: 'Lihat Pegawai', code: 'pegawai.view', module: 'pegawai', action: 'view' },
    { name: 'Buat Pegawai', code: 'pegawai.create', module: 'pegawai', action: 'create' },
    { name: 'Edit Pegawai', code: 'pegawai.update', module: 'pegawai', action: 'update' },
    { name: 'Hapus Pegawai', code: 'pegawai.delete', module: 'pegawai', action: 'delete' },
    { name: 'Kelola Pegawai', code: 'pegawai.manage', module: 'pegawai', action: 'manage' },
  ];

  // Create/update permissions
  for (const perm of permissions) {
    await prisma.mst_permissions.upsert({
      where: { code: perm.code },
      update: perm,
      create: { ...perm, is_active: true },
    });
  }
  console.log(`✅ ${permissions.length} permissions created/updated`);

  // Assign permissions to SUPER_ADMIN (all permissions)
  const superAdmin = await prisma.mst_roles.findUnique({ where: { code: 'SUPER_ADMIN' } });
  if (superAdmin) {
    const allPerms = await prisma.mst_permissions.findMany();
    await prisma.tr_role_permissions.deleteMany({ where: { role_id: superAdmin.id } });
    await prisma.tr_role_permissions.createMany({
      data: allPerms.map((p) => ({ role_id: superAdmin.id, permission_id: p.id })),
    });
    console.log('✅ All permissions assigned to SUPER_ADMIN');
  }

  // Assign specific permissions to ADMIN_TU
  const adminTU = await prisma.mst_roles.findUnique({ where: { code: 'ADMIN_TU' } });
  if (adminTU) {
    const adminTuPerms = await prisma.mst_permissions.findMany({
      where: {
        code: {
          in: [
            'surat.view', 'surat.create', 'surat.update', 'surat.delete', 'surat.download',
            'disposisi.view', 'disposisi.create', 'disposisi.update',
            'user.view',
            'log.view',
            'dashboard.view',
          ],
        },
      },
    });
    await prisma.tr_role_permissions.deleteMany({ where: { role_id: adminTU.id } });
    await prisma.tr_role_permissions.createMany({
      data: adminTuPerms.map((p) => ({ role_id: adminTU.id, permission_id: p.id })),
    });
    console.log('✅ Permissions assigned to ADMIN_TU');
  }

  // Assign permissions to ASPRI_DIRJEN
  const aspriDirjen = await prisma.mst_roles.findUnique({ where: { code: 'ASPRI_DIRJEN' } });
  if (aspriDirjen) {
    const aspriPerms = await prisma.mst_permissions.findMany({
      where: {
        code: {
          in: [
            'jadwal.view', 'jadwal.create', 'jadwal.update', 'jadwal.delete', 'jadwal.manage',
            'pegawai.view', 'pegawai.create', 'pegawai.update', 'pegawai.delete', 'pegawai.manage',
            'dashboard.view',
          ],
        },
      },
    });
    await prisma.tr_role_permissions.deleteMany({ where: { role_id: aspriDirjen.id } });
    await prisma.tr_role_permissions.createMany({
      data: aspriPerms.map((p) => ({ role_id: aspriDirjen.id, permission_id: p.id })),
    });
    console.log('✅ Permissions assigned to ASPRI_DIRJEN');
  }

  // Assign permissions to OPERATOR
  const operator = await prisma.mst_roles.findUnique({ where: { code: 'OPERATOR' } });
  if (operator) {
    const operatorPerms = await prisma.mst_permissions.findMany({
      where: {
        code: {
          in: [
            'surat.view', 'surat.create', 'surat.update',
            'disposisi.view', 'disposisi.create',
            'dashboard.view',
          ],
        },
      },
    });
    await prisma.tr_role_permissions.deleteMany({ where: { role_id: operator.id } });
    await prisma.tr_role_permissions.createMany({
      data: operatorPerms.map((p) => ({ role_id: operator.id, permission_id: p.id })),
    });
    console.log('✅ Permissions assigned to OPERATOR');
  }

  // Assign permissions to VERIFIKATOR
  const verifikator = await prisma.mst_roles.findUnique({ where: { code: 'VERIFIKATOR' } });
  if (verifikator) {
    const verifikatorPerms = await prisma.mst_permissions.findMany({
      where: {
        code: {
          in: [
            'surat.view', 'surat.verify', 'surat.download',
            'disposisi.view', 'disposisi.verify',
            'dashboard.view',
          ],
        },
      },
    });
    await prisma.tr_role_permissions.deleteMany({ where: { role_id: verifikator.id } });
    await prisma.tr_role_permissions.createMany({
      data: verifikatorPerms.map((p) => ({ role_id: verifikator.id, permission_id: p.id })),
    });
    console.log('✅ Permissions assigned to VERIFIKATOR');
  }

  // Assign permissions to REVIEWER
  const reviewer = await prisma.mst_roles.findUnique({ where: { code: 'REVIEWER' } });
  if (reviewer) {
    const reviewerPerms = await prisma.mst_permissions.findMany({
      where: {
        code: {
          in: [
            'surat.view', 'surat.review', 'surat.download',
            'disposisi.view',
            'dashboard.view',
          ],
        },
      },
    });
    await prisma.tr_role_permissions.deleteMany({ where: { role_id: reviewer.id } });
    await prisma.tr_role_permissions.createMany({
      data: reviewerPerms.map((p) => ({ role_id: reviewer.id, permission_id: p.id })),
    });
    console.log('✅ Permissions assigned to REVIEWER');
  }

  // Assign permissions to APPROVER
  const approver = await prisma.mst_roles.findUnique({ where: { code: 'APPROVER' } });
  if (approver) {
    const approverPerms = await prisma.mst_permissions.findMany({
      where: {
        code: {
          in: [
            'surat.view', 'surat.approve', 'surat.download',
            'disposisi.view',
            'dashboard.view',
          ],
        },
      },
    });
    await prisma.tr_role_permissions.deleteMany({ where: { role_id: approver.id } });
    await prisma.tr_role_permissions.createMany({
      data: approverPerms.map((p) => ({ role_id: approver.id, permission_id: p.id })),
    });
    console.log('✅ Permissions assigned to APPROVER');
  }

  // Assign permissions to ARSIPARIS
  const arsiparis = await prisma.mst_roles.findUnique({ where: { code: 'ARSIPARIS' } });
  if (arsiparis) {
    const arsiparisPerms = await prisma.mst_permissions.findMany({
      where: {
        code: {
          in: [
            'surat.view', 'surat.archive', 'surat.download',
            'disposisi.view',
            'dashboard.view',
          ],
        },
      },
    });
    await prisma.tr_role_permissions.deleteMany({ where: { role_id: arsiparis.id } });
    await prisma.tr_role_permissions.createMany({
      data: arsiparisPerms.map((p) => ({ role_id: arsiparis.id, permission_id: p.id })),
    });
    console.log('✅ Permissions assigned to ARSIPARIS');
  }

  // Assign permissions to MONITORING (read-only)
  const monitoring = await prisma.mst_roles.findUnique({ where: { code: 'MONITORING' } });
  if (monitoring) {
    const monitoringPerms = await prisma.mst_permissions.findMany({
      where: {
        code: {
          in: [
            'surat.view',
            'disposisi.view',
            'dashboard.view',
            'laporan.view',
          ],
        },
      },
    });
    await prisma.tr_role_permissions.deleteMany({ where: { role_id: monitoring.id } });
    await prisma.tr_role_permissions.createMany({
      data: monitoringPerms.map((p) => ({ role_id: monitoring.id, permission_id: p.id })),
    });
    console.log('✅ Permissions assigned to MONITORING');
  }

  // Create default Super Admin user
  const hashedPassword = await bcrypt.hash('Admin123!', 12);
  const adminUser = await prisma.mst_users.upsert({
    where: { email: 'admin@setdit.local' },
    update: {},
    create: {
      fullname: 'Super Admin',
      username: 'admin',
      email: 'admin@setdit.local',
      phone: '081234567890',
      password: hashedPassword,
      status: 'ACTIVE',
      is_verified: true,
    },
  });

  await prisma.tr_user_roles.deleteMany({ where: { user_id: adminUser.id } });
  await prisma.tr_user_roles.create({
    data: { user_id: adminUser.id, role_id: superAdmin!.id },
  });
  console.log('✅ Super Admin user created/updated');

  // Create default positions with role mapping
  const positionRoleMap = [
    { name: 'Staf PKPS / PKTHA', code: 'STAF_PKPS', role: 'OPERATOR' },
    { name: 'Koordinator PKPS', code: 'KOOR_PKPS', role: 'VERIFIKATOR' },
    { name: 'TU Setditjen', code: 'TU_SETDITJEN', role: 'ADMIN_TU' },
    { name: 'Sekditjen PS', code: 'SEKDITJEN_PS', role: 'APPROVER' },
    { name: 'Kabag PEHKT', code: 'KABAG_PEHKT', role: 'REVIEWER' },
    { name: 'Ketua Pokja Hukum', code: 'KETUA_POKJA_HUKUM', role: 'REVIEWER' },
    { name: 'Anggota Pokja Hukum', code: 'ANGGOTA_POKJA_HUKUM', role: 'REVIEWER' },
    { name: 'Dirjen PS', code: 'DIRJEN_PS', role: 'APPROVER' },
    { name: 'Petugas Arsip', code: 'PETUGAS_ARSIP', role: 'ARSIPARIS' },
    { name: 'Aspirasi Dirjen', code: 'ASPRI_DIRJEN', role: 'ASPRI_DIRJEN' },
  ];

  for (const pos of positionRoleMap) {
    const role = await prisma.mst_roles.findUnique({ where: { code: pos.role } });
    await prisma.mst_positions.upsert({
      where: { code: pos.code },
      update: { name: pos.name, role_id: role?.id },
      create: { name: pos.name, code: pos.code, role_id: role?.id },
    });
  }
  console.log('✅ Default positions created with role mapping');

  // Create default units
  const units = [
    { name: 'Direktorat PKPS', code: 'DIREKTORAT_PKPS' },
    { name: 'Balai PSKL', code: 'BALAI_PSKL' },
    { name: 'Bagian Tata Usaha', code: 'BAGIAN_TU' },
    { name: 'Subbagian Umum', code: 'SUBBAGIAN_UMUM' },
  ];

  for (const unit of units) {
    await prisma.mst_units.upsert({
      where: { code: unit.code },
      update: {},
      create: unit,
    });
  }
  console.log('✅ Default units created');

  // Create default menus
  const menuData = [
    { name: 'Dashboard', path: '/dashboard', module: 'app', icon: 'DashboardOutlined', order_num: 1 },
    { name: 'Jadwal Pimpinan', path: '/jadwal-pimpinan', module: 'app', icon: 'CalendarOutlined', order_num: 7 },
    { name: 'Data Pegawai', path: '/pegawai', module: 'app', icon: 'UsergroupAddOutlined', order_num: 8 },
    { name: 'Pengguna', path: '/users', module: 'admin', icon: 'UserOutlined', order_num: 10 },
    { name: 'Role', path: '/roles', module: 'admin', icon: 'TeamOutlined', order_num: 11 },
    { name: 'Jabatan', path: '/positions', module: 'admin', icon: 'BookOutlined', order_num: 12 },
    { name: 'Unit Kerja', path: '/units', module: 'admin', icon: 'BankOutlined', order_num: 13 },
    { name: 'Pengaturan', path: '/settings', module: 'admin', icon: 'SettingOutlined', order_num: 14 },
  ];

  for (const m of menuData) {
    const existing = await prisma.mst_menus.findFirst({ where: { name: m.name } });
    if (existing) {
      await prisma.mst_menus.update({
        where: { id: existing.id },
        data: m,
      });
    } else {
      await prisma.mst_menus.create({ data: m });
    }
  }
  console.log('✅ Default menus created/updated');

  // Create default settings
  await prisma.mst_settings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      app_name: 'SETDIT',
      app_fullname: 'Sistem Terpadu',
      tagline: 'Sistem Informasi Kearsipan Terpadu',
      description: 'Sistem Manajemen Surat dan Disposisi',
      email: 'admin@setdit.local',
      phone: '021-12345678',
      address: 'Jakarta, Indonesia',
    },
  });
  console.log('✅ Default settings created');

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
