import { NextRequest, NextResponse } from 'next/server';

// Internal pages that require admin role
const INTERNAL_PREFIXES = [
  '/dashboard/departments/operations',
  '/dashboard/departments/infrastructure',
  '/dashboard/sponsor',
  '/dashboard/settings',
  '/dashboard/forge',
  '/dashboard/axiom',
  '/dashboard/learnings',
];

export function middleware(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.next();
  }

  // Allow login page and auth API through
  if (request.nextUrl.pathname === '/dashboard/login') {
    return NextResponse.next();
  }

  const authCookie = request.cookies.get('bigclaw-auth');
  if (authCookie?.value !== 'authenticated') {
    const loginUrl = new URL('/dashboard/login', request.url);
    loginUrl.searchParams.set('from', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check role-based access
  const userCookie = request.cookies.get('bigclaw-user');
  if (userCookie?.value) {
    try {
      const user = JSON.parse(userCookie.value);
      const role = user.role || 'product-viewer';

      // Admin sees everything
      if (role === 'admin') return NextResponse.next();

      // Block internal pages for non-admin
      const isInternal = INTERNAL_PREFIXES.some(p => request.nextUrl.pathname.startsWith(p));
      if (isInternal) {
        return new NextResponse('Forbidden', { status: 403 });
      }

      // Product-viewer: check product access
      if (role === 'product-viewer' && request.nextUrl.pathname.startsWith('/dashboard/products/')) {
        const product = request.nextUrl.pathname.replace('/dashboard/products/', '').split('/')[0];
        const allowedProducts: string[] = user.products || [];
        if (allowedProducts.length > 0 && !allowedProducts.includes(product)) {
          return new NextResponse('Forbidden', { status: 403 });
        }
      }

      // Investor: only mission control and finance
      if (role === 'investor') {
        const allowed = ['/dashboard', '/dashboard/mission-control', '/dashboard/departments/finance', '/dashboard/finance'];
        const isAllowed = allowed.some(p => request.nextUrl.pathname === p) ||
          request.nextUrl.pathname === '/dashboard/';
        if (!isAllowed) {
          return new NextResponse('Forbidden', { status: 403 });
        }
      }
    } catch {
      // Invalid cookie — allow through (legacy auth)
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/dashboard/:path*',
};
