import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware for route protection and RBAC enforcement
 * Ensures all protected routes require authentication and proper authorization
 */
export async function middleware(request: NextRequest) {
  const session = await auth();
  const { pathname } = request.nextUrl;

  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/api/auth'];
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Require authentication for all other routes
  if (!session?.user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Role-based access control
  const adminOnlyRoutes = ['/admin', '/api/admin'];
  const isAdminRoute = adminOnlyRoutes.some((route) => pathname.startsWith(route));

  if (isAdminRoute && session.user.role !== 'ADMIN') {
    return NextResponse.json(
      { error: 'Unauthorized - Admin access required' },
      { status: 403 }
    );
  }

  // Manager+ routes (MANAGER and ADMIN)
  const managerRoutes = ['/stores/new', '/stores/edit', '/api/stores/create', '/api/stores/update'];
  const isManagerRoute = managerRoutes.some((route) => pathname.startsWith(route));

  if (isManagerRoute && !['MANAGER', 'ADMIN'].includes(session.user.role || '')) {
    return NextResponse.json(
      { error: 'Unauthorized - Manager access required' },
      { status: 403 }
    );
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
