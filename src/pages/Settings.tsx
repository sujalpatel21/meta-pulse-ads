export default function Settings() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold" style={{ color: "hsl(var(--foreground))" }}>Settings</h1>
        <p className="text-sm mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>Configure your MetaFlow workspace</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[
          {
            title: "🔗 Meta API Integration",
            desc: "Connect your Meta Business Manager to sync live campaign data.",
            items: ["Meta App ID", "Access Token", "Business Manager ID", "Pixel ID"],
          },
          {
            title: "📧 Email Notifications",
            desc: "Configure automated email reports and alert thresholds.",
            items: ["Report Email", "Alert Recipients", "Daily Digest Time", "Weekly Report Day"],
          },
          {
            title: "🎯 Alert Thresholds",
            desc: "Set custom thresholds for automated performance alerts.",
            items: ["CPL Alert Threshold (₹)", "ROAS Drop Threshold", "Budget Overspend %", "CTR Drop %"],
          },
          {
            title: "👥 Team Access",
            desc: "Manage team members and their client access permissions.",
            items: ["Add Team Member", "Client Permissions", "Role Management", "API Access"],
          },
        ].map((section) => (
          <div key={section.title} className="chart-card p-5">
            <h3 className="text-sm font-semibold mb-1" style={{ color: "hsl(var(--foreground))" }}>{section.title}</h3>
            <p className="text-xs mb-4" style={{ color: "hsl(var(--muted-foreground))" }}>{section.desc}</p>
            <div className="space-y-3">
              {section.items.map((item) => (
                <div key={item} className="flex items-center justify-between">
                  <label className="text-xs font-medium" style={{ color: "hsl(var(--foreground))" }}>{item}</label>
                  <input
                    type="text"
                    placeholder="Configure..."
                    className="text-xs px-3 py-1.5 rounded-lg border w-40 outline-none focus:border-brand/60 transition-colors"
                    style={{
                      background: "hsl(var(--muted))",
                      borderColor: "hsl(var(--border))",
                      color: "hsl(var(--foreground))",
                    }}
                  />
                </div>
              ))}
            </div>
            <button
              className="mt-4 w-full py-2 rounded-lg text-xs font-semibold transition-all hover:opacity-90"
              style={{ background: "hsl(var(--brand))", color: "hsl(var(--primary-foreground))" }}
              onClick={() => alert("Settings saved — demo mode")}
            >
              Save Settings
            </button>
          </div>
        ))}
      </div>

      <div className="chart-card p-5 ai-insight-box">
        <h3 className="text-sm font-semibold mb-2" style={{ color: "hsl(var(--foreground))" }}>🚀 Upgrade to Live API</h3>
        <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
          This dashboard is Meta API-ready. Replace <code className="text-xs px-1.5 py-0.5 rounded bg-muted font-mono">src/services/metaService.ts</code> mock functions with real API calls via Supabase Edge Functions. Access tokens are never stored in the frontend.
        </p>
      </div>
    </div>
  );
}
