"use server";

import { cookies } from "next/headers";

export async function logoutAdmin() {
  const cookieStore = await cookies();
  cookieStore.delete("admin_2fa_verified");
  return { success: true };
}

// Exactly the same logic, but for clarity on login attempts
export async function reset2FA() {
  const cookieStore = await cookies();
  cookieStore.delete("admin_2fa_verified");
  return { success: true };
}

import { prisma } from "@/lib/prisma";

export async function checkIsAdmin(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { role: true }
  });
  return user?.role === "ADMIN";
}
