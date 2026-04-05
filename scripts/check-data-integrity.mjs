#!/usr/bin/env node

/**
 * Data integrity check — runs before every build AND as a daily cron.
 *
 * 1. Reads config/data-manifest.json
 * 2. For each source: checks if file exists at path
 * 3. Missing + required → ERROR, dashboard shows "Data unavailable"
 * 4. Missing + optional → WARNING, dashboard hides that section
 * 5. Writes integrity report to bigclaw-site/data/integrity-report.json
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE_ROOT = path.resolve(__dirname, '..');
const BIGCLAW_ROOT = path.resolve(SITE_ROOT, '..');

const manifestPath = path.join(BIGCLAW_ROOT, 'config', 'data-manifest.json');
if (!fs.existsSync(manifestPath)) {
  console.error('ERROR: data-manifest.json not found at', manifestPath);
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

const report = {
  timestamp: new Date().toISOString(),
  status: 'healthy',
  sources: {},
  missing: [],
  stale: [],
  errors: [],
};

for (const [key, source] of Object.entries(manifest.sources)) {
  const fullPath = path.join(BIGCLAW_ROOT, source.path);
  if (!fs.existsSync(fullPath)) {
    report.missing.push({ key, path: source.path, required: source.required });
    report.sources[key] = { status: 'missing', path: source.path, required: source.required };
    if (source.required) {
      report.status = 'broken';
      report.errors.push(`REQUIRED file missing: ${source.path} (${key})`);
      console.error(`ERROR: ${key} — file missing at ${source.path}`);
    } else {
      if (report.status === 'healthy') report.status = 'degraded';
      console.warn(`WARN: ${key} — optional file missing at ${source.path}`);
    }
  } else {
    const stat = fs.statSync(fullPath);
    const ageHours = (Date.now() - stat.mtimeMs) / 3600000;
    const stale = ageHours > 168; // 7 days
    report.sources[key] = {
      status: stale ? 'stale' : 'ok',
      path: source.path,
      required: source.required,
      hoursOld: Math.round(ageHours),
    };
    if (stale) {
      report.stale.push({ key, path: source.path, hoursOld: Math.round(ageHours) });
      if (report.status === 'healthy') report.status = 'degraded';
      console.warn(`WARN: ${key} — stale (${Math.round(ageHours)}h old)`);
    } else {
      console.log(`OK: ${key} — ${source.path} (${Math.round(ageHours)}h old)`);
    }
  }
}

// Write report
const dataDir = path.join(SITE_ROOT, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
fs.writeFileSync(path.join(dataDir, 'integrity-report.json'), JSON.stringify(report, null, 2));

console.log(`\nIntegrity: ${report.status.toUpperCase()}`);
if (report.missing.length) console.log(`  Missing: ${report.missing.length} files`);
if (report.stale.length) console.log(`  Stale: ${report.stale.length} files`);

// Exit with error only if broken AND in strict mode
if (report.status === 'broken' && process.env.STRICT_INTEGRITY === '1') {
  process.exit(1);
}
