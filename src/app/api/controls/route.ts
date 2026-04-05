import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const CONTROLS_PATH = join(process.cwd(), 'config/controls.json');

function readControls() {
  try {
    return JSON.parse(readFileSync(CONTROLS_PATH, 'utf-8'));
  } catch {
    return null;
  }
}

export async function GET() {
  const controls = readControls();
  if (!controls) return NextResponse.json({ error: 'Controls not found' }, { status: 500 });
  return NextResponse.json(controls);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { key, value } = body;

  if (!key) return NextResponse.json({ error: 'Missing key' }, { status: 400 });

  const controls = readControls();
  if (!controls) return NextResponse.json({ error: 'Controls not found' }, { status: 500 });

  // key format: "radar.frozen", "deploy_gates.grovakid", "agents.mika.enabled"
  const parts = key.split('.');
  let target = controls;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!target[parts[i]]) target[parts[i]] = {};
    target = target[parts[i]];
  }
  target[parts[parts.length - 1]] = value;

  // Add timestamp
  if (parts[0] === 'radar') {
    controls.radar.last_changed = new Date().toISOString();
  }

  writeFileSync(CONTROLS_PATH, JSON.stringify(controls, null, 2) + '\n');

  return NextResponse.json({ ok: true, controls });
}
