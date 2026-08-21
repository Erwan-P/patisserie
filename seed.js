const { PrismaClient } = require('./src/generated/prisma');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('admin123', 10);
  const twoFactorHash = await bcrypt.hash('123456', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@gmail.com' },
    update: {
      password,
      twoFactorHash,
      role: 'ADMIN'
    },
    create: {
      email: 'admin@gmail.com',
      name: 'Administrateur',
      password,
      twoFactorHash,
      role: 'ADMIN'
    }
  });
  console.log('Admin seeded:', admin.email);
}

main().catch(console.error).finally(() => prisma.$disconnect());
