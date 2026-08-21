import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany();
  
  for (const product of products) {
    // Clear existing media just in case
    await prisma.productMedia.deleteMany({
      where: { productId: product.id }
    });

    if (product.name.toLowerCase().includes('croissant')) {
      await prisma.productMedia.create({
        data: {
          productId: product.id,
          url: "https://www.w3schools.com/html/mov_bbb.mp4",
          type: "VIDEO",
          order: 1
        }
      });
      await prisma.productMedia.create({
        data: {
          productId: product.id,
          url: product.imageUrl || "/images/placeholder.jpg",
          type: "IMAGE",
          order: 2
        }
      });
    } else if (product.name.toLowerCase().includes('tarte')) {
      await prisma.productMedia.create({
        data: {
          productId: product.id,
          url: product.imageUrl || "/images/placeholder.jpg",
          type: "IMAGE",
          order: 1
        }
      });
      // Add a dummy 2nd image
      await prisma.productMedia.create({
        data: {
          productId: product.id,
          url: "https://images.unsplash.com/photo-1519869325930-281384150729?auto=format&fit=crop&q=80&w=800",
          type: "IMAGE",
          order: 2
        }
      });
    } else {
      // Just migrate their imageUrl to media
      if (product.imageUrl) {
        await prisma.productMedia.create({
          data: {
            productId: product.id,
            url: product.imageUrl,
            type: "IMAGE",
            order: 1
          }
        });
      }
    }
  }

  console.log("Media seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
