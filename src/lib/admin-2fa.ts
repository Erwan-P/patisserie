const COOKIE_NAME = "admin_2fa_verified";
const TOKEN_LIFETIME_SECONDS = 30 * 60;

type Admin2FAPayload = {
  userId: string;
  expiresAt: number;
};

function getSecret() {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error("NEXTAUTH_SECRET doit être configuré.");
  }
  return secret;
}

function toBase64Url(value: Uint8Array | string) {
  const bytes = typeof value === "string" ? new TextEncoder().encode(value) : value;
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function getSigningKey() {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export async function createAdmin2FAToken(userId: string) {
  const payload: Admin2FAPayload = {
    userId,
    expiresAt: Math.floor(Date.now() / 1000) + TOKEN_LIFETIME_SECONDS,
  };
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signature = await crypto.subtle.sign(
    "HMAC",
    await getSigningKey(),
    new TextEncoder().encode(encodedPayload),
  );
  return `${encodedPayload}.${toBase64Url(new Uint8Array(signature))}`;
}

export async function verifyAdmin2FAToken(token: string | undefined, expectedUserId: string) {
  if (!token) return false;

  try {
    const [encodedPayload, encodedSignature, extra] = token.split(".");
    if (!encodedPayload || !encodedSignature || extra) return false;

    const validSignature = await crypto.subtle.verify(
      "HMAC",
      await getSigningKey(),
      fromBase64Url(encodedSignature),
      new TextEncoder().encode(encodedPayload),
    );
    if (!validSignature) return false;

    const payload = JSON.parse(
      new TextDecoder().decode(fromBase64Url(encodedPayload)),
    ) as Admin2FAPayload;

    return payload.userId === expectedUserId && payload.expiresAt > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

export const admin2FACookie = {
  name: COOKIE_NAME,
  maxAge: TOKEN_LIFETIME_SECONDS,
  options: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
    maxAge: TOKEN_LIFETIME_SECONDS,
  },
};
