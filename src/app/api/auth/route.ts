import { NextRequest, NextResponse } from 'next/server';
import { getUserAccess } from '@/lib/access';

const DASHBOARD_PASSWORD = process.env.DASHBOARD_PASSWORD || 'Learnie2026Admin';

export async function POST(request: NextRequest) {
  const body = await request.json();

  // Support both email-based and legacy password auth
  if (body.email) {
    const access = getUserAccess(body.email);
    if (!access) {
      return NextResponse.json({ error: 'Email not authorized' }, { status: 401 });
    }

    const response = NextResponse.json({ ok: true, role: access.role });
    response.cookies.set('bigclaw-auth', 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });
    response.cookies.set('bigclaw-user', JSON.stringify({ email: access.email, role: access.role }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });
    return response;
  }

  // Legacy password auth (kept for backward compat)
  if (body.password === DASHBOARD_PASSWORD) {
    const response = NextResponse.json({ ok: true, role: 'admin' });
    response.cookies.set('bigclaw-auth', 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });
    response.cookies.set('bigclaw-user', JSON.stringify({ email: 'michaelmkliu@gmail.com', role: 'admin' }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });
    return response;
  }

  return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
}
