import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function main() {
  console.log('Importing data to MySQL...');
  
  const rawData = fs.readFileSync('prisma/data_dump.json', 'utf8');
  const data = JSON.parse(rawData);

  // Clear existing (if any)
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.productMedia.deleteMany();
  await prisma.product.deleteMany();
  await prisma.storeSettings.deleteMany();
  await prisma.user.deleteMany();

  console.log('Inserting Users...');
  for (const user of data.users) {
    await prisma.user.create({ data: user });
  }

  console.log('Inserting StoreSettings...');
  for (const setting of data.storeSettings) {
    await prisma.storeSettings.create({ data: setting });
  }

  console.log('Inserting Products...');
  for (const product of data.products) {
    await prisma.product.create({ data: product });
  }

  console.log('Inserting ProductMedia...');
  for (const media of data.productMedia) {
    await prisma.productMedia.create({ data: media });
  }

  console.log('Inserting Orders...');
  for (const order of data.orders) {
    await prisma.order.create({ data: order });
  }

  console.log('Inserting OrderItems...');
  for (const item of data.orderItems) {
    await prisma.orderItem.create({ data: item });
  }

  console.log('Data imported successfully!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
