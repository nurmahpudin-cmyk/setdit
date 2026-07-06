import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedMenus() {
  console.log('🍽️ Starting menu seed...\n');

  // Clear existing menus
  await prisma.tr_menu_permissions.deleteMany({});
  await prisma.mst_menus.deleteMany({});
  console.log('✅ Cleared existing menus\n');

  // Map to store created menu IDs
  const menuMap = new Map<string, number>();

  // ========== STEP 1: Create all parent menus ==========
  console.log('📦 Creating parent menus...\n');

  const parents = [
    { name: 'Dashboard', path: '/dashboard', module: 'app', icon: 'DashboardOutlined', order_num: 1 },
    { name: 'SK PS', path: '/sk-perhutanan', module: 'app', icon: 'FolderOutlined', order_num: 2 },
    { name: 'Jadwal Pimpinan', path: '/jadwal-pimpinan', module: 'app', icon: 'ScheduleOutlined', order_num: 3 },
    { name: 'Master', path: null, module: 'master', icon: 'DatabaseOutlined', order_num: 4 },
    { name: 'Pengaturan', path: null, module: 'admin', icon: 'SettingOutlined', order_num: 5 },
  ];

  for (const p of parents) {
    const created = await prisma.mst_menus.create({
      data: {
        name: p.name,
        path: p.path || '',
        module: p.module,
        icon: p.icon,
        order_num: p.order_num,
        parent_id: null,
        is_active: true,
      },
    });
    menuMap.set(p.name, created.id);
    console.log(`✅ ${p.order_num}. ${p.name} [${p.icon}]`);
  }

  // ========== STEP 2: Create Master children ==========
  console.log('\n📦 Creating Master children...\n');

  const masterChildren = [
    { name: 'Pegawai', path: '/pegawai', icon: 'TeamOutlined', order_num: 41, perms: ['pegawai.view', 'pegawai.manage'] },
    { name: 'Pengguna', path: '/users', icon: 'UserOutlined', order_num: 42, perms: ['user.view', 'user.create', 'user.update', 'user.delete'] },
    { name: 'Jabatan', path: '/positions', icon: 'BankOutlined', order_num: 43, perms: ['position.view', 'position.manage'] },
    { name: 'Unit Kerja', path: '/units', icon: 'ClusterOutlined', order_num: 44, perms: ['unit.view', 'unit.manage'] },
    { name: 'Provinsi', path: '/master/provinsi', icon: 'GlobalOutlined', order_num: 45, perms: ['provinsi.view', 'provinsi.create', 'provinsi.update', 'provinsi.delete'] },
    { name: 'Kabupaten', path: '/master/kabkota', icon: 'AimOutlined', order_num: 46, perms: ['kabkota.view', 'kabkota.create', 'kabkota.update', 'kabkota.delete'] },
    { name: 'Skema', path: '/master/skema', icon: 'AppstoreOutlined', order_num: 47, perms: ['skema.view', 'skema.create', 'skema.update', 'skema.delete'] },
  ];

  const masterId = menuMap.get('Master')!;
  for (const child of masterChildren) {
    const created = await prisma.mst_menus.create({
      data: {
        name: child.name,
        path: child.path,
        module: 'master',
        icon: child.icon,
        order_num: child.order_num,
        parent_id: masterId,
        is_active: true,
      },
    });
    menuMap.set(`Master/${child.name}`, created.id);
    console.log(`   └── ${child.order_num}. ${child.name} [${child.icon}]`);
  }

  // ========== STEP 3: Create SK PS children ==========
  console.log('\n📦 Creating SK PS children...\n');

  const skPsChildren = [
    { name: 'Daftar SK', path: '/sk-perhutanan', icon: 'UnorderedListOutlined', order_num: 21, perms: ['sk_perhutanan.view'] },
    { name: 'Pencarian Proses SK', path: '/proceed-sk', icon: 'SearchOutlined', order_num: 22, perms: ['sk_perhutanan.view', 'sk_perhutanan.search'] },
    { name: 'Export SK', path: '/export-sk', icon: 'FileExcelOutlined', order_num: 24, perms: ['sk_perhutanan.export'] },
  ];

  const skPsId = menuMap.get('SK PS')!;
  for (const child of skPsChildren) {
    const created = await prisma.mst_menus.create({
      data: {
        name: child.name,
        path: child.path,
        module: 'app',
        icon: child.icon,
        order_num: child.order_num,
        parent_id: skPsId,
        is_active: true,
      },
    });
    menuMap.set(`SK PS/${child.name}`, created.id);
    console.log(`   └── ${child.order_num}. ${child.name} [${child.icon}]`);
  }

  // ========== STEP 4: Create Pengaturan children ==========
  console.log('\n📦 Creating Pengaturan children...\n');

  const pengaturanChildren = [
    { name: 'Aplikasi', path: '/settings', icon: 'ToolOutlined', order_num: 51, perms: ['setting.view', 'setting.manage'] },
    { name: 'Menu', path: '/menus', icon: 'MenuOutlined', order_num: 52, perms: ['menu.view', 'menu.manage'] },
    { name: 'Role', path: '/roles', icon: 'SafetyOutlined', order_num: 53, perms: ['role.view', 'role.manage'] },
    { name: 'Permission', path: '/permissions', icon: 'KeyOutlined', order_num: 54, perms: ['permission.view', 'permission.manage'] },
    { name: 'Log Aktifitas', path: '/logs', icon: 'FileTextOutlined', order_num: 55, perms: ['log.view'] },
    { name: 'WhatsApp', path: '/whatsapp', icon: 'CustomerServiceOutlined', order_num: 56, perms: ['wa.view', 'wa.manage', 'wa.send'] },
  ];

  const pengaturanId = menuMap.get('Pengaturan')!;
  for (const child of pengaturanChildren) {
    const created = await prisma.mst_menus.create({
      data: {
        name: child.name,
        path: child.path,
        module: 'admin',
        icon: child.icon,
        order_num: child.order_num,
        parent_id: pengaturanId,
        is_active: true,
      },
    });
    menuMap.set(`Pengaturan/${child.name}`, created.id);
    console.log(`   └── ${child.order_num}. ${child.name} [${child.icon}]`);
  }

  // ========== STEP 5: Assign permissions ==========
  console.log('\n🔑 Assigning permissions...\n');

  const allPermissions: Record<string, string[]> = {
    'Dashboard': ['dashboard.view'],
    'SK PS/Daftar SK': ['sk_perhutanan.view'],
    'SK PS/Pencarian Proses SK': ['sk_perhutanan.view', 'sk_perhutanan.search'],
    'SK PS/Tambah SK': ['sk_perhutanan.create'],
    'SK PS/Export SK': ['sk_perhutanan.export'],
    'Jadwal Pimpinan': ['jadwal.view', 'jadwal.manage'],
    'Master/Pegawai': ['pegawai.view', 'pegawai.manage'],
    'Master/Pengguna': ['user.view', 'user.create', 'user.update', 'user.delete'],
    'Master/Jabatan': ['position.view', 'position.manage'],
    'Master/Unit Kerja': ['unit.view', 'unit.manage'],
    'Master/Provinsi': ['provinsi.view', 'provinsi.create', 'provinsi.update', 'provinsi.delete'],
    'Master/Kabupaten': ['kabkota.view', 'kabkota.create', 'kabkota.update', 'kabkota.delete'],
    'Master/Skema': ['skema.view', 'skema.create', 'skema.update', 'skema.delete'],
    'Pengaturan/Aplikasi': ['setting.view', 'setting.manage'],
    'Pengaturan/Menu': ['menu.view', 'menu.manage'],
    'Pengaturan/Role': ['role.view', 'role.manage'],
    'Pengaturan/Permission': ['permission.view', 'permission.manage'],
    'Pengaturan/Log Aktifitas': ['log.view'],
    'Pengaturan/WhatsApp': ['wa.view', 'wa.manage', 'wa.send'],
    'Pengaturan/Tambah SK': ['sk_perhutanan.create'],
  };

  for (const [menuKey, perms] of Object.entries(allPermissions)) {
    const menuId = menuMap.get(menuKey);
    if (!menuId) continue;

    for (const permCode of perms) {
      const permission = await prisma.mst_permissions.findUnique({ where: { code: permCode } });
      if (permission) {
        await prisma.tr_menu_permissions.upsert({
          where: {
            menu_id_permission_id: { menu_id: menuId, permission_id: permission.id },
          },
          create: { menu_id: menuId, permission_id: permission.id },
          update: {},
        });
        console.log(`   ${menuKey} -> ${permCode}`);
      }
    }
  }

  // ========== STEP 6: Assign to SUPER_ADMIN ==========
  console.log('\n🔑 Assigning all to SUPER_ADMIN...\n');

  const superAdmin = await prisma.mst_roles.findUnique({ where: { code: 'SUPER_ADMIN' } });

  if (superAdmin) {
    await prisma.tr_role_permissions.deleteMany({ where: { role_id: superAdmin.id } });

    const allPerms = await prisma.mst_permissions.findMany();
    await prisma.tr_role_permissions.createMany({
      data: allPerms.map((p) => ({ role_id: superAdmin.id, permission_id: p.id })),
    });

    console.log(`✅ SUPER_ADMIN assigned ${allPerms.length} permissions`);
  }

  // ========== PRINT FINAL TREE ==========
  console.log('\n📊 Final Menu Structure:\n');

  const rootMenus = await prisma.mst_menus.findMany({
    where: { parent_id: null },
    orderBy: { order_num: 'asc' },
    include: { children: { orderBy: { order_num: 'asc' } } },
  });

  for (const root of rootMenus) {
    console.log(`${root.order_num}. ${root.name} [${root.icon}]`);
    for (const child of root.children) {
      console.log(`     └── ${child.order_num}. ${child.name} [${child.icon}]`);
    }
  }

  console.log('\n🎉 Menu seed completed!\n');
}

seedMenus()
  .catch((e) => {
    console.error('Menu seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
