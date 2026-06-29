import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debug() {
  const user = await prisma.mst_users.findFirst({
    where: { email: 'admin@setdit.local' },
  });

  if (!user) {
    console.log('User not found!');
    return;
  }

  console.log('User found:', {
    email: user.email,
    username: user.username,
    status: user.status,
    failed_login: user.failed_login,
    locked_until: user.locked_until,
  });

  // Test passwords
  const testPasswords = ['Admin123!', 'admin123!', 'admin123', 'password', 'Admin123'];

  console.log('\nTesting passwords:');
  for (const pwd of testPasswords) {
    const result = await bcrypt.compare(pwd, user.password);
    console.log(`  "${pwd}" => ${result ? 'MATCH!' : 'no match'}`);
  }

  // Show first 20 chars of hash for reference
  console.log('\nStored hash (first 50 chars):', user.password.substring(0, 50));

  // Generate new hash for reference
  const newHash = await bcrypt.hash('Admin123!', 12);
  console.log('Expected hash for "Admin123!":', newHash.substring(0, 50));

  await prisma.$disconnect();
}

debug();
