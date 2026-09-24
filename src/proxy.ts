import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { admin2FACookie, verifyAdmin2FAToken } from '@/lib/admin-2fa'

export default async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Protect all /admin routes
  if (path.startsWith('/admin')) {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

    if (!token || token.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/api/auth/signin', request.url));
    }

    // Check 2FA unless we are on the 2FA authentication page itself
    if (path !== '/admin/2fa') {
      const secondFactorToken = request.cookies.get(admin2FACookie.name)?.value;
      const has2FA = typeof token.id === "string" && await verifyAdmin2FAToken(secondFactorToken, token.id);
      if (!has2FA) {
        return NextResponse.redirect(new URL('/admin/2fa', request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/admin/:path*',
}
