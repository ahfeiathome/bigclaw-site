# EXECUTION BRIEF — User Management Settings Page

**Date:** 2026-04-05 | **To:** Code CLI (lc-bigclaw) | **Priority:** P1

## What
Build /dashboard/settings/users. Admin-only. Read/write config/access.json via API.
No database. JSON file stays source of truth.

## Step 1 — API routes: src/app/api/admin/users/route.ts

GET: return accessConfig if role === 'admin', else 403.
POST: accept { action: 'add'|'update'|'remove', email, role, products }.
  On Vercel (production): fs.writeFileSync is read-only. Return updated JSON for download.
  On local: write to config/access.json directly.

```ts
import accessConfig from '@/../config/access.json';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  const user = JSON.parse(request.cookies.get('bigclaw-user')?.value || '{}');
  if (user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  return NextResponse.json(accessConfig);
}

export async function POST(request: NextRequest) {
  const user = JSON.parse(request.cookies.get('bigclaw-user')?.value || '{}');
  if (user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const body = await request.json();
  const config = JSON.parse(JSON.stringify(accessConfig)); // deep clone
  if (body.action === 'remove') {
    if (body.email === 'michaelmkliu@gmail.com') return NextResponse.json({ error: 'Cannot remove admin' }, { status: 400 });
    delete config.users[body.email.toLowerCase()];
  } else {
    const entry: Record<string, unknown> = { role: body.role };
    if (body.products?.length) entry.products = body.products;
    config.users[body.email.toLowerCase()] = entry;
  }
  // Try filesystem write (works local, fails on Vercel)
  try {
    const configPath = path.join(process.cwd(), 'config', 'access.json');
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  } catch {}
  return NextResponse.json({ ok: true, config }); // always return updated config for download
}
```

## Step 2 — Page: src/app/dashboard/settings/users/page.tsx

Client component. Three sections:

### Section A — Current Users table
Columns: Email | Role (badge) | Products | Actions (Edit · Remove)
michaelmkliu@gmail.com: no Edit/Remove buttons (protected).
Roles: admin=purple badge, product-viewer=blue, investor=amber.

### Section B — Add User form
Fields: Email input | Role select (admin/product-viewer/investor) |
Products multi-select (only when role=product-viewer):
  options: grovakid, fairconnect, keeptrack, subcheck, radar, iris-studio, fatfrogmodels
"Add User" button → POST → refresh table.

### Section C — Role Reference (static table)
| Role | Pages | Controls | Internal |
| admin | All | Yes | Yes |
| product-viewer | Assigned products only | No | No |
| investor | Mission Control + Finance | No | No |

### Download button
"Download access.json" → triggers browser download of updated config.
Display notice: "Changes saved. Commit and redeploy to apply on production."

## Step 3 — Sidebar: add Settings link (admin only)
In sidebar-nav.tsx, below Resources:
{isAdmin && <SectionLink label="Settings" href="/dashboard/settings/users" />}

## Step 4 — Middleware: add /dashboard/settings to INTERNAL_PREFIXES
Verify it's already there. If not, add it.

## Verification
- Admin → Settings link visible, page loads with user table
- Add test user → appears in table, Download returns valid JSON
- Non-admin → /dashboard/settings/users returns 403
- michaelmkliu@gmail.com: no Remove button

DO NOT implement database-backed version — download + commit is sufficient.
