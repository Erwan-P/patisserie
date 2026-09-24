const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Update Pain au Chocolat (cmss3rzdn0000msk0c4bgpc3t)
  await prisma.product.update({
    where: { id: "cmss3rzdn0000msk0c4bgpc3t" },
    data: { imageUrl: "/images/pain_au_chocolat.jpg" }
  });
  // Update its ProductMedia
  await prisma.productMedia.updateMany({
    where: { productId: "cmss3rzdn0000msk0c4bgpc3t" },
    data: { url: "/images/pain_au_chocolat.jpg" }
  });

  // Update Mille-Feuille (cmss3rzdz0002msk0pirewfws)
  await prisma.product.update({
    where: { id: "cmss3rzdz0002msk0pirewfws" },
    data: { imageUrl: "/images/mille_feuille.jpg" }
  });
  // Update its ProductMedia
  await prisma.productMedia.updateMany({
    where: { productId: "cmss3rzdz0002msk0pirewfws" },
    data: { url: "/images/mille_feuille.jpg" }
  });

  // Update Tarte Citron Meringuée ProductMedia (replace unsplash)
  // Product id is cmsp86rdc0001msdokymh16am, media id is cmss1cv4x0003ms48cmdonnsl
  await prisma.productMedia.update({
    where: { id: "cmss1cv4x0003ms48cmdonnsl" },
    data: { url: "/images/tarte_citron.jpg" }
  });

  console.log("Images updated successfully!");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
