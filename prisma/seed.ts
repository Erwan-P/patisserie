import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from "bcryptjs";

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

  const products = [
    {
      name: "Tarte Citron Meringuée",
      description: "Le grand classique revisité : un crémeux citron jaune de Menton peps et acidulé, surmonté d'une meringue suisse légère et onctueuse, le tout reposant sur une pâte sablée croustillante aux amandes torréfiées.",
      price: 5.50,
      imageUrl: "/images/hero.jpg",
      category: "TARTES",
      isSignature: true,
      signatureOrder: 1,
      inventory: 50
    },
    {
      name: "L'Éclair Intense",
      description: "Pour les puristes du cacao : une pâte à choux à la perfection croquante, renfermant un crémeux extrêmement onctueux au chocolat noir grand cru 70%. Une longueur en bouche exceptionnelle.",
      price: 4.80,
      imageUrl: "/images/eclair.jpg",
      category: "PATISSERIE",
      isSignature: true,
      signatureOrder: 2,
      inventory: 30
    },
    {
      name: "Croissant Signature",
      description: "Le roi du petit-déjeuner : feuilletage pur beurre AOP extra-fin, croustillant à l'extérieur avec une mie filante, moelleuse et parfaitement alvéolée à l'intérieur. Cuit du matin même.",
      price: 1.90,
      imageUrl: "/images/croissant.jpg",
      category: "VIENNOISERIE",
      isSignature: true,
      signatureOrder: 3,
      inventory: 100
    }
  ];

  for (const p of products) {
    const existing = await prisma.product.findFirst({ where: { name: p.name } });
    if (existing) {
      await prisma.product.update({
        where: { id: existing.id },
        data: p,
      });
    } else {
      await prisma.product.create({
        data: p,
      });
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
