import "server-only";

import { prisma } from "@/lib/prisma";
import { getStorageClient, STORAGE_BUCKET } from "@/lib/storage";

const RESERVED_SITE_OBJECTS = new Set([
  "site/bakery-interior.jpg",
  "site/founders-bakery.jpg",
  "site/hero.jpg",
  "site/logo.jpg",
  "site/placeholder_pastry.jpg",
]);

function storageObjectPath(url: string) {
  const supabaseUrl = process.env.SUPABASE_URL;
  if (!supabaseUrl) return null;

  try {
    const parsed = new URL(url);
    if (parsed.origin !== new URL(supabaseUrl).origin) return null;

    const prefix = `/storage/v1/object/public/${encodeURIComponent(STORAGE_BUCKET)}/`;
    if (!parsed.pathname.startsWith(prefix)) return null;

    return parsed.pathname
      .slice(prefix.length)
      .split("/")
      .map((part) => decodeURIComponent(part))
      .join("/");
  } catch {
    return null;
  }
}

export async function removeUnreferencedStorageUrls(urls: Array<string | null | undefined>) {
  const candidates = [...new Set(urls.filter((url): url is string => Boolean(url)))];
  const removablePaths: string[] = [];

  for (const url of candidates) {
    const objectPath = storageObjectPath(url);
    if (!objectPath || RESERVED_SITE_OBJECTS.has(objectPath)) continue;

    const [productReferences, mediaReferences] = await Promise.all([
      prisma.product.count({ where: { imageUrl: url } }),
      prisma.productMedia.count({ where: { url } }),
    ]);

    if (productReferences === 0 && mediaReferences === 0) {
      removablePaths.push(objectPath);
    }
  }

  if (removablePaths.length === 0) return [];

  const supabase = getStorageClient();
  const { error } = await supabase.storage.from(STORAGE_BUCKET).remove(removablePaths);
  if (error) throw new Error(`Nettoyage Supabase Storage impossible: ${error.message}`);

  return removablePaths;
}
