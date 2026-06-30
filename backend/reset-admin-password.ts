import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resetPassword() {
  const hash = await bcrypt.hash('Admin123!', 12);

  await prisma.mst_users.update({
    where: { email: 'admin@setdit.local' },
    data: {
      password: hash,
      failed_login: 0,
      locked_until: null
    }
  });

  console.log('✅ Password admin berhasil di-reset ke "Admin123!"');

  await prisma.$disconnect();
}

resetPassword();
