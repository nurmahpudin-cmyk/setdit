import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedUsers() {
  console.log('👥 Starting user seed...\n');

  // Default users configuration
  const users = [
    {
      username: 'admin_tu',
      email: 'admin_tu@setdit.local',
      fullname: 'Admin TU',
      phone: '081234567801',
      jabatanCode: 'TU_SETDITJEN',
      roleCode: 'ADMIN_TU',
      password: 'rahasia123',
    },
    {
      username: 'sekditjen_ps',
      email: 'sekditjen_ps@setdit.local',
      fullname: 'Sekditjen PS',
      phone: '081234567802',
      jabatanCode: 'SEKDITJEN_PS',
      roleCode: 'APPROVER',
      password: 'rahasia123',
    },
    {
      username: 'kabag_pehkt',
      email: 'kabag_pehkt@setdit.local',
      fullname: 'Kabag PEHKT',
      phone: '081234567803',
      jabatanCode: 'KABAG_PEHKT',
      roleCode: 'REVIEWER',
      password: 'rahasia123',
    },
    {
      username: 'ketua_pokja',
      email: 'ketua_pokja@setdit.local',
      fullname: 'Ketua Pokja Hukum',
      phone: '081234567804',
      jabatanCode: 'KETUA_POKJA_HUKUM',
      roleCode: 'REVIEWER',
      password: 'rahasia123',
    },
    {
      username: 'dirjen_ps',
      email: 'dirjen_ps@setdit.local',
      fullname: 'Dirjen PS',
      phone: '081234567805',
      jabatanCode: 'DIRJEN_PS',
      roleCode: 'APPROVER',
      password: 'rahasia123',
    },
    {
      username: 'petugas_arsip',
      email: 'petugas_arsip@setdit.local',
      fullname: 'Petugas Arsip',
      phone: '081234567806',
      jabatanCode: 'PETUGAS_ARSIP',
      roleCode: 'ARSIPARIS',
      password: 'rahasia123',
    },
    {
      username: 'anggota_pokja1',
      email: 'anggota_pokja1@setdit.local',
      fullname: 'Anggota Pokja 1',
      phone: '081234567807',
      jabatanCode: 'ANGGOTA_POKJA_HUKUM',
      roleCode: 'REVIEWER',
      password: 'rahasia123',
    },
    {
      username: 'anggota_pokja2',
      email: 'anggota_pokja2@setdit.local',
      fullname: 'Anggota Pokja 2',
      phone: '081234567808',
      jabatanCode: 'ANGGOTA_POKJA_HUKUM',
      roleCode: 'REVIEWER',
      password: 'rahasia123',
    },
    {
      username: 'anggota_pokja3',
      email: 'anggota_pokja3@setdit.local',
      fullname: 'Anggota Pokja 3',
      phone: '081234567809',
      jabatanCode: 'ANGGOTA_POKJA_HUKUM',
      roleCode: 'REVIEWER',
      password: 'rahasia123',
    },
    {
      username: 'anggota_pokja4',
      email: 'anggota_pokja4@setdit.local',
      fullname: 'Anggota Pokja 4',
      phone: '081234567810',
      jabatanCode: 'ANGGOTA_POKJA_HUKUM',
      roleCode: 'REVIEWER',
      password: 'rahasia123',
    },
  ];

  let created = 0;
  let skipped = 0;

  for (const userData of users) {
    const role = await prisma.mst_roles.findUnique({
      where: { code: userData.roleCode },
    });

    const jabatan = await prisma.mst_positions.findUnique({
      where: { code: userData.jabatanCode },
    });

    if (!role) {
      console.log(`⚠️ Role not found: ${userData.roleCode}`);
      continue;
    }

    if (!jabatan) {
      console.log(`⚠️ Jabatan not found: ${userData.jabatanCode}`);
      continue;
    }

    const hashedPassword = await bcrypt.hash(userData.password, 12);

    const existing = await prisma.mst_users.findUnique({
      where: { email: userData.email },
    });

    if (existing) {
      // Update password only
      await prisma.mst_users.update({
        where: { email: userData.email },
        data: {
          password: hashedPassword,
          fullname: userData.fullname,
          phone: userData.phone,
          username: userData.username,
          status: 'ACTIVE',
          is_verified: true,
          position_id: jabatan.id,
        },
      });
      console.log(`🔄 Updated: ${userData.username} (${userData.jabatanCode})`);
      skipped++;
    } else {
      // Create new user
      const user = await prisma.mst_users.create({
        data: {
          username: userData.username,
          email: userData.email,
          fullname: userData.fullname,
          phone: userData.phone,
          password: hashedPassword,
          status: 'ACTIVE',
          is_verified: true,
          position_id: jabatan.id,
        },
      });

      // Assign role
      await prisma.tr_user_roles.create({
        data: {
          user_id: user.id,
          role_id: role.id,
        },
      });

      console.log(`✅ Created: ${userData.username} (${userData.jabatanCode} - ${userData.roleCode})`);
      created++;
    }
  }

  console.log(`\n📊 Summary: ${created} created, ${skipped} updated`);

  // Print all users
  console.log('\n👥 All Users:\n');
  const allUsers = await prisma.mst_users.findMany({
    where: { deleted_at: null },
    include: {
      position: true,
      roles: { include: { role: true } },
    },
    orderBy: { id: 'asc' },
  });

  for (const u of allUsers) {
    console.log(`  ${u.username} - ${u.fullname}`);
    console.log(`    Jabatan: ${u.position?.name || '-'}`);
    console.log(`    Role: ${u.roles.map(r => r.role.name).join(', ')}`);
  }

  console.log('\n🎉 User seed completed!\n');
}

seedUsers()
  .catch((e) => {
    console.error('User seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
