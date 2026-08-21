import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const p1 = await prisma.product.create({
    data: {
      name: "Pain au Chocolat",
      description: "Notre pain au chocolat pur beurre, avec deux généreuses barres de chocolat noir 70%. Croustillant à l'extérieur, fondant à l'intérieur.",
      price: 2.20,
      inventory: 50,
      category: "VIENNOISERIE",
      isSignature: false,
      media: {
        create: [
          {
            url: "https://images.unsplash.com/photo-1549903072-7e6e0d20d43a?auto=format&fit=crop&q=80&w=800",
            type: "IMAGE",
            order: 1
          }
        ]
      }
    }
  });

  const p2 = await prisma.product.create({
    data: {
      name: "Mille-Feuille Vanille",
      description: "Pâte feuilletée inversée caramélisée, crème légère à la vanille Bourbon de Madagascar. Un grand classique revisité pour plus de légèreté.",
      price: 6.50,
      inventory: 20,
      category: "PATISSERIE",
      isSignature: false,
      media: {
        create: [
          {
            url: "https://images.unsplash.com/photo-1488477304112-4944851de03d?auto=format&fit=crop&q=80&w=800",
            type: "IMAGE",
            order: 1
          }
        ]
      }
    }
  });

  // Prisma requires imageUrl to be manually updated if we rely on it, but we use product.media[0] now as fallback.
  await prisma.product.update({ where: { id: p1.id }, data: { imageUrl: "https://images.unsplash.com/photo-1549903072-7e6e0d20d43a?auto=format&fit=crop&q=80&w=800" }});
  await prisma.product.update({ where: { id: p2.id }, data: { imageUrl: "https://images.unsplash.com/photo-1488477304112-4944851de03d?auto=format&fit=crop&q=80&w=800" }});

  console.log("Added 2 normal products!");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
