import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const userCookie = request.cookies.get('bigclaw-user');
  if (!userCookie?.value) {
    return NextResponse.json({ role: 'admin', products: [] });
  }
  try {
    const user = JSON.parse(userCookie.value);
    return NextResponse.json({ role: user.role || 'admin', products: user.products || [] });
  } catch {
    return NextResponse.json({ role: 'admin', products: [] });
  }
}
