# EXECUTION BRIEF — Replace Stale UM Widget with Link to Settings

**Date:** 2026-04-05 | **To:** Code CLI (lc-bigclaw) | **Priority:** P1

## Problem

A read-only "USER MANAGEMENT" widget exists somewhere in the dashboard
showing users + roles with no controls. It says:
"Edit config/access.json to add/remove users or change roles."
This is stale — the full Settings UI now exists at /dashboard/settings/users.

## Step 1 — Find the widget

Search src/ for the stale text:
grep -r "config/access.json" src/

This will locate the component rendering the old read-only view.

## Step 2 — Replace it

Replace the entire widget content with a simple redirect card:

```tsx
<SectionCard title="User Management">
  <p className="text-sm text-muted-foreground mb-3">
    Add, edit, and remove dashboard users with role-based access control.
  </p>
  <a
    href="/dashboard/settings/users"
    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
      bg-primary text-primary-foreground hover:bg-primary/90 transition-colors no-underline"
  >
    Open User Management →
  </a>
</SectionCard>
```

## Step 3 — Deploy and verify

Preview deploy → confirm the widget now shows a button linking to Settings.
Navigate to /dashboard/settings/users → confirm Add/Remove controls visible.

DONE criteria: No dashboard page says "Edit config/access.json" anywhere.
