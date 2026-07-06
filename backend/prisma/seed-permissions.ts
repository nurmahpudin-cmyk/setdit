import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedMissingPermissions() {
  console.log('🔐 Adding missing permissions...\n');

  const missingPermissions = [
    // SK Perhutanan
    { name: 'Lihat SK', code: 'sk_perhutanan.view', module: 'sk_perhutanan', action: 'view' },
    { name: 'Cari SK', code: 'sk_perhutanan.search', module: 'sk_perhutanan', action: 'search' },
    { name: 'Buat SK', code: 'sk_perhutanan.create', module: 'sk_perhutanan', action: 'create' },
    { name: 'Edit SK', code: 'sk_perhutanan.edit', module: 'sk_perhutanan', action: 'edit' },
    { name: 'Submit SK', code: 'sk_perhutanan.submit', module: 'sk_perhutanan', action: 'submit' },
    { name: 'Proses SK', code: 'sk_perhutanan.process', module: 'sk_perhutanan', action: 'process' },
    { name: 'Kelola SK', code: 'sk_perhutanan.manage', module: 'sk_perhutanan', action: 'manage' },
    { name: 'Export SK', code: 'sk_perhutanan.export', module: 'sk_perhutanan', action: 'export' },

    // Provinsi
    { name: 'Lihat Provinsi', code: 'provinsi.view', module: 'provinsi', action: 'view' },
    { name: 'Buat Provinsi', code: 'provinsi.create', module: 'provinsi', action: 'create' },
    { name: 'Edit Provinsi', code: 'provinsi.update', module: 'provinsi', action: 'update' },
    { name: 'Hapus Provinsi', code: 'provinsi.delete', module: 'provinsi', action: 'delete' },

    // Kabkota
    { name: 'Lihat Kab/Kota', code: 'kabkota.view', module: 'kabkota', action: 'view' },
    { name: 'Buat Kab/Kota', code: 'kabkota.create', module: 'kabkota', action: 'create' },
    { name: 'Edit Kab/Kota', code: 'kabkota.update', module: 'kabkota', action: 'update' },
    { name: 'Hapus Kab/Kota', code: 'kabkota.delete', module: 'kabkota', action: 'delete' },

    // Skema
    { name: 'Lihat Skema', code: 'skema.view', module: 'skema', action: 'view' },
    { name: 'Buat Skema', code: 'skema.create', module: 'skema', action: 'create' },
    { name: 'Edit Skema', code: 'skema.update', module: 'skema', action: 'update' },
    { name: 'Hapus Skema', code: 'skema.delete', module: 'skema', action: 'delete' },
  ];

  let created = 0;
  let skipped = 0;

  for (const perm of missingPermissions) {
    const existing = await prisma.mst_permissions.findUnique({
      where: { code: perm.code },
    });

    if (!existing) {
      await prisma.mst_permissions.create({
        data: { ...perm, is_active: true },
      });
      console.log(`✅ Created: ${perm.code}`);
      created++;
    } else {
      console.log(`⏭️  Skipped (exists): ${perm.code}`);
      skipped++;
    }
  }

  console.log(`\n📊 Summary: ${created} created, ${skipped} skipped`);

  // Assign SK export permission to ALL roles
  console.log('\n🔑 Assigning sk_perhutanan.export to ALL roles...\n');

  const exportPermission = await prisma.mst_permissions.findUnique({
    where: { code: 'sk_perhutanan.export' },
  });

  if (exportPermission) {
    const allRoles = await prisma.mst_roles.findMany();

    for (const role of allRoles) {
      const existing = await prisma.tr_role_permissions.findUnique({
        where: {
          role_id_permission_id: {
            role_id: role.id,
            permission_id: exportPermission.id,
          },
        },
      });

      if (!existing) {
        await prisma.tr_role_permissions.create({
          data: {
            role_id: role.id,
            permission_id: exportPermission.id,
          },
        });
        console.log(`✅ Assigned to ${role.code}: sk_perhutanan.export`);
      } else {
        console.log(`⏭️  Already assigned to ${role.code}: sk_perhutanan.export`);
      }
    }
  }

  // Assign other new permissions to SUPER_ADMIN
  console.log('\n🔑 Assigning other new permissions to SUPER_ADMIN...\n');

  const superAdmin = await prisma.mst_roles.findUnique({
    where: { code: 'SUPER_ADMIN' },
  });

  if (superAdmin) {
    for (const perm of missingPermissions) {
      if (perm.code === 'sk_perhutanan.export') continue; // Already assigned to all

      const permission = await prisma.mst_permissions.findUnique({
        where: { code: perm.code },
      });

      if (permission) {
        const existing = await prisma.tr_role_permissions.findUnique({
          where: {
            role_id_permission_id: {
              role_id: superAdmin.id,
              permission_id: permission.id,
            },
          },
        });

        if (!existing) {
          await prisma.tr_role_permissions.create({
            data: {
              role_id: superAdmin.id,
              permission_id: permission.id,
            },
          });
          console.log(`✅ Assigned to SUPER_ADMIN: ${perm.code}`);
        }
      }
    }
  }

  // Update menu permissions
  console.log('\n📋 Updating menu permissions...\n');

  const menuPermissionMap: Record<string, string[]> = {
    'SK Perhutanan': ['sk_perhutanan.view'],
    'Daftar SK': ['sk_perhutanan.view'],
    'Tambah SK Baru': ['sk_perhutanan.create'],
    'Export SK': ['sk_perhutanan.export'],
    'Provinsi': ['provinsi.view', 'provinsi.create', 'provinsi.update', 'provinsi.delete'],
    'Kabupaten/Kota': ['kabkota.view', 'kabkota.create', 'kabkota.update', 'kabkota.delete'],
    'Skema': ['skema.view', 'skema.create', 'skema.update', 'skema.delete'],
  };

  // Assign permissions to ASPRI_DIRJEN
  console.log('\n🔑 Assigning SK permissions to ASPRI_DIRJEN...\n');

  const aspriRole = await prisma.mst_roles.findUnique({
    where: { code: 'ASPRI_DIRJEN' },
  });

  if (aspriRole) {
    const aspriPermissions = [
      'sk_perhutanan.view',
      'sk_perhutanan.process',
    ];

    for (const permCode of aspriPermissions) {
      const permission = await prisma.mst_permissions.findUnique({
        where: { code: permCode },
      });

      if (permission) {
        const existing = await prisma.tr_role_permissions.findUnique({
          where: {
            role_id_permission_id: {
              role_id: aspriRole.id,
              permission_id: permission.id,
            },
          },
        });

        if (!existing) {
          await prisma.tr_role_permissions.create({
            data: {
              role_id: aspriRole.id,
              permission_id: permission.id,
            },
          });
          console.log(`✅ Assigned to ASPRI_DIRJEN: ${permCode}`);
        } else {
          console.log(`⏭️  Already assigned to ASPRI_DIRJEN: ${permCode}`);
        }
      }
    }
  } else {
    console.log(`⚠️  Role ASPRI_DIRJEN not found`);
  }

  for (const [menuName, permCodes] of Object.entries(menuPermissionMap)) {
    const menu = await prisma.mst_menus.findFirst({
      where: { name: menuName },
    });

    if (menu) {
      // Clear existing permissions for this menu
      await prisma.tr_menu_permissions.deleteMany({
        where: { menu_id: menu.id },
      });

      // Add new permissions
      for (const code of permCodes) {
        const permission = await prisma.mst_permissions.findUnique({
          where: { code },
        });

        if (permission) {
          await prisma.tr_menu_permissions.create({
            data: {
              menu_id: menu.id,
              permission_id: permission.id,
            },
          });
          console.log(`✅ Menu "${menuName}" -> ${code}`);
        }
      }
    } else {
      console.log(`⚠️ Menu not found: ${menuName}`);
    }
  }

  console.log('\n🎉 Permissions seed completed!\n');
}

seedMissingPermissions()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
