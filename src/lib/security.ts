import { createHmac } from "node:crypto";

export function normalizeEmail(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 254) return null;
  const email = value.normalize("NFKC").trim().toLowerCase();
  return /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?\.[a-z]{2,63}$/.test(email)
    ? email : null;
}

export function securityDigest(value: string) {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("NEXTAUTH_SECRET doit être configuré.");
  return createHmac("sha256", secret).update(value).digest("hex");
}

export function credentialVersion(user: { id: string; role: string; password: string | null; twoFactorHash: string | null }) {
  return securityDigest(JSON.stringify([user.id, user.role, user.password, user.twoFactorHash]));
}

export function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!);
}

export function safeMediaUrl(value: unknown) {
  if (typeof value !== "string" || value.length > 2048) throw new Error("URL de média invalide.");
  if (/^\/images\/[a-zA-Z0-9/_-]+\.(?:jpe?g|png|webp|gif)$/i.test(value)) return value;
  const url = new URL(value);
  const storageHost = process.env.SUPABASE_URL ? new URL(process.env.SUPABASE_URL).hostname : null;
  if (url.protocol !== "https:" || url.username || url.password || url.port ||
      ![storageHost, "upload.wikimedia.org", "images.unsplash.com"].includes(url.hostname)) {
    throw new Error("Le domaine du média n'est pas autorisé.");
  }
  if (url.hostname === storageHost && !url.pathname.startsWith("/storage/v1/object/public/")) {
    throw new Error("Le média doit provenir du stockage public.");
  }
  return url.toString();
}

export function boundedText(value: unknown, label: string, maximum: number, allowEmpty = false) {
  if (typeof value !== "string" || value.length > maximum || (!allowEmpty && !value.trim())) {
    throw new Error(`${label} invalide.`);
  }
  return value.trim();
}
