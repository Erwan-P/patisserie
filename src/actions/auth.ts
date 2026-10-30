"use server";

import { cookies } from "next/headers";
import { admin2FACookie } from "@/lib/admin-2fa";

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
