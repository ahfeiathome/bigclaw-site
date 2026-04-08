import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

function getAdmin(request: NextRequest): { email: string; role: string } | null {
  // Check bigclaw-user cookie first (set during email/password login)
  const userCookie = request.cookies.get('bigclaw-user');
  if (userCookie) {
    try {
      const user = JSON.parse(userCookie.value);
      if (user.role === 'admin') return user;
    } catch { /* fall through */ }
  }
  // Fallback: if authenticated but no user cookie (stale session), treat as admin
  // Only admins can log in via password, so bigclaw-auth=authenticated implies admin
  const authCookie = request.cookies.get('bigclaw-auth');
  if (authCookie?.value === 'authenticated') {
    return { email: 'michaelmkliu@gmail.com', role: 'admin' };
  }
  return null;
}

function readConfig(): Record<string, unknown> {
  const configPath = path.join(process.cwd(), 'config', 'access.json');
  return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
}

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  if (!getAdmin(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return NextResponse.json(readConfig());
}

export async function POST(request: NextRequest) {
  if (!getAdmin(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { action, email, role, products } = body;

  if (!action || !email) {
    return NextResponse.json({ error: 'Missing action or email' }, { status: 400 });
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Protect primary admin
  if (action === 'remove' && normalizedEmail === 'michaelmkliu@gmail.com') {
    return NextResponse.json({ error: 'Cannot remove primary admin' }, { status: 400 });
  }

  const config = readConfig() as { users: Record<string, unknown>; [k: string]: unknown };

  if (action === 'remove') {
    delete config.users[normalizedEmail];
  } else if (action === 'add' || action === 'update') {
    const entry: Record<string, unknown> = { role: role || 'product-viewer' };
    if (products?.length) entry.products = products;
    config.users[normalizedEmail] = entry;
  }

  // Try to write locally (works in dev, fails silently on Vercel)
  try {
    const configPath = path.join(process.cwd(), 'config', 'access.json');
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  } catch {
    // Vercel read-only filesystem — return updated config for download
  }

  return NextResponse.json({ ok: true, config });
}
