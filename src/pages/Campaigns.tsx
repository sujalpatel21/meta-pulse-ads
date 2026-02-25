import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useDashboard } from "@/components/layout/Layout";
import { Campaign } from "@/data/mockData";
import { SpendLeadsChart } from "@/components/dashboard/Charts";
import { TrendingUp, TrendingDown, ArrowRight, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Campaigns() {
  const { selectedAccount, campaigns, campaignsLoading } = useDashboard();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const campaignId = searchParams.get("id");

  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

  useEffect(() => {
    if (campaigns.length === 0) return;
    if (campaignId) {
      const c = campaigns.find((c) => c.campaignId === campaignId);
      setSelectedCampaign(c || campaigns[0] || null);
    } else {
      setSelectedCampaign(campaigns[0] || null);
    }
  }, [campaignId, campaigns]);

  if (campaignsLoading) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="h-64 bg-muted rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!selectedCampaign) return null;

  const cpl = selectedCampaign.leads > 0 ? selectedCampaign.spend / selectedCampaign.leads : 0;
  const budgetPct = selectedCampaign.budget > 0 ? Math.min((selectedCampaign.spend / selectedCampaign.budget) * 100, 100) : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/")}
          className="p-1.5 rounded-md hover:bg-muted transition-colors"
          style={{ color: "hsl(var(--muted-foreground))" }}
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-xl font-bold" style={{ color: "hsl(var(--foreground))" }}>Campaigns</h1>
          <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>{selectedAccount?.accountName || ""}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Campaign List */}
        <div className="chart-card p-4 space-y-2 lg:col-span-1">
          <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "hsl(var(--muted-foreground))" }}>
            All Campaigns
          </h3>
          {campaigns.map((c) => (
            <button
              key={c.campaignId}
              onClick={() => setSelectedCampaign(c)}
              className={cn(
                "w-full text-left p-3 rounded-lg transition-all border",
                selectedCampaign?.campaignId === c.campaignId
                  ? "border-brand/30 bg-brand/10"
                  : "border-transparent hover:bg-muted"
              )}
            >
              <div className="text-xs font-semibold leading-tight truncate" style={{
                color: selectedCampaign?.campaignId === c.campaignId ? "hsl(var(--brand))" : "hsl(var(--foreground))"
              }}>
                {c.name}
              </div>
              <div className="text-xs mt-1 flex items-center gap-2" style={{ color: "hsl(var(--muted-foreground))" }}>
                <span>₹{(c.spend / 1000).toFixed(0)}K</span>
                <span className={cn("px-1.5 py-0.5 rounded-full text-xs", c.status === "Active" ? "status-active" : "status-paused")}>
                  {c.status}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Campaign Detail */}
        <div className="lg:col-span-3 space-y-4">
          <div className="chart-card p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold" style={{ color: "hsl(var(--foreground))" }}>
                  {selectedCampaign.name}
                </h2>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs px-2 py-1 rounded-full" style={{ background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }}>
                    {selectedCampaign.objective}
                  </span>
                  <span className={cn("text-xs px-2 py-1 rounded-full font-medium", selectedCampaign.status === "Active" ? "status-active" : "status-paused")}>
                    {selectedCampaign.status}
                  </span>
                </div>
              </div>
              <button
                onClick={() => navigate(`/adsets?campaign=${selectedCampaign.campaignId}`)}
                className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg font-medium transition-all"
                style={{ background: "hsl(var(--brand))", color: "hsl(var(--primary-foreground))" }}
              >
                View Ad Sets <ArrowRight size={12} />
              </button>
            </div>

            {/* Budget Progress */}
            {selectedCampaign.budget > 0 && (
              <div className="mb-4">
                <div className="flex justify-between text-xs mb-1.5" style={{ color: "hsl(var(--muted-foreground))" }}>
                  <span>Budget Used</span>
                  <span>₹{selectedCampaign.spend.toLocaleString("en-IN")} / ₹{selectedCampaign.budget.toLocaleString("en-IN")}</span>
                </div>
                <div className="progress-bar">
                  <div
                    className={cn("progress-fill", budgetPct > 90 && "danger")}
                    style={{ width: `${budgetPct}%` }}
                  />
                </div>
                <div className="text-xs mt-1 text-right" style={{ color: budgetPct > 90 ? "hsl(var(--metric-negative))" : "hsl(var(--muted-foreground))" }}>
                  {budgetPct.toFixed(1)}% used
                </div>
              </div>
            )}

            {/* KPIs */}
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: "Spend", value: `₹${selectedCampaign.spend.toLocaleString("en-IN")}` },
                { label: "Leads", value: selectedCampaign.leads.toString() },
                { label: "CTR", value: `${selectedCampaign.ctr.toFixed(2)}%` },
                { label: "ROAS", value: `${selectedCampaign.roas.toFixed(1)}x` },
                { label: "CPC", value: `₹${selectedCampaign.cpc.toFixed(2)}` },
                { label: "CPL", value: cpl > 0 ? `₹${cpl.toFixed(0)}` : "—" },
                { label: "Impressions", value: selectedCampaign.impressions.toLocaleString("en-IN") },
                { label: "Clicks", value: selectedCampaign.clicks.toLocaleString("en-IN") },
              ].map((m) => (
                <div key={m.label} className="p-3 rounded-lg" style={{ background: "hsl(var(--muted))" }}>
                  <div className="text-xs mb-1" style={{ color: "hsl(var(--muted-foreground))" }}>{m.label}</div>
                  <div className="text-sm font-bold font-mono" style={{ color: "hsl(var(--foreground))" }}>{m.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Trend Chart */}
          {selectedCampaign.dailyMetrics?.length > 0 && (
            <div className="chart-card p-5">
              <h3 className="text-sm font-semibold mb-4" style={{ color: "hsl(var(--foreground))" }}>
                Spend & Leads Trend
              </h3>
              <SpendLeadsChart data={selectedCampaign.dailyMetrics} />
            </div>
          )}

          {/* Ad Sets Preview */}
          {selectedCampaign.adSets?.length > 0 && (
            <div className="chart-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>
                  Ad Sets ({selectedCampaign.adSets.length})
                </h3>
                <button
                  onClick={() => navigate(`/adsets?campaign=${selectedCampaign.campaignId}`)}
                  className="text-xs flex items-center gap-1"
                  style={{ color: "hsl(var(--brand))" }}
                >
                  View All <ArrowRight size={11} />
                </button>
              </div>
              <div className="space-y-2">
                {selectedCampaign.adSets.map((as) => (
                  <div
                    key={as.adSetId}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                    style={{ border: "1px solid hsl(var(--border))" }}
                    onClick={() => navigate(`/adsets?campaign=${selectedCampaign.campaignId}&adset=${as.adSetId}`)}
                  >
                    <div>
                      <div className="text-sm font-medium" style={{ color: "hsl(var(--foreground))" }}>{as.name}</div>
                      <div className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
                        {as.audienceType} · Freq: {as.frequency}x
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-mono">
                      <div className="text-right">
                        <div style={{ color: "hsl(var(--foreground))" }}>₹{as.spend.toLocaleString("en-IN")}</div>
                        <div style={{ color: "hsl(var(--muted-foreground))" }}>Spend</div>
                      </div>
                      <div className="text-right">
                        <div style={{ color: "hsl(var(--metric-positive))" }}>{as.leads}</div>
                        <div style={{ color: "hsl(var(--muted-foreground))" }}>Leads</div>
                      </div>
                      <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", as.status === "Active" ? "status-active" : "status-paused")}>
                        {as.status}
                      </span>
                      <ArrowRight size={14} style={{ color: "hsl(var(--muted-foreground))" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
