import { NextRequest, NextResponse } from 'next/server';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
const OWNER = 'ahfeiathome';
const REPO = 'the-firm';
const FILE_PATH = 'docs/projects/radar/RADAR_HALT.json';

async function getFileSha(): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE_PATH}`,
      {
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: 'application/vnd.github.v3+json',
        },
      },
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.sha;
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE_PATH}`,
      {
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: 'application/vnd.github.v3+json',
        },
        next: { revalidate: 30 },
      },
    );
    if (!res.ok) {
      return NextResponse.json({ halted: false });
    }
    const data = await res.json();
    const content = Buffer.from(data.content, 'base64').toString('utf-8');
    return NextResponse.json(JSON.parse(content));
  } catch {
    return NextResponse.json({ halted: false });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const halt = {
      halted: body.halted ?? true,
      reason: body.reason || 'Manual kill switch activated from dashboard',
      timestamp: new Date().toISOString(),
      triggeredBy: 'dashboard',
    };

    const sha = await getFileSha();
    const content = Buffer.from(JSON.stringify(halt, null, 2)).toString('base64');

    const res = await fetch(
      `https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE_PATH}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `radar: ${halt.halted ? 'HALT' : 'RESUME'} live trading — ${halt.reason}`,
          content,
          ...(sha ? { sha } : {}),
        }),
      },
    );

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: err }, { status: res.status });
    }

    return NextResponse.json({ ok: true, halt });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
