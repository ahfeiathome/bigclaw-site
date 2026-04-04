import { NextRequest, NextResponse } from 'next/server';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
const OWNER = 'ahfeiathome';
const REPO = 'the-firm';
const FILE_PATH = 'docs/projects/radar/RADAR_MODE.json';

interface ModeConfig {
  strategy: string;
  risk: string;
  switchType: 'soft' | 'hard';
  appliesTo: string;
  updatedAt: string;
  updatedBy: string;
}

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
        next: { revalidate: 60 },
      },
    );
    if (!res.ok) {
      return NextResponse.json({
        strategy: 'Grow',
        risk: 'Auto',
        switchType: 'soft',
        appliesTo: 'Both',
      });
    }
    const data = await res.json();
    const content = Buffer.from(data.content, 'base64').toString('utf-8');
    return NextResponse.json(JSON.parse(content));
  } catch {
    return NextResponse.json({
      strategy: 'Grow',
      risk: 'Auto',
      switchType: 'soft',
      appliesTo: 'Both',
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const mode: ModeConfig = {
      strategy: body.strategy,
      risk: body.risk,
      switchType: body.switchType,
      appliesTo: body.appliesTo,
      updatedAt: new Date().toISOString(),
      updatedBy: 'dashboard',
    };

    const sha = await getFileSha();
    const content = Buffer.from(JSON.stringify(mode, null, 2)).toString('base64');

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
          message: `radar: update mode to ${mode.risk} × ${mode.strategy} [${mode.appliesTo}]`,
          content,
          ...(sha ? { sha } : {}),
        }),
      },
    );

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: err }, { status: res.status });
    }

    return NextResponse.json({ ok: true, mode });
  } catch (e) {
    return NextResponse.json(
      { error: String(e) },
      { status: 500 },
    );
  }
}
