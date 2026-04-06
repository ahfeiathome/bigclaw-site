'use client';

import { useState, useEffect } from 'react';
import { SectionCard, SignalPill } from '@/components/dashboard';

interface UserEntry {
  role: string;
  products?: string[];
}

interface AccessConfig {
  users: Record<string, UserEntry>;
  roles: Record<string, unknown>;
}

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-purple-500/20 text-purple-400',
  'product-viewer': 'bg-blue-500/20 text-blue-400',
  investor: 'bg-amber-500/20 text-amber-400',
};

const ALL_PRODUCTS = [
  'grovakid', 'fairconnect', 'keeptrack', 'subcheck',
  'radar', 'iris-studio', 'fatfrogmodels',
];

const PRIMARY_ADMIN = 'michaelmkliu@gmail.com';

export default function UserManagementPage() {
  const [config, setConfig] = useState<AccessConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Add form state
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('product-viewer');
  const [newProducts, setNewProducts] = useState<string[]>([]);

  async function fetchUsers() {
    try {
      const res = await fetch('/api/admin/users');
      if (res.status === 403) {
        setError('Access denied. Admin role required.');
        setLoading(false);
        return;
      }
      const data = await res.json();
      setConfig(data);
    } catch {
      setError('Failed to load user data.');
    }
    setLoading(false);
  }

  useEffect(() => { fetchUsers(); }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!newEmail.trim()) { setError('Email required'); return; }

    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'add',
        email: newEmail,
        role: newRole,
        products: newRole === 'product-viewer' ? newProducts : undefined,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.config) setConfig(data.config);
      else await fetchUsers();
      setNewEmail('');
      setNewProducts([]);
      setSuccess(`Added ${newEmail.toLowerCase().trim()}`);
    } else {
      const data = await res.json();
      setError(data.error || 'Failed to add user');
    }
  }

  async function handleRemove(email: string) {
    setError('');
    setSuccess('');
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'remove', email }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.config) setConfig(data.config);
      else await fetchUsers();
      setSuccess(`Removed ${email}`);
    } else {
      const data = await res.json();
      setError(data.error || 'Failed to remove user');
    }
  }

  function handleDownload() {
    if (!config) return;
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'access.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  function toggleProduct(product: string) {
    setNewProducts(prev =>
      prev.includes(product) ? prev.filter(p => p !== product) : [...prev, product]
    );
  }

  if (loading) return <p className="text-sm text-muted-foreground">Loading...</p>;
  if (error && !config) return <p className="text-sm text-red-400">{error}</p>;

  const users = config?.users || {};

  return (
    <div>
      <h1 className="mb-1" style={{ fontSize: '28px', fontWeight: 700 }}>Settings — User Management</h1>
      <p className="text-sm text-muted-foreground mb-6">Manage dashboard access. Changes apply locally; commit access.json to deploy.</p>

      {error && <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3 mb-4 text-xs text-red-400">{error}</div>}
      {success && <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-3 mb-4 text-xs text-green-400">{success}</div>}

      {/* ── Section A: Current Users ───────────────────────── */}
      <SectionCard title={`Current Users (${Object.keys(users).length})`} className="mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-muted-foreground border-b border-border bg-muted">
                <th className="text-left py-2.5 pl-3 pr-2">Email</th>
                <th className="text-left py-2.5 px-2">Role</th>
                <th className="text-left py-2.5 px-2">Access</th>
                <th className="text-right py-2.5 pl-2 pr-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(users).map(([email, user], i) => {
                const isProtected = email === PRIMARY_ADMIN;
                return (
                  <tr key={email} className={`border-b border-border/30 ${i % 2 === 1 ? 'bg-muted/50' : ''}`}>
                    <td className="py-2.5 pl-3 pr-2 text-foreground font-medium font-mono text-[11px]">{email}</td>
                    <td className="py-2.5 px-2">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${ROLE_COLORS[user.role] || 'bg-muted text-muted-foreground'}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="py-2.5 px-2">
                      {user.role === 'admin' ? (
                        <span className="text-muted-foreground">All pages</span>
                      ) : user.products?.length ? (
                        <div className="flex flex-wrap gap-1">
                          {user.products.map(p => (
                            <span key={p} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono">{p}</span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="py-2.5 pl-2 pr-3 text-right">
                      {!isProtected && (
                        <button
                          onClick={() => handleRemove(email)}
                          className="text-[10px] text-red-400 hover:text-red-300 font-mono cursor-pointer bg-transparent border-none"
                        >
                          Remove
                        </button>
                      )}
                      {isProtected && <span className="text-[10px] text-muted-foreground/50">protected</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* ── Section B: Add User ────────────────────────────── */}
      <SectionCard title="Add User" className="mb-6">
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Email</label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="user@example.com"
              className="w-full max-w-sm px-3 py-2 rounded-lg text-sm text-foreground bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Role</label>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              className="px-3 py-2 rounded-lg text-sm text-foreground bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="admin">admin</option>
              <option value="product-viewer">product-viewer</option>
              <option value="investor">investor</option>
            </select>
          </div>
          {newRole === 'product-viewer' && (
            <div>
              <label className="text-xs text-muted-foreground block mb-2">Products</label>
              <div className="flex flex-wrap gap-2">
                {ALL_PRODUCTS.map(product => (
                  <button
                    key={product}
                    type="button"
                    onClick={() => toggleProduct(product)}
                    className={`text-[11px] px-2 py-1 rounded font-mono cursor-pointer border transition-colors ${
                      newProducts.includes(product)
                        ? 'bg-primary/20 text-primary border-primary/30'
                        : 'bg-muted text-muted-foreground border-border hover:border-primary/30'
                    }`}
                  >
                    {product}
                  </button>
                ))}
              </div>
            </div>
          )}
          <button
            type="submit"
            className="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer border-none"
          >
            Add User
          </button>
        </form>
      </SectionCard>

      {/* ── Section C: Role Reference ──────────────────────── */}
      <SectionCard title="Role Reference" className="mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-muted-foreground border-b border-border bg-muted">
                <th className="text-left py-2.5 pl-3 pr-2">Role</th>
                <th className="text-left py-2.5 px-2">Pages</th>
                <th className="text-left py-2.5 px-2">Controls</th>
                <th className="text-left py-2.5 pl-2 pr-3">Internal</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border/30">
                <td className="py-2.5 pl-3 pr-2"><span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400">admin</span></td>
                <td className="py-2.5 px-2 text-muted-foreground">All pages</td>
                <td className="py-2.5 px-2 text-green-400">Yes</td>
                <td className="py-2.5 pl-2 pr-3 text-green-400">Yes</td>
              </tr>
              <tr className="border-b border-border/30 bg-muted/50">
                <td className="py-2.5 pl-3 pr-2"><span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400">product-viewer</span></td>
                <td className="py-2.5 px-2 text-muted-foreground">Assigned products only</td>
                <td className="py-2.5 px-2 text-red-400">No</td>
                <td className="py-2.5 pl-2 pr-3 text-red-400">No</td>
              </tr>
              <tr className="border-b border-border/30">
                <td className="py-2.5 pl-3 pr-2"><span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400">investor</span></td>
                <td className="py-2.5 px-2 text-muted-foreground">Mission Control + Finance</td>
                <td className="py-2.5 px-2 text-red-400">No</td>
                <td className="py-2.5 pl-2 pr-3 text-red-400">No</td>
              </tr>
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* ── Download button ────────────────────────────────── */}
      <div className="text-xs text-muted-foreground mb-2">
        On production: changes are in-memory only. Download and commit to persist.
      </div>
      <button
        onClick={handleDownload}
        className="px-3 py-1.5 rounded-lg text-xs font-mono bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer border border-border"
      >
        Download access.json
      </button>
    </div>
  );
}
