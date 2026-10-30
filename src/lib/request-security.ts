import "server-only";
import { headers } from "next/headers";
import { consumeRateLimit } from "@/lib/rate-limit";

export async function requestAddress() {
  const requestHeaders = await headers();
  // Vercel overwrites this header. Never trust arbitrary forwarded headers
  // on a self-hosted server without an explicitly configured trusted proxy.
  return process.env.VERCEL === "1"
    ? requestHeaders.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() || "unknown"
    : "local";
}

export async function publicRequestBudget(scope: string, subject: string, limit: number, windowMs: number) {
  if (!await consumeRateLimit(`${scope}:global`, "all", { limit: 300, windowMs })) return false;
  if (!await consumeRateLimit(`${scope}:ip`, await requestAddress(), { limit: 30, windowMs })) return false;
  return consumeRateLimit(`${scope}:account`, subject, { limit, windowMs });
}
