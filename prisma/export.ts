import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function main() {
  console.log('Exporting data from SQLite...');
  
  const users = await prisma.user.findMany();
  const products = await prisma.product.findMany();
  const productMedia = await prisma.productMedia.findMany();
  const storeSettings = await prisma.storeSettings.findMany();
  const orders = await prisma.order.findMany();
  const orderItems = await prisma.orderItem.findMany();

  const data = {
    users,
    products,
    productMedia,
    storeSettings,
    orders,
    orderItems
  };

  fs.writeFileSync('prisma/data_dump.json', JSON.stringify(data, null, 2));
  console.log('Data exported successfully to prisma/data_dump.json!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
