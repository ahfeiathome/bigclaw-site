import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set('bigclaw-auth', '', { maxAge: 0, path: '/' });
  response.cookies.set('bigclaw-user', '', { maxAge: 0, path: '/' });
  response.cookies.set('bigclaw-role', '', { maxAge: 0, path: '/' });
  return response;
}
