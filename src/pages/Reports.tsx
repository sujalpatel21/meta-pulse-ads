import { useDashboard } from "@/components/layout/Layout";
import { computeKPIs } from "@/data/mockData";
import { FileText, Download, Mail, Eye } from "lucide-react";

export default function Reports() {
  const { selectedAccount, dateRange } = useDashboard();
  const kpis = computeKPIs(selectedAccount.campaigns);
  const cpl = kpis.leads > 0 ? kpis.spend / kpis.leads : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold" style={{ color: "hsl(var(--foreground))" }}>Reports</h1>
        <p className="text-sm mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>Generate and export performance reports</p>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: FileText, label: "Generate PDF Report", desc: "Full performance report with charts", color: "hsl(var(--brand))" },
          { icon: Download, label: "Download CSV", desc: "Raw data export for analysis", color: "hsl(var(--metric-positive))" },
          { icon: Mail, label: "Send Email Report", desc: "Schedule daily/weekly email reports", color: "hsl(var(--metric-warning))" },
        ].map((action) => (
          <button
            key={action.label}
            onClick={() => alert(`${action.label} — UI demo only`)}
            className="chart-card p-5 text-left hover:scale-[1.02] transition-transform group"
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: `${action.color}20` }}>
              <action.icon size={20} style={{ color: action.color }} />
            </div>
            <div className="font-semibold text-sm" style={{ color: "hsl(var(--foreground))" }}>{action.label}</div>
            <div className="text-xs mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>{action.desc}</div>
          </button>
        ))}
      </div>

      {/* Mock PDF Preview */}
      <div className="chart-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>📄 Report Preview</h3>
          <button className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg" style={{ background: "hsl(var(--brand))", color: "hsl(var(--primary-foreground))" }}>
            <Eye size={12} /> Preview PDF
          </button>
        </div>

        {/* Mock Report Layout */}
        <div className="rounded-xl p-6 border-2 border-dashed" style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--muted)/0.3)" }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="text-lg font-bold gradient-text">MetaFlow Analytics</div>
              <div className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>Performance Report — {new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</div>
            </div>
            <div className="text-right text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
              <div className="font-semibold" style={{ color: "hsl(var(--foreground))" }}>{selectedAccount.accountName}</div>
              <div>{dateRange} performance</div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3 mb-6">
            {[
              { label: "Total Spend", value: `₹${kpis.spend.toLocaleString("en-IN")}` },
              { label: "Total Leads", value: kpis.leads.toLocaleString("en-IN") },
              { label: "Avg ROAS", value: `${kpis.roas.toFixed(1)}x` },
              { label: "Avg CPL", value: cpl > 0 ? `₹${cpl.toFixed(0)}` : "—" },
            ].map((m) => (
              <div key={m.label} className="p-3 rounded-lg text-center" style={{ background: "hsl(var(--card))" }}>
                <div className="text-xs mb-1" style={{ color: "hsl(var(--muted-foreground))" }}>{m.label}</div>
                <div className="text-base font-bold font-mono" style={{ color: "hsl(var(--brand))" }}>{m.value}</div>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "hsl(var(--muted-foreground))" }}>Campaign Summary</div>
            {selectedAccount.campaigns.slice(0, 4).map((c) => (
              <div key={c.campaignId} className="flex items-center justify-between p-2 rounded-lg text-xs" style={{ background: "hsl(var(--card))" }}>
                <span className="font-medium" style={{ color: "hsl(var(--foreground))" }}>{c.name}</span>
                <div className="flex gap-4 font-mono" style={{ color: "hsl(var(--muted-foreground))" }}>
                  <span>₹{c.spend.toLocaleString("en-IN")}</span>
                  <span>{c.leads} leads</span>
                  <span>{c.ctr.toFixed(2)}% CTR</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
