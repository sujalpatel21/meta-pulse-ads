import { useDashboard } from "@/components/layout/Layout";
import FunnelChart from "@/components/dashboard/FunnelChart";
import { Filter } from "lucide-react";

export default function Funnel() {
  const { campaigns, campaignsLoading: loading, selectedAccount } = useDashboard();
  const currency = selectedAccount?.currency || "INR";

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="h-8 w-48 bg-muted rounded-lg animate-pulse" />
        <div className="h-96 bg-muted rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div>
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Filter size={20} style={{ color: "hsl(var(--brand))" }} />
          Conversion Funnel
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {selectedAccount?.accountName || "All accounts"} · {campaigns.length} campaigns
        </p>
      </div>

      <div className="chart-card p-6">
        <h2 className="text-sm font-semibold text-foreground mb-5 flex items-center gap-2">
          <span className="w-1.5 h-4 rounded-full" style={{ background: "hsl(var(--chart-1))" }} />
          Account-Level Funnel
        </h2>
        {campaigns.length === 0 ? (
          <p className="text-sm text-muted-foreground">No campaign data available.</p>
        ) : (
          <FunnelChart campaigns={campaigns} currency={currency} />
        )}
      </div>

      {/* Per-campaign funnels for top 3 */}
      {campaigns.length > 1 && (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-foreground">Top Campaign Funnels</h2>
          {[...campaigns]
            .sort((a, b) => b.spend - a.spend)
            .slice(0, 3)
            .map((c) => (
              <div key={c.campaignId} className="chart-card p-5">
                <h3 className="text-xs font-medium text-muted-foreground mb-3">{c.name}</h3>
                <FunnelChart campaigns={[c]} currency={currency} />
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
