import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { admin2FACookie, verifyAdmin2FAToken } from "@/lib/admin-2fa";

export default async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (path.startsWith("/admin")) {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token || token.role !== "ADMIN" || !token.securityVersion || !token.sessionId) {
      return NextResponse.redirect(new URL("/auth/signin", request.url));
    }
    if (path !== "/admin/2fa") {
      const verified = typeof token.id === "string" && await verifyAdmin2FAToken(
        request.cookies.get(admin2FACookie.name)?.value, token.id, `${token.securityVersion}:${token.sessionId}`,
      );
      if (!verified) return NextResponse.redirect(new URL("/admin/2fa", request.url));
    }
  }
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "media-src 'self' blob: https:",
    "font-src 'self' data:",
    `connect-src 'self' https://api.stripe.com${process.env.NODE_ENV === "development" ? " ws: wss:" : ""}`,
    "frame-src https://js.stripe.com https://hooks.stripe.com https://checkout.stripe.com https://maps.google.com https://www.google.com",
    "object-src 'none'", "base-uri 'self'", "frame-ancestors 'none'",
    "form-action 'self' https://checkout.stripe.com",
    ...(process.env.NODE_ENV === "production" ? ["upgrade-insecure-requests"] : []),
  ].join("; ");
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|images/|.*\\.(?:svg|png|jpg|jpeg|webp|gif|ico)$).*)"],
};
