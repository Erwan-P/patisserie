"use server";

import { prisma } from "@/lib/prisma";
import { getVerifiedAdminSession } from "@/lib/admin-auth";
import { removeUnreferencedStorageUrls } from "@/lib/storage-cleanup";

export async function rebalanceSignatureOrders(tx: any, productId: string, targetOrder: number) {
  // Get all active signatures except the current one, ordered by their current signatureOrder
  const otherSignatures = await tx.product.findMany({
    where: {
      isSignature: true,
      id: { not: productId },
    },
    orderBy: { signatureOrder: "asc" },
  });

  // Re-build the correct list of orders
  let newOrderList = [];
  let inserted = false;

  let currentRank = 1;
  for (const sig of otherSignatures) {
    if (currentRank === targetOrder && !inserted) {
      newOrderList.push({ id: productId, order: currentRank });
      inserted = true;
      currentRank++;
    }
    newOrderList.push({ id: sig.id, order: currentRank });
    currentRank++;
  }

  if (!inserted) {
    newOrderList.push({ id: productId, order: currentRank });
  }

  // Update all items in the list
  for (const item of newOrderList) {
    await tx.product.update({
      where: { id: item.id },
      data: { signatureOrder: item.order },
    });
  }
}

export async function moveSignature(productId: string, direction: "UP" | "DOWN") {
  const session = await getVerifiedAdminSession();
  if (!session || session.user?.role !== "ADMIN") return { error: "Non autorisé" };

  try {
    await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({ where: { id: productId } });
      if (!product || !product.isSignature || !product.signatureOrder) return;

      const currentOrder = product.signatureOrder;
      const targetOrder = direction === "UP" ? currentOrder - 1 : currentOrder + 1;
      
      if (targetOrder < 1) return; // Already at top
      
      await rebalanceSignatureOrders(tx, productId, targetOrder);
    });
    return { success: true };
  } catch (error) {
    return { error: "Erreur lors du déplacement" };
  }
}

export async function createProduct(data: {
  name: string;
  description: string;
  price: number;
  category: string;
  inventory: number;
  isSignature?: boolean;
  signatureOrder?: number | null;
  media: { url: string, type: string, order: number }[];
}) {
  const session = await getVerifiedAdminSession();
  
  if (!session || session.user?.role !== "ADMIN") {
    return { error: "Non autorisé." };
  }

  try {
    const product = await prisma.$transaction(async (tx) => {
      // Find main image
      const mainImage = data.media.find(m => m.type === "IMAGE")?.url || data.media[0]?.url || null;

      const newProduct = await tx.product.create({
        data: {
          name: data.name,
          description: data.description,
          price: data.price,
          category: data.category as any,
          inventory: data.inventory,
          imageUrl: mainImage,
          isSignature: data.isSignature || false,
          signatureOrder: null, // we'll set this later via rebalance if needed
          media: {
            create: data.media
          }
        },
      });

      if (data.isSignature && data.signatureOrder) {
        await rebalanceSignatureOrders(tx, newProduct.id, data.signatureOrder);
      } else if (data.isSignature) {
        // Just append to the end
        await rebalanceSignatureOrders(tx, newProduct.id, 9999);
      }

      return newProduct;
    });

    return { success: true, product };
  } catch (error) {
    console.error("Create product error:", error);
    return { error: "Erreur lors de la création du produit." };
  }
}

export async function updateProduct(
  id: string,
  data: {
    name: string;
    description: string;
    price: number;
    category: string;
    inventory: number;
    isSignature?: boolean;
    signatureOrder?: number | null;
    media?: { url: string, type: string, order: number }[];
  }
) {
  const session = await getVerifiedAdminSession();
  
  if (!session || session.user?.role !== "ADMIN") {
    return { error: "Non autorisé." };
  }

  try {
    const previousMedia = data.media
      ? await prisma.product.findUnique({
          where: { id },
          select: { imageUrl: true, media: { select: { url: true } } },
        })
      : null;

    const product = await prisma.$transaction(async (tx) => {
      const updateData: any = {
        name: data.name,
        description: data.description,
        price: data.price,
        category: data.category as any,
        inventory: data.inventory,
        isSignature: data.isSignature || false,
        signatureOrder: data.isSignature ? undefined : null, // Clear order if not signature
      };

      if (data.media) {
        const mainImage = data.media.find(m => m.type === "IMAGE")?.url || data.media[0]?.url || null;
        updateData.imageUrl = mainImage;
      }

      const updated = await tx.product.update({
        where: { id },
        data: updateData,
      });

      if (data.media) {
        // Delete old media
        await tx.productMedia.deleteMany({ where: { productId: id } });
        // Create new media
        if (data.media.length > 0) {
          await tx.productMedia.createMany({
            data: data.media.map(m => ({
              productId: id,
              url: m.url,
              type: m.type,
              order: m.order
            }))
          });
        }
      }

      if (data.isSignature && data.signatureOrder) {
        await rebalanceSignatureOrders(tx, id, data.signatureOrder);
      } else if (data.isSignature && !updated.signatureOrder) {
        // Just newly made signature without specific order, append to end
        await rebalanceSignatureOrders(tx, id, 9999);
      }

      return updated;
    });

    if (previousMedia && data.media) {
      const retainedUrls = new Set(data.media.map((media) => media.url));
      const removedUrls = [previousMedia.imageUrl, ...previousMedia.media.map((media) => media.url)]
        .filter((url): url is string => Boolean(url) && !retainedUrls.has(url as string));
      try {
        await removeUnreferencedStorageUrls(removedUrls);
      } catch (cleanupError) {
        console.error("Product media cleanup error:", cleanupError);
      }
    }

    return { success: true, product };
  } catch (error) {
    console.error("Update product error:", error);
    return { error: "Erreur lors de la modification du produit." };
  }
}

export async function deleteProduct(id: string) {
  const session = await getVerifiedAdminSession();
  
  if (!session || session.user?.role !== "ADMIN") {
    return { error: "Non autorisé." };
  }

  try {
    const product = await prisma.product.findUnique({
      where: { id },
      select: { imageUrl: true, media: { select: { url: true } } },
    });
    if (!product) return { error: "Produit introuvable." };

    await prisma.product.delete({
      where: { id },
    });

    try {
      await removeUnreferencedStorageUrls([
        product.imageUrl,
        ...product.media.map((media) => media.url),
      ]);
    } catch (cleanupError) {
      console.error("Deleted product media cleanup error:", cleanupError);
    }

    return { success: true };
  } catch (error) {
    console.error("Delete product error:", error);
    return { error: "Erreur lors de la suppression du produit." };
  }
}

export async function incrementProductView(productId: string) {
  try {
    await prisma.product.update({
      where: { id: productId },
      data: { views: { increment: 1 } },
    });
  } catch (error) {
    console.error("Error incrementing product view:", error);
  }
}
