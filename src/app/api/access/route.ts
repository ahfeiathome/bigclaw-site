import { NextResponse } from 'next/server';
import { getAccessConfig } from '@/lib/access';

export async function GET() {
  const config = getAccessConfig();
  return NextResponse.json(config);
}
