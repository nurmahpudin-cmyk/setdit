import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addStatsMenu() {
  // Find the SK PS parent menu
  const skPsMenu = await prisma.mst_menus.findFirst({
    where: { name: 'SK PS' },
  });

  if (!skPsMenu) {
    console.error('SK PS menu not found');
    return;
  }

  console.log(`Found SK PS menu: ${skPsMenu.name} (id: ${skPsMenu.id})`);

  // Check if Statistik SK already exists
  const existing = await prisma.mst_menus.findFirst({
    where: { path: '/stats-sk' },
  });

  if (existing) {
    console.log('Statistik SK menu already exists');
    return;
  }

  // Create the menu
  const created = await prisma.mst_menus.create({
    data: {
      name: 'Statistik SK',
      path: '/stats-sk',
      module: 'app',
      icon: 'BarChartOutlined',
      order_num: 23,
      parent_id: skPsMenu.id,
      is_active: true,
    },
  });

  console.log(`✅ Created Statistik SK menu (id: ${created.id})`);
}

addStatsMenu()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
