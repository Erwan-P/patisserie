import assert from "node:assert/strict";
import { test } from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { credentialVersion, escapeHtml, normalizeEmail, safeMediaUrl } from "../src/lib/security";
import { rateLimitQuery } from "../src/lib/rate-limit";
import { createAdmin2FAToken, verifyAdmin2FAToken } from "../src/lib/admin-2fa";
import { validateProduct, validateSettings } from "../src/lib/validation";
import { profileSelect } from "../src/lib/profile";
import { isSameOriginRequest } from "../src/lib/browser-request";
import { authOptions } from "../src/lib/auth";
import { prisma } from "../src/lib/prisma";
import type { JWT } from "next-auth/jwt";
import type { User } from "next-auth";

process.env.NEXTAUTH_SECRET = "isolated-test-key-".repeat(4);
process.env.SUPABASE_URL = "https://test-project.supabase.co";

test("e-mail normalization rejects multiple recipients, CRLF, HTML and oversized input", () => {
  assert.equal(normalizeEmail(" Client@Example.fr "), "client@example.fr");
  for (const address of ["a@example.fr,b@evil.fr", "a@example.fr\r\nBcc:b@evil.fr", "<a@example.fr>", "a".repeat(260), null, {}]) {
    assert.equal(normalizeEmail(address), null);
  }
});

test("changing either secret or the role revokes the credential fingerprint", () => {
  const user = { id: "admin-test", role: "ADMIN", password: "hash-password-a", twoFactorHash: "hash-pin-a" };
  const version = credentialVersion(user);
  assert.equal(version.length, 64);
  for (const changes of [{ role: "USER" }, { password: "hash-password-b" }, { twoFactorHash: "hash-pin-b" }]) {
    assert.notEqual(credentialVersion({ ...user, ...changes }), version);
  }
  assert(!version.includes(user.password));
});

test("2FA proof is signed and bound to its account, session and credential version", async () => {
  const token = await createAdmin2FAToken("admin-a", "credentials-a:session-a");
  assert(await verifyAdmin2FAToken(token, "admin-a", "credentials-a:session-a"));
  assert(!await verifyAdmin2FAToken(token, "admin-b", "credentials-a:session-a"));
  assert(!await verifyAdmin2FAToken(token, "admin-a", "credentials-a:session-b"));
  assert(!await verifyAdmin2FAToken(token, "admin-a", "credentials-b:session-a"));
  const [payload, signature] = token.split(".");
  const forged = Buffer.from(JSON.stringify({ userId: "admin-b", binding: "credentials-a:session-a", expiresAt: 9999999999 })).toString("base64url");
  assert(!await verifyAdmin2FAToken(`${forged}.${signature}`, "admin-b", "credentials-a:session-a"));
  assert(!await verifyAdmin2FAToken(`${payload}.invalid`, "admin-a", "credentials-a:session-a"));
  assert(!await verifyAdmin2FAToken("true", "admin-a", "credentials-a:session-a"));
  assert(!await verifyAdmin2FAToken(undefined, "admin-a", "credentials-a:session-a"));
});

test("expired 2FA proof is rejected", async () => {
  const realNow = Date.now;
  Date.now = () => realNow() - 31 * 60000;
  let token: string;
  try { token = await createAdmin2FAToken("admin-a", "session-a"); } finally { Date.now = realNow; }
  assert(!await verifyAdmin2FAToken(token, "admin-a", "session-a"));
});

test("profile DTO excludes all password and verification fields", () => {
  assert.deepEqual(Object.keys(profileSelect).sort(), ["email", "id", "name", "orders", "role"]);
  assert(!JSON.stringify(profileSelect).includes("password"));
  assert(!JSON.stringify(profileSelect).includes("twoFactorHash"));
});

test("media URLs reject executable schemes, external hosts and credential URLs", () => {
  assert.equal(safeMediaUrl("/images/hero.jpg"), "/images/hero.jpg");
  assert.equal(safeMediaUrl("https://test-project.supabase.co/storage/v1/object/public/product-media/image.jpg"), "https://test-project.supabase.co/storage/v1/object/public/product-media/image.jpg");
  for (const value of ["javascript:alert(1)", "//evil.fr/x.jpg", "https://evil.fr/x.jpg", "http://images.unsplash.com/x.jpg", "https://user:secret@images.unsplash.com/x.jpg", "https://test-project.supabase.co/rest/v1/User"]) {
    assert.throws(() => safeMediaUrl(value));
  }
});

test("product validation strips nested extra writes and rejects invalid quantities", () => {
  const input = { name: "Tarte", description: "Citron", price: 5, category: "TARTES", inventory: 10, media: [{ url: "/images/hero.jpg", type: "IMAGE", order: 3, product: { delete: true } }], role: "ADMIN" };
  const output = validateProduct(input, true);
  assert(!("role" in output));
  assert.deepEqual(output.media, [{ url: "/images/hero.jpg", type: "IMAGE", order: 1 }]);
  for (const patch of [{ price: NaN }, { price: -1 }, { inventory: -1 }, { inventory: 1.5 }, { isSignature: "yes" }]) {
    assert.throws(() => validateProduct({ ...input, ...patch } as typeof input, true));
  }
});

test("settings validation strips injected identifiers and preserves French schedules", () => {
  const input = { id: "OTHER", phone: "+33 1 23 45 67 89", email: "contact@example.fr", address: "Paris", isVacationMode: false,
    hoursMonday: "Fermé", hoursTuesday: "08:00 - 19:30", hoursWednesday: "08:00 - 12:00, 14:00 - 19:30",
    hoursThursday: "08:00 - 19:30", hoursFriday: "08:00 - 19:30", hoursSaturday: "08:00 - 19:30", hoursSunday: "08:00 - 14:00" };
  assert(!("id" in validateSettings(input)));
  assert.throws(() => validateSettings({ ...input, hoursMonday: "<script>" }));
});

test("untrusted names are escaped in e-mail markup", () => {
  assert.equal(escapeHtml('<img src="x" onerror="alert(1)"> &'), "&lt;img src=&quot;x&quot; onerror=&quot;alert(1)&quot;&gt; &amp;");
});

test("browser mutation rejects absent, opaque and foreign origins", () => {
  const previous = process.env.NEXTAUTH_URL;
  process.env.NEXTAUTH_URL = "https://demo.example.fr";
  try {
    assert(isSameOriginRequest(new Request("https://demo.example.fr/api/checkout", { headers: { origin: "https://demo.example.fr" } })));
    for (const origin of ["https://evil.fr", "null", "http://demo.example.fr"]) {
      assert(!isSameOriginRequest(new Request("https://demo.example.fr/api/checkout", { headers: { origin } })));
    }
    assert(!isSameOriginRequest(new Request("https://demo.example.fr/api/checkout")));
  } finally { if (previous === undefined) delete process.env.NEXTAUTH_URL; else process.env.NEXTAUTH_URL = previous; }
});

test("actual auth JWT callback rejects old, deleted, demoted and rotated sessions", async () => {
  let current: { id: string; role: string; password: string; twoFactorHash: string } | null = {
    id: "admin-test", role: "ADMIN", password: "hash-password-a", twoFactorHash: "hash-pin-a",
  };
  const originalLookup = prisma.user.findUnique;
  prisma.user.findUnique = (async () => current) as unknown as typeof originalLookup;
  const callback = authOptions.callbacks!.jwt!;
  const invoke = async (token: JWT, user?: User) => callback({ token, ...(user ? { user } : {}), account: null } as Parameters<typeof callback>[0]);
  try {
    const token = await invoke({}, { id: "admin-test" });
    assert.equal(token.role, "ADMIN");
    assert.equal((await invoke({ ...token })).securityVersion, token.securityVersion);
    await assert.rejects(() => invoke({ id: "admin-test", role: "ADMIN" }), /révoquée/);
    current = { ...current!, role: "USER" };
    await assert.rejects(() => invoke({ ...token }), /révoquée/);
    current = { ...current, role: "ADMIN", password: "hash-password-b" };
    await assert.rejects(() => invoke({ ...token }), /révoquée/);
    current = null;
    await assert.rejects(() => invoke({ ...token }), /révoquée/);
  } finally { prisma.user.findUnique = originalLookup; }
});

test("actual e-mail callback denies administrator magic-link redemption", async () => {
  const originalLookup = prisma.user.findUnique;
  prisma.user.findUnique = (async () => ({ role: "ADMIN" })) as unknown as typeof originalLookup;
  const callback = authOptions.callbacks!.signIn!;
  try {
    const result = await callback({ user: { id: "admin-test", email: "admin@example.fr" }, account: { provider: "email", type: "email", providerAccountId: "admin@example.fr" } });
    assert.equal(result, false);
  } finally { prisma.user.findUnique = originalLookup; }
});

test("PostgreSQL reserves exactly 5 attempts under concurrency and resets expired windows", async () => {
  const db = new PGlite();
  try {
    await db.exec('CREATE TABLE "RateLimit" ("id" text PRIMARY KEY, "identifier" text UNIQUE NOT NULL, "attempts" integer NOT NULL, "lockedAt" timestamp, "updatedAt" timestamp NOT NULL)');
    const now = new Date("2026-01-01T00:00:00Z");
    const reserve = async (key: string, time = now, cooldownMs = 0) => {
      const query = rateLimitQuery(key, { limit: 5, windowMs: 60000, cooldownMs }, time);
      return (await db.query(query.text, query.values)).rows.length === 1;
    };
    const results = await Promise.all(Array.from({ length: 40 }, () => reserve("concurrent")));
    assert.equal(results.filter(Boolean).length, 5);
    assert.equal((await db.query<{ attempts: number }>('SELECT "attempts" FROM "RateLimit" WHERE "identifier" = $1', ["concurrent"])).rows[0].attempts, 5);
    assert(await reserve("independent"));
    assert(await reserve("concurrent", new Date(now.getTime() + 60001)));
    assert(await reserve("cooldown", now, 30000));
    assert(!await reserve("cooldown", new Date(now.getTime() + 1000), 30000));
    assert(!await reserve("cooldown", new Date(now.getTime() + 29000), 30000));
    assert(await reserve("cooldown", new Date(now.getTime() + 30000), 30000));
  } finally { await db.close(); }
});
