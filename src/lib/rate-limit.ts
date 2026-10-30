import { Prisma } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { securityDigest } from "@/lib/security";

export type RateLimitPolicy = { limit: number; windowMs: number; cooldownMs?: number };

// One PostgreSQL statement reserves the attempt before any expensive operation.
// ON CONFLICT takes a row lock, so concurrent requests cannot lose increments.
export function rateLimitQuery(identifier: string, policy: RateLimitPolicy, now = new Date()) {
  const expires = new Date(now.getTime() + policy.windowMs);
  const cooldownBefore = new Date(now.getTime() - (policy.cooldownMs ?? 0));
  return Prisma.sql`
    INSERT INTO "RateLimit" ("id", "identifier", "attempts", "lockedAt", "updatedAt")
    VALUES (${randomUUID()}, ${identifier}, 1, ${expires}, ${now})
    ON CONFLICT ("identifier") DO UPDATE SET
      "attempts" = CASE WHEN "RateLimit"."lockedAt" IS NULL OR "RateLimit"."lockedAt" <= ${now}
        THEN 1 ELSE "RateLimit"."attempts" + 1 END,
      "lockedAt" = CASE WHEN "RateLimit"."lockedAt" IS NULL OR "RateLimit"."lockedAt" <= ${now}
        THEN ${expires} ELSE "RateLimit"."lockedAt" END,
      "updatedAt" = ${now}
    WHERE "RateLimit"."lockedAt" IS NULL OR "RateLimit"."lockedAt" <= ${now}
      OR ("RateLimit"."attempts" < ${policy.limit} AND "RateLimit"."updatedAt" <= ${cooldownBefore})
    RETURNING "attempts"
  `;
}

export async function consumeRateLimit(scope: string, subject: string, policy: RateLimitPolicy) {
  const identifier = `rl:${scope}:${securityDigest(subject)}`;
  const result = await prisma.$queryRaw<Array<{ attempts: number }>>(rateLimitQuery(identifier, policy));
  // Expire only this limiter's old records. A fixed namespace and global quota
  // bound the number of per-address rows created through public endpoints.
  if (Math.random() < 0.01) {
    await prisma.rateLimit.deleteMany({
      where: { identifier: { startsWith: "rl:" }, updatedAt: { lt: new Date(Date.now() - 86400000) } },
    });
  }
  return result.length === 1;
}
