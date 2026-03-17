import { NextRequest, NextResponse } from 'next/server';

const DASHBOARD_PASSWORD = process.env.DASHBOARD_PASSWORD || 'Learnie2026Admin';

export async function POST(request: NextRequest) {
  const body = await request.json();

  if (body.password === DASHBOARD_PASSWORD) {
    const response = NextResponse.json({ ok: true });
    response.cookies.set('bigclaw-auth', 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });
    return response;
  }

  return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
}
