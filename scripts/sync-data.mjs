#!/usr/bin/env node

/**
 * Pre-build sync: copies markdown data files from bigclaw-ai/ into bigclaw-site/data/
 * so Next.js can read them at build time without reaching outside its directory.
 *
 * Also runs the integrity check and writes the report.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE_ROOT = path.resolve(__dirname, '..');
const BIGCLAW_ROOT = path.resolve(SITE_ROOT, '..');
const DATA_DIR = path.join(SITE_ROOT, 'data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// Read manifest
const manifestPath = path.join(BIGCLAW_ROOT, 'config', 'data-manifest.json');
if (!fs.existsSync(manifestPath)) {
  console.warn('WARN: data-manifest.json not found — skipping sync');
  process.exit(0);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const report = { timestamp: new Date().toISOString(), synced: [], missing: [], status: 'healthy' };

for (const [key, source] of Object.entries(manifest.sources)) {
  const srcPath = path.join(BIGCLAW_ROOT, source.path);
  // Flatten into data/ using the key as filename
  const destPath = path.join(DATA_DIR, `${key}.md`);

  if (fs.existsSync(srcPath) && fs.statSync(srcPath).isFile()) {
    fs.copyFileSync(srcPath, destPath);
    report.synced.push(key);
    console.log(`SYNC: ${key} ← ${source.path}`);
  } else if (fs.existsSync(srcPath) && fs.statSync(srcPath).isDirectory()) {
    // Skip directory entries (e.g. sessionLogs/) — handled separately
    console.log(`SKIP (directory): ${key} — ${source.path}`);
  } else {
    report.missing.push({ key, path: source.path, required: source.required });
    if (source.required) {
      report.status = 'broken';
      console.error(`MISSING (required): ${key} — ${source.path}`);
    } else {
      if (report.status === 'healthy') report.status = 'degraded';
      console.warn(`MISSING (optional): ${key} — ${source.path}`);
    }
  }
}

// Also copy the manifest itself for runtime reference
fs.copyFileSync(manifestPath, path.join(DATA_DIR, 'manifest.json'));

// Write sync report
fs.writeFileSync(path.join(DATA_DIR, 'sync-report.json'), JSON.stringify(report, null, 2));

console.log(`\nSync complete: ${report.synced.length} files copied, ${report.missing.length} missing`);
console.log(`Status: ${report.status.toUpperCase()}`);
