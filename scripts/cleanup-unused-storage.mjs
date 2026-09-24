import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, "");
const secretKey = process.env.SUPABASE_SECRET_KEY;
const bucket = process.env.SUPABASE_STORAGE_BUCKET || "product-media";
const shouldDelete = process.argv.includes("--delete");

if (!supabaseUrl || !secretKey) {
  console.log("[storage-cleanup] Variables Supabase absentes; nettoyage ignoré.");
  process.exit(0);
}

const reservedObjects = new Set([
  "site/bakery-interior.jpg",
  "site/founders-bakery.jpg",
  "site/hero.jpg",
  "site/logo.jpg",
  "site/placeholder_pastry.jpg",
]);
const prisma = new PrismaClient();
const supabase = createClient(supabaseUrl, secretKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function objectPathFromUrl(url) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.origin !== new URL(supabaseUrl).origin) return null;
    const prefix = `/storage/v1/object/public/${encodeURIComponent(bucket)}/`;
    if (!parsed.pathname.startsWith(prefix)) return null;
    return parsed.pathname.slice(prefix.length).split("/").map(decodeURIComponent).join("/");
  } catch {
    return null;
  }
}

async function listObjects(prefix = "") {
  const { data, error } = await supabase.storage.from(bucket).list(prefix, {
    limit: 1000,
    sortBy: { column: "name", order: "asc" },
  });
  if (error) throw new Error(`Liste Storage impossible (${prefix || "racine"}): ${error.message}`);

  const objects = [];
  for (const entry of data || []) {
    const objectPath = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.id) objects.push(objectPath);
    else objects.push(...await listObjects(objectPath));
  }
  return objects;
}

async function main() {
  const products = await prisma.product.findMany({
    select: { imageUrl: true, media: { select: { url: true } } },
  });
  const referenced = new Set(reservedObjects);
  for (const product of products) {
    const urls = [product.imageUrl, ...product.media.map((media) => media.url)];
    for (const url of urls) {
      const objectPath = objectPathFromUrl(url);
      if (objectPath) referenced.add(objectPath);
    }
  }

  const objects = await listObjects();
  const unused = objects.filter((objectPath) => !referenced.has(objectPath));
  console.log(`[storage-cleanup] ${objects.length} objets, ${referenced.size} références, ${unused.length} inutilisés.`);
  for (const objectPath of unused) console.log(`[storage-cleanup] inutilisé: ${objectPath}`);

  if (!shouldDelete || unused.length === 0) return;
  const { error } = await supabase.storage.from(bucket).remove(unused);
  if (error) throw new Error(`Suppression Storage impossible: ${error.message}`);
  console.log(`[storage-cleanup] ${unused.length} objets supprimés.`);
}

main()
  .catch((error) => {
    console.error("[storage-cleanup] Échec:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
