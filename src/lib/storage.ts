import "server-only";

import { createClient } from "@supabase/supabase-js";

export const STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "product-media";

function requireStorageConfig() {
  const url = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!url || !secretKey) {
    throw new Error("Supabase Storage n'est pas configuré.");
  }

  return { url: url.replace(/\/$/, ""), secretKey };
}

export function getStorageClient() {
  const { url, secretKey } = requireStorageConfig();

  return createClient(url, secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function getPublicStorageUrl(objectPath: string) {
  const { url } = requireStorageConfig();
  const encodedPath = objectPath
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");

  return `${url}/storage/v1/object/public/${encodeURIComponent(STORAGE_BUCKET)}/${encodedPath}`;
}

export function getSiteAssetUrl(filename: string, fallback?: string) {
  try {
    return getPublicStorageUrl(`site/${filename}`);
  } catch {
    return fallback || `/images/${filename}`;
  }
}
