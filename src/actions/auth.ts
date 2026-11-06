"use server";

import { cookies } from "next/headers";
import { admin2FACookie } from "@/lib/admin-2fa";
import { prisma } from "@/lib/prisma";
import { publicRequestBudget } from "@/lib/request-security";
import { normalizeEmail } from "@/lib/security";

export async function getSignInMethod(address: string) {
  const email = normalizeEmail(address);
  if (!email) return "invalid";
  if (!await publicRequestBudget("signin-method", email, 10, 15 * 60 * 1000)) return "limited";

  const user = await prisma.user.findUnique({ where: { email }, select: { role: true } });
  return user?.role === "ADMIN" ? "password" : "email";
}

export async function logoutAdmin() {
  const cookieStore = await cookies();
  cookieStore.delete(admin2FACookie.name);
  return { success: true };
}

// Exactly the same logic, but for clarity on login attempts
export async function reset2FA() {
  const cookieStore = await cookies();
  cookieStore.delete(admin2FACookie.name);
  return { success: true };
}
