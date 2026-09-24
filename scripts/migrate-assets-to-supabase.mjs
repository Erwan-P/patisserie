import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, "");
const secretKey = process.env.SUPABASE_SECRET_KEY;
const bucket = process.env.SUPABASE_STORAGE_BUCKET || "product-media";

if (!supabaseUrl || !secretKey) {
  console.log("[storage-migration] Supabase Storage variables absent; migration skipped.");
  process.exit(0);
}

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const imagesDir = path.join(projectRoot, "public", "images");
const prisma = new PrismaClient();
const supabase = createClient(supabaseUrl, secretKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const mimeByExtension = {
  ".gif": "image/gif",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

function publicUrl(objectPath) {
  const encodedPath = objectPath.split("/").map(encodeURIComponent).join("/");
  return `${supabaseUrl}/storage/v1/object/public/${encodeURIComponent(bucket)}/${encodedPath}`;
}

async function upload(objectPath, bytes, contentType) {
  const { error } = await supabase.storage.from(bucket).upload(objectPath, bytes, {
    contentType,
    cacheControl: "31536000",
    upsert: true,
  });
  if (error) throw new Error(`Upload ${objectPath}: ${error.message}`);
  return publicUrl(objectPath);
}

function productionOrigin() {
  const hostname = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  return hostname ? `https://${hostname}` : null;
}

async function migrateRemoteUrl(sourceUrl) {
  const absoluteUrl = sourceUrl.startsWith("/")
    ? new URL(sourceUrl, productionOrigin() || "http://localhost").toString()
    : sourceUrl;
  const response = await fetch(absoluteUrl);
  if (!response.ok) throw new Error(`Téléchargement ${sourceUrl}: HTTP ${response.status}`);

  const contentType = response.headers.get("content-type")?.split(";")[0] || "";
  if (!contentType.startsWith("image/")) {
    throw new Error(`Le média ${sourceUrl} n'est pas une image (${contentType || "type inconnu"}).`);
  }

  const bytes = Buffer.from(await response.arrayBuffer());
  const extension = Object.entries(mimeByExtension).find(([, mime]) => mime === contentType)?.[0] || ".jpg";
  const digest = createHash("sha256").update(bytes).digest("hex").slice(0, 24);
  return upload(`products/legacy/${digest}${extension}`, bytes, contentType);
}

async function main() {
  const { data: bucketInfo, error: bucketError } = await supabase.storage.getBucket(bucket);
  if (bucketError || !bucketInfo) {
    throw new Error(`Bucket Supabase '${bucket}' introuvable: ${bucketError?.message || "réponse vide"}`);
  }
  if (!bucketInfo.public) {
    throw new Error(`Le bucket Supabase '${bucket}' doit être public.`);
  }

  const filenames = await readdir(imagesDir);
  const localUrls = new Map();
  let uploadedAssets = 0;

  for (const filename of filenames.sort()) {
    const extension = path.extname(filename).toLowerCase();
    const contentType = mimeByExtension[extension];
    if (!contentType) continue;
    const bytes = await readFile(path.join(imagesDir, filename));
    localUrls.set(`/images/${filename}`, await upload(`site/${filename}`, bytes, contentType));
    uploadedAssets++;
  }

  const migratedUrls = new Map(localUrls);
  const migrateUrl = async (url) => {
    if (!url || url.startsWith(`${supabaseUrl}/storage/v1/object/public/${bucket}/`)) return url;
    if (migratedUrls.has(url)) return migratedUrls.get(url);
    const migrated = await migrateRemoteUrl(url);
    migratedUrls.set(url, migrated);
    return migrated;
  };

  const products = await prisma.product.findMany({
    select: { id: true, imageUrl: true, media: { select: { id: true, url: true, type: true, order: true } } },
  });

  let updatedProducts = 0;
  let updatedMedia = 0;
  await prisma.$transaction(async (tx) => {
    for (const product of products) {
      const migratedMedia = [];
      for (const media of product.media) {
        const url = media.type === "IMAGE" ? await migrateUrl(media.url) : media.url;
        migratedMedia.push({ ...media, url });
        if (url !== media.url) {
          await tx.productMedia.update({ where: { id: media.id }, data: { url } });
          updatedMedia++;
        }
      }

      const primaryMedia = migratedMedia
        .filter((media) => media.type === "IMAGE")
        .sort((a, b) => a.order - b.order)[0];
      const imageUrl = primaryMedia?.url || await migrateUrl(product.imageUrl);
      if (imageUrl !== product.imageUrl) {
        await tx.product.update({ where: { id: product.id }, data: { imageUrl } });
        updatedProducts++;
      }
    }
  });

  console.log(`[storage-migration] ${uploadedAssets} fichiers du site envoyés, ${updatedProducts} produits et ${updatedMedia} médias mis à jour.`);
}

main()
  .catch((error) => {
    console.error("[storage-migration] Échec:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
