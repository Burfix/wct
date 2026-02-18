import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Lightweight middleware for route protection
 * Auth verification happens in layout/page components
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes that don't require authentication
  const publicRoutes = ['/', '/api/auth'];
  const isPublicRoute = publicRoutes.some((route) => pathname === route || pathname.startsWith('/api/auth'));

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Check for session cookie (basic check, full auth happens in components)
  const sessionCookie = request.cookies.get('authjs.session-token') || 
                       request.cookies.get('__Secure-authjs.session-token');

  if (!sessionCookie && !pathname.startsWith('/_next') && !pathname.startsWith('/api')) {
    const homeUrl = new URL('/', request.url);
    homeUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(homeUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
