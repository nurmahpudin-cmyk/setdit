import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function test() {
  console.log('Starting test...');

  const login = 'admin@setdit.local';
  const password = 'Admin123!';

  console.log('Looking for user:', login);

  const user = await prisma.mst_users.findFirst({
    where: { OR: [{ email: login }, { username: login }], deleted_at: null }
  });

  if (!user) {
    console.log('USER NOT FOUND');
    await prisma.$disconnect();
    return;
  }

  console.log('User found:', user.email, user.username);
  console.log('Hash:', user.password.substring(0, 40));

  const match = await bcrypt.compare(password, user.password);
  console.log('bcrypt.compare("' + password + '", hash):', match);

  await prisma.$disconnect();
}

test().catch(console.error);
