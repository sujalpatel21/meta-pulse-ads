import { useDashboard } from "@/components/layout/Layout";
import { Wifi, WifiOff } from "lucide-react";

export default function Settings() {
  const { liveMode, accounts } = useDashboard();

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-foreground">Settings</h1>
        <p className="text-sm mt-0.5 text-muted-foreground">Configure your MetaPulse workspace</p>
      </div>

      {/* Connection Status */}
      <div className={`chart-card p-5 border-l-4 ${liveMode ? "border-l-emerald-500" : "border-l-amber-500"}`}>
        <div className="flex items-center gap-3 mb-2">
          {liveMode ? <Wifi size={20} className="text-emerald-400" /> : <WifiOff size={20} className="text-amber-400" />}
          <h3 className="text-sm font-semibold text-foreground">
            {liveMode ? "✅ Connected to Meta API" : "⚠️ Using Mock Data"}
          </h3>
        </div>
        <p className="text-sm text-muted-foreground">
          {liveMode
            ? `Live data syncing from ${accounts.length} ad account(s). All dashboard data reflects your real Meta Ads performance.`
            : "Your Meta access token may be invalid or expired. Dashboard is showing demo data. Re-configure your token to see live data."}
        </p>
        {liveMode && (
          <div className="mt-3 flex flex-wrap gap-2">
            {accounts.map((a) => (
              <span key={a.accountId} className="text-xs px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400">
                {a.accountName} ({a.accountId})
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Meta API Integration */}
        <div className="chart-card p-5">
          <h3 className="text-sm font-semibold mb-1 text-foreground">🔗 Meta API Integration</h3>
          <p className="text-xs mb-4 text-muted-foreground">Your Meta access token is stored securely in backend secrets.</p>
          <div className="space-y-3">
            {[
              "Token Status: " + (liveMode ? "Valid ✅" : "Invalid/Missing ❌"),
              "API Version: v19.0",
              "Permissions: ads_read, read_insights",
              "Data Source: Meta Marketing API",
            ].map((item) => (
              <div key={item} className="flex items-center justify-between">
                <label className="text-xs font-medium text-foreground">{item}</label>
                <span className="text-xs font-mono text-muted-foreground">{item.split(": ")[1]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Alert Thresholds */}
        <div className="chart-card p-5">
          <h3 className="text-sm font-semibold mb-1 text-foreground">🎯 Alert Thresholds</h3>
          <p className="text-xs mb-4 text-muted-foreground">Set custom thresholds for automated performance alerts.</p>
          <div className="space-y-3">
            {["CPL Alert Threshold (₹)", "ROAS Drop Threshold", "Budget Overspend %", "CTR Drop %"].map((item) => (
              <div key={item} className="flex items-center justify-between">
                <label className="text-xs font-medium text-foreground">{item}</label>
                <input
                  type="text"
                  placeholder="Configure..."
                  className="text-xs px-3 py-1.5 rounded-lg border w-40 outline-none focus:border-primary/60 transition-colors bg-muted border-border text-foreground"
                />
              </div>
            ))}
          </div>
          <button
            className="mt-4 w-full py-2 rounded-lg text-xs font-semibold transition-all hover:opacity-90 bg-primary text-primary-foreground"
            onClick={() => alert("Settings saved — demo mode")}
          >
            Save Settings
          </button>
        </div>

        {/* Team Access */}
        <div className="chart-card p-5">
          <h3 className="text-sm font-semibold mb-1 text-foreground">👥 Team Access</h3>
          <p className="text-xs mb-4 text-muted-foreground">Manage team members and their client access permissions.</p>
          <div className="space-y-3">
            {["Add Team Member", "Client Permissions", "Role Management", "API Access"].map((item) => (
              <div key={item} className="flex items-center justify-between">
                <label className="text-xs font-medium text-foreground">{item}</label>
                <input
                  type="text"
                  placeholder="Configure..."
                  className="text-xs px-3 py-1.5 rounded-lg border w-40 outline-none focus:border-primary/60 transition-colors bg-muted border-border text-foreground"
                />
              </div>
            ))}
          </div>
          <button
            className="mt-4 w-full py-2 rounded-lg text-xs font-semibold transition-all hover:opacity-90 bg-primary text-primary-foreground"
            onClick={() => alert("Settings saved — demo mode")}
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
