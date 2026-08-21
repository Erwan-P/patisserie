import { prisma } from "@/lib/prisma";
import HomeClient from "@/components/home/HomeClient";

export default async function Home() {
  // Fetch signature products ordered by signatureOrder
  const signatureProducts = await prisma.product.findMany({
    where: { isSignature: true },
    orderBy: { signatureOrder: 'asc' },
    include: { media: { orderBy: { order: 'asc' } } }
  });

  return (
    <HomeClient featuredProducts={signatureProducts} />
  );
}
