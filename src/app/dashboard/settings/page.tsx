import { getAccessConfig } from '@/lib/access';
import { SectionCard, StatusDot } from '@/components/dashboard';

export default function SettingsPage() {
  const config = getAccessConfig();
  const users = Object.entries(config.users) as [string, { role: string; products?: string[] }][];
  const roles = Object.entries(config.roles) as [string, { pages: string[]; controls: boolean; internal: boolean }][];

  return (
    <div>
      <div className="mb-6 animate-fade-in">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Admin only — access control configuration. Edit <code className="text-primary">config/access.json</code> to change.
        </p>
      </div>

      <SectionCard title="Users" className="mb-6">
        <div className="space-y-3">
          {users.map(([email, user]) => (
            <div key={email} className="flex items-center gap-3 text-sm py-1.5 border-b border-border last:border-0">
              <StatusDot status="good" size="sm" />
              <span className="text-foreground font-mono">{email}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-mono ml-auto">{user.role}</span>
              {user.products && (
                <span className="text-[10px] text-muted-foreground">
                  {user.products.join(', ')}
                </span>
              )}
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Roles" className="mb-6">
        <div className="space-y-4">
          {roles.map(([name, role]) => (
            <div key={name} className="border-b border-border last:border-0 pb-3 last:pb-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-bold text-foreground">{name}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Pages:</span>
                  <span className="text-foreground ml-1 font-mono">{role.pages.join(', ')}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Controls:</span>
                  <span className={`ml-1 font-mono ${role.controls ? 'text-green-400' : 'text-red-400'}`}>
                    {role.controls ? 'yes' : 'no'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Internal:</span>
                  <span className={`ml-1 font-mono ${role.internal ? 'text-green-400' : 'text-red-400'}`}>
                    {role.internal ? 'yes' : 'no'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Raw Config">
        <pre className="text-xs font-mono text-muted-foreground overflow-x-auto whitespace-pre">
          {JSON.stringify(config, null, 2)}
        </pre>
      </SectionCard>
    </div>
  );
}
