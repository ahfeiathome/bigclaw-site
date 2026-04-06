# EXECUTION BRIEF — Command Center Redesign

**Date:** 2026-04-05 | **To:** Code CLI (lc-bigclaw) | **Priority:** P1
**File:** src/components/mission-command-center.tsx

---

## Problems to fix (5)

1. Too much whitespace — needs to be denser throughout
2. Agent controls have toggles — remove, show status only
3. User Management is a redirect link — embed actual controls here
4. Trading Mode grid is too large — make compact single-row selector
5. Deploy Gates only shows 3 products, only shows deploy — should show all
   products with their PDLC stage (read from pdlcRegistry)

---

## Change 1 — Overall density

Reduce all padding:
- Section borders: p-4 → p-3
- Space between sections: mb-4 → mb-2
- Row spacing inside sections: space-y-2 → space-y-1.5
- Font sizes: keep xs (12px) throughout — no larger

---

## Change 2 — Trading Mode: compact selector

Current: Full RadarControlPanel 4×4 grid (4 strategies × 4 modes = 16 cells).
Replace with a single compact row:

```tsx
{/* Trading Mode — compact */}
<div className="mb-2">
  <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1.5">
    Trading Mode
  </div>
  <div className="flex items-center gap-2 flex-wrap">
    {/* Strategy pills */}
    {['Auto', 'Aggressive', 'Balanced', 'Conservative'].map(strategy => (
      <button
        key={strategy}
        onClick={() => setSelectedStrategy(strategy)}
        className={`text-[11px] px-2.5 py-1 rounded-md border transition-colors ${
          selectedStrategy === strategy
            ? 'bg-primary/20 text-primary border-primary/40 font-semibold'
            : 'text-muted-foreground border-border hover:border-primary/30'
        }`}
      >
        {strategy}
      </button>
    ))}
    <span className="text-muted-foreground/40 text-xs">×</span>
    {/* Mode pills */}
    {['Accelerate', 'Grow', 'Build'].map(mode => (
      <button
        key={mode}
        onClick={() => setSelectedMode(mode)}
        className={`text-[11px] px-2.5 py-1 rounded-md border transition-colors ${
          selectedMode === mode
            ? 'bg-primary/20 text-primary border-primary/40 font-semibold'
            : 'text-muted-foreground border-border hover:border-primary/30'
        }`}
      >
        {mode}
      </button>
    ))}
    {/* Switch type + Apply */}
    <div className="ml-auto flex items-center gap-2">
      <span className="text-[10px] text-muted-foreground">Switch:</span>
      <button
        onClick={() => setSwitchType(t => t === 'Hard' ? 'Soft' : 'Hard')}
        className="text-[11px] px-2 py-0.5 rounded border border-border text-muted-foreground hover:text-foreground"
      >
        {switchType}
      </button>
      <button
        onClick={handleApplyMode}
        className="text-[11px] px-3 py-1 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
      >
        Apply
      </button>
    </div>
  </div>
  <div className="text-[10px] text-muted-foreground mt-1">
    Active: <span className="text-primary font-mono">{controls.radar.strategy || 'Auto'} — {controls.radar.mode || 'Grow'}</span>
  </div>
</div>
```

---

## Change 3 — Agent Controls: status only, no toggles

Current: Toggle switch per agent (enable/disable).
Replace with a compact status row — dots + names only, no interaction:

```tsx
{/* Agent Status — read only */}
<div className="mb-2">
  <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1.5">
    Agents
  </div>
  <div className="flex flex-wrap gap-x-4 gap-y-1">
    {Object.entries(controls.agents).map(([name, agent]) => (
      <div key={name} className="flex items-center gap-1.5">
        <StatusDot status={agent.enabled ? 'good' : 'neutral'} size="sm" />
        <span className="text-xs text-muted-foreground capitalize">{name}</span>
      </div>
    ))}
  </div>
</div>
```

Remove the import of Toggle for agents. Keep Toggle only for the RADAR kill switch.

---

## Change 4 — Product Pipeline (replaces Deploy Gates)

Current: Reads from controls.deploy_gates (only 3 products, boolean only).
Replace with a full product pipeline view reading from pdlcRegistry.

```tsx
{/* Product Pipeline */}
<div className="mb-2">
  <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1.5">
    Product Pipeline
  </div>
  <table className="w-full text-[11px]">
    <thead>
      <tr className="text-muted-foreground border-b border-border/50">
        <th className="text-left py-1 pr-2 font-normal">Product</th>
        <th className="text-left py-1 px-2 font-normal">Stage</th>
        <th className="text-left py-1 px-2 font-normal">Next Gate</th>
        <th className="text-right py-1 pl-2 font-normal">Deploy</th>
      </tr>
    </thead>
    <tbody>
      {allProducts.map(product => {
        const deployAllowed = controls.deploy_gates[product.slug] ?? true;
        const stageColor = product.stage.includes('S7') || product.stage.includes('S8')
          ? 'text-green-400'
          : product.stage.includes('S4') || product.stage.includes('S5')
          ? 'text-amber-400'
          : 'text-muted-foreground';
        return (
          <tr key={product.slug} className="border-b border-border/20">
            <td className="py-1 pr-2 text-foreground">{product.name}</td>
            <td className={`py-1 px-2 font-mono ${stageColor}`}>{product.stage}</td>
            <td className="py-1 px-2 text-muted-foreground truncate max-w-[160px]">
              {product.nextGate || '—'}
            </td>
            <td className="py-1 pl-2 text-right">
              <Toggle
                enabled={deployAllowed}
                onToggle={() => toggle(`deploy_gates.${product.slug}`, deployAllowed)}
                label={deployAllowed ? 'ALLOWED' : 'BLOCKED'}
              />
            </td>
          </tr>
        );
      })}
    </tbody>
  </table>
</div>
```

Product data (`allProducts`) fetched from `/api/pdlc-registry` or parsed from
`data/pdlcRegistry.md` — same source as the PDLC section in Mission Control.
Each entry: { slug, name, stage, nextGate }.

All 10 products shown (GrovaKid, REHEARSAL, iris-studio, fatfrogmodels,
FairConnect, KeepTrack, SubCheck, CORTEX, RADAR, BigClaw Dashboard).

Update `config/controls.json` to include all 10 slugs in deploy_gates
with default value `true` if not already present.

---

## Change 5 — User Management: embed controls, not redirect

Current: Collapsed section with "Open User Management →" link.
Replace: Embed the actual user table + add form directly in Command Center.
Same API calls as `/dashboard/settings/users` page.
No redirect needed. Works even if Settings page returns 403.

```tsx
{/* User Management — embedded */}
<div className="border border-border/50 rounded-lg p-3">
  <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2">
    User Management
  </div>

  {/* User table */}
  <div className="space-y-1 mb-3">
    {Object.entries(accessConfig?.users || {}).map(([email, user]) => (
      <div key={email} className="flex items-center gap-2 text-xs">
        <StatusDot status="good" size="sm" />
        <span className="text-foreground font-mono flex-1 truncate">{email}</span>
        <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
          user.role === 'admin' ? 'bg-purple-500/20 text-purple-400' :
          user.role === 'product-viewer' ? 'bg-blue-500/20 text-blue-400' :
          'bg-amber-500/20 text-amber-400'
        }`}>{user.role}</span>
        {user.products?.length ? (
          <span className="text-[10px] text-muted-foreground">{user.products.join(', ')}</span>
        ) : null}
        {email !== 'michaelmkliu@gmail.com' && (
          <button
            onClick={() => handleRemoveUser(email)}
            className="text-[10px] text-red-400 hover:text-red-300 border-none bg-transparent cursor-pointer"
          >
            ✕
          </button>
        )}
      </div>
    ))}
  </div>

  {/* Add user form — inline compact */}
  <div className="flex items-center gap-2 flex-wrap">
    <input
      type="email"
      value={newEmail}
      onChange={e => setNewEmail(e.target.value)}
      placeholder="email@example.com"
      className="text-xs px-2 py-1 rounded border border-border bg-background text-foreground
        focus:outline-none focus:ring-1 focus:ring-primary/50 flex-1 min-w-[160px]"
    />
    <select
      value={newRole}
      onChange={e => setNewRole(e.target.value)}
      className="text-xs px-2 py-1 rounded border border-border bg-background text-foreground"
    >
      <option value="product-viewer">product-viewer</option>
      <option value="investor">investor</option>
      <option value="admin">admin</option>
    </select>
    {newRole === 'product-viewer' && (
      <select
        value={newProduct}
        onChange={e => setNewProduct(e.target.value)}
        className="text-xs px-2 py-1 rounded border border-border bg-background text-foreground"
      >
        <option value="">product...</option>
        <option value="grovakid">grovakid</option>
        <option value="radar">radar</option>
        <option value="fairconnect">fairconnect</option>
        <option value="keeptrack">keeptrack</option>
        <option value="subcheck">subcheck</option>
        <option value="iris-studio">iris-studio</option>
        <option value="fatfrogmodels">fatfrogmodels</option>
        <option value="cortex">cortex</option>
        <option value="rehearsal">rehearsal</option>
      </select>
    )}
    <button
      onClick={handleAddUser}
      className="text-xs px-3 py-1 rounded bg-primary text-primary-foreground hover:bg-primary/90"
    >
      Add
    </button>
  </div>
</div>
```

Fetch accessConfig from `/api/admin/users` GET.
Add/remove via `/api/admin/users` POST (same as Settings page).
If fetch returns 403 (stale session), show inline "Session expired — sign out and back in."
Note: this bypasses the Settings page entirely. No redirect needed.

---

## Final Command Center layout (top to bottom, all dense)

```
▼ COMMAND CENTER            Reserve: 23.6% — Below 30%!

[RADAR CONTROLS]
○ Trading active

Trading Mode:
[Auto] [Aggressive] [Balanced] [Conservative]  ×  [Accelerate] [Grow] [Build]
Switch: [Soft]  [Apply Mode]          Active: Auto — Grow

Constitution: ● All laws enforced

[PRODUCT PIPELINE]
Product        Stage      Next Gate              Deploy
GrovaKid       S4 BUILD   S5 HARDEN (⚖️)         ALLOWED ●
REHEARSAL      S3 DESIGN  S4 BUILD               ALLOWED ●
iris-studio    S4 BUILD   DNS + Stripe (💳)       ALLOWED ●
...

[AGENTS]
● Mika  ● Koda  ● Rex  ● Sage  ● Byte  ● Lumina

[USER MANAGEMENT]
● michaelmkliu@gmail.com   admin
● bin.lam@outlook.com      product-viewer   grovakid  ✕
[email input] [role] [product] [Add]
```

---

## Also: fix Settings 403 permanently

The Settings page returns 403 because Michael's session cookie is stale.
After adding Sign Out button (sidebar-logo-logout-watermark.md), Michael
signs out and back in — fresh cookie with role=admin — Settings works.

Embedding UM in Mission Control above is the immediate workaround.
Both should be done.

---

## Verification

- Command Center is visibly more compact (same info, less space)
- Trading Mode: single compact row of pills, not full grid
- Agents: status dots only, no toggles
- Product Pipeline: all 10 products, PDLC stage column, deploy toggle
- User Management: inline table + add form, no redirect link
- No "Open User Management →" button anywhere in Command Center
