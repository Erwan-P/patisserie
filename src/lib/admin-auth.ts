import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { admin2FACookie, verifyAdmin2FAToken } from "@/lib/admin-2fa";
import { prisma } from "@/lib/prisma";
import { credentialVersion } from "@/lib/security";

export async function getVerifiedAdminSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") return null;
  const current = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true, password: true, twoFactorHash: true },
  });
  if (!current || current.role !== "ADMIN" || credentialVersion(current) !== session.user.securityVersion) return null;

  const cookieStore = await cookies();
  const token = cookieStore.get(admin2FACookie.name)?.value;
  if (!(await verifyAdmin2FAToken(token, session.user.id, `${session.user.securityVersion}:${session.user.sessionId}`))) return null;

  return session;
}
