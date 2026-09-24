import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, "");
const secretKey = process.env.SUPABASE_SECRET_KEY;
const bucket = process.env.SUPABASE_STORAGE_BUCKET || "product-media";

const verifiedUnusedObjects = [
  "site/croissant.jpg",
  "site/eclair.jpg",
  "site/macarons.jpg",
  "site/mille-feuille.jpg",
  "site/pain-au-chocolat.jpg",
  "site/paris_brest.jpg",
  "site/tarte-citron.jpg",
];

if (!supabaseUrl || !secretKey) {
  console.log("[storage-cleanup] Variables Supabase absentes; suppression ponctuelle ignorée.");
  process.exit(0);
}

const supabase = createClient(supabaseUrl, secretKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const { error } = await supabase.storage.from(bucket).remove(verifiedUnusedObjects);
if (error) throw new Error(`Suppression des doublons Storage impossible: ${error.message}`);
console.log(`[storage-cleanup] ${verifiedUnusedObjects.length} objets inutilisés ciblés et supprimés.`);
