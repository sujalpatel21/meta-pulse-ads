import { Campaign, computeKPIs } from "@/data/mockData";
import { ReportData } from "@/lib/reportEngine";
import { X, Download } from "lucide-react";

interface Props {
  kpis: ReturnType<typeof computeKPIs>;
  campaigns: Campaign[];
  analysis: ReportData;
  dateRange: string;
  accountName: string;
  onClose: () => void;
}

export default function ReportPreview({ kpis, campaigns, analysis, dateRange, accountName, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-8" onClick={onClose}>
      <div
        className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl border border-border bg-card shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal header */}
        <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-card z-10">
          <span className="text-sm font-semibold text-foreground">📄 Report Preview</span>
          <div className="flex gap-2">
            <button className="text-xs px-3 py-1.5 rounded-lg bg-primary text-primary-foreground flex items-center gap-1">
              <Download size={12} /> Download PDF
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Report content */}
        <div className="p-8 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-border">
            <div>
              <div className="text-2xl font-bold gradient-text">MetaPulse Intelligence</div>
              <div className="text-xs text-muted-foreground mt-1">
                AI Performance Report — {new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
              </div>
            </div>
            <div className="text-right text-xs text-muted-foreground">
              <div className="font-semibold text-foreground">{accountName}</div>
              <div>{dateRange} performance window</div>
            </div>
          </div>

          {/* KPI Summary */}
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">📊 Performance Overview</div>
            <div className="grid grid-cols-5 gap-3">
              {[
                { label: "Total Spend", value: `₹${kpis.spend.toLocaleString("en-IN")}` },
                { label: "Total Leads", value: kpis.leads.toLocaleString("en-IN") },
                { label: "Avg CTR", value: `${kpis.ctr.toFixed(2)}%` },
                { label: "Avg CPL", value: kpis.cpl > 0 ? `₹${kpis.cpl.toFixed(0)}` : "—" },
                { label: "ROAS", value: `${kpis.roas.toFixed(1)}x` },
              ].map(m => (
                <div key={m.label} className="p-3 rounded-lg bg-muted text-center">
                  <div className="text-[10px] text-muted-foreground mb-1">{m.label}</div>
                  <div className="text-base font-bold font-mono text-primary">{m.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Budget Leakage */}
          {analysis.totalLeakage > 0 && (
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">⚠️ Budget Leakage</div>
              <div className="p-3 rounded-lg border border-metric-negative/30 bg-metric-negative/5">
                <div className="text-sm font-bold font-mono text-metric-negative mb-1">
                  ₹{analysis.totalLeakage.toLocaleString("en-IN")} identified as leaked budget
                </div>
                <div className="text-[11px] text-muted-foreground">
                  Across {analysis.leakage.length} sources — {analysis.leakage.filter(l => l.severity === "critical").length} critical
                </div>
              </div>
            </div>
          )}

          {/* Scaling Opportunities */}
          {analysis.scalingOpportunities > 0 && (
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">🚀 Scaling Opportunities</div>
              {analysis.campaignPerformance.filter(p => p.status === "scaling").map(p => (
                <div key={p.campaign.campaignId} className="p-3 rounded-lg border border-metric-positive/30 bg-metric-positive/5 mb-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-foreground">{p.campaign.name}</span>
                    <span className="text-[10px] font-mono text-metric-positive">ROAS {p.campaign.roas.toFixed(1)}x | CTR {p.campaign.ctr.toFixed(1)}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* AI Insights */}
          {analysis.recommendations.length > 0 && (
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">🧠 AI Insights</div>
              <div className="space-y-2">
                {analysis.recommendations.slice(0, 5).map((r, i) => (
                  <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-muted">
                    <span>{r.icon}</span>
                    <div>
                      <span className="text-xs font-semibold text-foreground">{r.action}:</span>{" "}
                      <span className="text-[11px] text-muted-foreground">{r.detail}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Campaign Breakdown */}
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">📈 Campaign Breakdown</div>
            <div className="space-y-1.5">
              {campaigns.slice(0, 6).map(c => (
                <div key={c.campaignId} className="flex items-center justify-between p-2 rounded-lg bg-muted text-xs">
                  <span className="font-medium text-foreground">{c.name}</span>
                  <div className="flex gap-4 font-mono text-muted-foreground">
                    <span>₹{c.spend.toLocaleString("en-IN")}</span>
                    <span>{c.leads} leads</span>
                    <span>{c.ctr.toFixed(2)}% CTR</span>
                    <span>{c.roas.toFixed(1)}x ROAS</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-border text-center">
            <div className="text-[10px] text-muted-foreground">
              Generated by MetaPulse Intelligence Engine • {new Date().toLocaleString("en-IN")}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
