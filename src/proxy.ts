import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export default async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Protect all /admin routes
  if (path.startsWith('/admin')) {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET || "super-secret-key-for-dev" });

    if (!token || token.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/api/auth/signin', request.url));
    }

    // Check 2FA unless we are on the 2FA authentication page itself
    if (path !== '/admin/2fa') {
      const has2FA = request.cookies.get('admin_2fa_verified');
      if (!has2FA || has2FA.value !== 'true') {
        return NextResponse.redirect(new URL('/admin/2fa', request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/admin/:path*',
}
