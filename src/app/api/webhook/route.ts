import { NextRequest, NextResponse } from 'next/server';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '';
const DASHBOARD_URL = 'https://bigclaw-site.vercel.app';

// Only notify on changes to these paths
const NOTIFY_PATTERNS = [
  /docs\/status\//,
  /docs\/specs\//,
  /knowledge\//,
  /sponsor\//,
  /founder\//,
  /PATROL_REPORT\.md/,
  /FINANCE\.md/,
  /RADAR_DASHBOARD\.md/,
];

// Map file paths to dashboard pages
function mapToDashboardUrl(filePath: string, repo: string): string | null {
  if (filePath.includes('PATROL_REPORT')) return `${DASHBOARD_URL}/dashboard/departments/operations`;
  if (filePath.includes('FINANCE.md')) return `${DASHBOARD_URL}/dashboard/departments/finance`;
  if (filePath.includes('RADAR_DASHBOARD')) return `${DASHBOARD_URL}/dashboard/radar`;
  if (filePath.includes('docs/status/')) return `${DASHBOARD_URL}/dashboard/${repo === 'the-firm' ? 'forge' : 'axiom'}/status`;
  if (filePath.includes('docs/specs/')) return `${DASHBOARD_URL}/dashboard/${repo === 'the-firm' ? 'forge' : 'axiom'}/specs`;
  if (filePath.includes('knowledge/')) {
    const slug = filePath.split('knowledge/')[1]?.replace('.md', '');
    return slug ? `${DASHBOARD_URL}/dashboard/departments/knowledge/${slug}` : null;
  }
  if (filePath.includes('founder/') || filePath.includes('sponsor/')) return `${DASHBOARD_URL}/dashboard/sponsor/todo`;
  return null;
}

function humanName(filePath: string): string {
  const name = filePath.split('/').pop()?.replace('.md', '') || filePath;
  return name.replace(/_/g, ' ').replace(/-/g, ' ');
}

interface GitHubCommit {
  message: string;
  added: string[];
  modified: string[];
  removed: string[];
}

interface GitHubPushPayload {
  ref: string;
  repository: { name: string; full_name: string };
  commits: GitHubCommit[];
  head_commit: { message: string } | null;
}

async function sendTelegram(text: string) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) return;

  await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    }),
  });
}

export async function POST(request: NextRequest) {
  const event = request.headers.get('x-github-event');
  if (event !== 'push') {
    return NextResponse.json({ ok: true, skipped: 'not a push event' });
  }

  const payload: GitHubPushPayload = await request.json();
  const repo = payload.repository.name;

  // Only process main branch pushes
  if (!payload.ref.endsWith('/main') && !payload.ref.endsWith('/master')) {
    return NextResponse.json({ ok: true, skipped: 'not main branch' });
  }

  // Collect doc changes across all commits
  const docChanges: { file: string; action: string }[] = [];
  for (const commit of payload.commits) {
    for (const file of [...commit.added, ...commit.modified]) {
      if (NOTIFY_PATTERNS.some(p => p.test(file))) {
        const action = commit.added.includes(file) ? 'added' : 'updated';
        if (!docChanges.some(d => d.file === file)) {
          docChanges.push({ file, action });
        }
      }
    }
  }

  if (docChanges.length === 0) {
    return NextResponse.json({ ok: true, skipped: 'no doc changes' });
  }

  // Build Telegram message
  const commitMsg = payload.head_commit?.message.split('\n')[0] || 'No message';
  let text = `📋 <b>${repo}</b> — doc update\n`;
  text += `<i>${commitMsg}</i>\n\n`;

  for (const change of docChanges.slice(0, 10)) {
    const name = humanName(change.file);
    const url = mapToDashboardUrl(change.file, repo);
    const icon = change.action === 'added' ? '➕' : '📝';
    text += url
      ? `${icon} <a href="${url}">${name}</a>\n`
      : `${icon} ${name}\n`;
  }

  if (docChanges.length > 10) {
    text += `\n...and ${docChanges.length - 10} more`;
  }

  await sendTelegram(text);

  return NextResponse.json({ ok: true, notified: docChanges.length });
}
