import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { admin2FACookie, verifyAdmin2FAToken } from "@/lib/admin-2fa";

export async function getVerifiedAdminSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") return null;

  const cookieStore = await cookies();
  const token = cookieStore.get(admin2FACookie.name)?.value;
  if (!(await verifyAdmin2FAToken(token, session.user.id))) return null;

  return session;
}
