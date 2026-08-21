import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const painAuChoc = await prisma.product.findFirst({ where: { name: "Pain au Chocolat" }});
  if (painAuChoc) {
    const validUrl = "https://images.unsplash.com/photo-1530610476181-d83430b64dcb?auto=format&fit=crop&q=80&w=800";
    await prisma.product.update({
      where: { id: painAuChoc.id },
      data: { imageUrl: validUrl }
    });
    
    await prisma.productMedia.updateMany({
      where: { productId: painAuChoc.id },
      data: { url: validUrl }
    });
    console.log("Image updated");
  }
}

main().finally(() => prisma.$disconnect());
