import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

interface HealthResult {
  url: string;
  status: 'up' | 'down';
}

export async function POST(req: NextRequest) {
  const body = await req.json() as { urls?: unknown };
  const urls = body.urls;

  if (!Array.isArray(urls) || urls.some(u => typeof u !== 'string')) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const results: HealthResult[] = await Promise.all(
    (urls as string[]).map(async (url): Promise<HealthResult> => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const res = await fetch(url, {
          method: 'HEAD',
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        return { url, status: res.status >= 200 && res.status < 400 ? 'up' : 'down' };
      } catch {
        return { url, status: 'down' };
      }
    })
  );

  return NextResponse.json({ results });
}
