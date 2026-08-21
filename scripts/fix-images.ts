import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const painAuChoc = await prisma.product.findFirst({ where: { name: { contains: "Pain au Chocolat" } }});
  if (painAuChoc) {
    const validUrl = "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Croissant_and_pain_au_chocolat.jpg/800px-Croissant_and_pain_au_chocolat.jpg";
    await prisma.product.update({ where: { id: painAuChoc.id }, data: { imageUrl: validUrl } });
    await prisma.productMedia.updateMany({ where: { productId: painAuChoc.id }, data: { url: validUrl } });
  }

  const mille = await prisma.product.findFirst({ where: { name: { contains: "Mille-Feuille" } }});
  if (mille) {
    const validUrl2 = "https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Mille-feuille_1.jpg/800px-Mille-feuille_1.jpg";
    await prisma.product.update({ where: { id: mille.id }, data: { imageUrl: validUrl2 } });
    await prisma.productMedia.updateMany({ where: { productId: mille.id }, data: { url: validUrl2 } });
  }
  
  console.log("Images fixed with reliable Wikimedia URLs");
}

main().finally(() => prisma.$disconnect());
