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

      // Product-viewer: only allowed product routes
      if (role === 'product-viewer') {
        const allowedProducts: string[] = user.products || [];
        const PRODUCT_ROUTES: Record<string, string> = {
          grovakid: '/dashboard/products/grovakid',
          rehearsal: '/dashboard/products/rehearsal',
          radar: '/dashboard/products/radar',
          fairconnect: '/dashboard/products/fairconnect',
          keeptrack: '/dashboard/products/keeptrack',
          subcheck: '/dashboard/products/subcheck',
          cortex: '/dashboard/products/cortex',
          'iris-studio': '/dashboard/products/iris-studio',
          fatfrogmodels: '/dashboard/products/fatfrogmodels',
        };
        const allowed = allowedProducts.map(p => PRODUCT_ROUTES[p]).filter(Boolean);
        const ALWAYS_ALLOWED = ['/dashboard/login'];
        const isAllowed = [...ALWAYS_ALLOWED, ...allowed].some(p => request.nextUrl.pathname.startsWith(p));
        if (!isAllowed) {
          return NextResponse.redirect(new URL(allowed[0] || '/dashboard/login', request.url));
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
