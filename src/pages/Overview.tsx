import { useDashboard } from "@/components/layout/Layout";
import { computeKPIs, aggregateDailyMetrics } from "@/data/mockData";
import KPICards, { buildKPIData } from "@/components/dashboard/KPICards";
import { SpendLeadsChart, CampaignBarChart, SpendPieChart } from "@/components/dashboard/Charts";
import CampaignTable from "@/components/dashboard/CampaignTable";
import AIInsights from "@/components/dashboard/AIInsights";
import AlertsBanner from "@/components/alerts/AlertsBanner";

export default function Overview() {
  const { selectedAccount, campaigns, campaignsLoading: loading, apiError } = useDashboard();

  const kpis = computeKPIs(campaigns);
  const kpiData = buildKPIData(
    kpis.spend, kpis.impressions, kpis.clicks,
    kpis.leads, kpis.purchases, kpis.ctr, kpis.cpc, kpis.roas
  );
  const dailyMetrics = aggregateDailyMetrics(campaigns);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-bold" style={{ color: "hsl(var(--foreground))" }}>
          Overview Dashboard
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
          {selectedAccount.accountName} · {campaigns.length} campaigns
        </p>
      </div>

      {/* API Error */}
      {apiError && (
        <div className="p-3 rounded-lg text-sm" style={{
          background: "hsl(0 84% 50% / 0.1)",
          color: "hsl(0 84% 60%)",
          border: "1px solid hsl(0 84% 50% / 0.2)",
        }}>
          ⚠️ API Error: {apiError} — Showing fallback data
        </div>
      )}

      {/* AI Insights */}
      {!loading && campaigns.length > 0 && (
        <AIInsights campaigns={campaigns} />
      )}

      {/* Alerts Banner */}
      {!loading && <AlertsBanner campaigns={campaigns} />}

      {/* KPI Cards */}
      <KPICards data={kpiData} loading={loading} />

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="chart-card p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold mb-4" style={{ color: "hsl(var(--foreground))" }}>
            📈 Spend vs Leads (Last 14 Days)
          </h3>
          {loading ? (
            <div className="h-[260px] bg-muted rounded-lg animate-pulse" />
          ) : (
            <SpendLeadsChart data={dailyMetrics} />
          )}
        </div>

        <div className="chart-card p-5">
          <h3 className="text-sm font-semibold mb-4" style={{ color: "hsl(var(--foreground))" }}>
            🥧 Spend by Campaign
          </h3>
          {loading ? (
            <div className="h-[260px] bg-muted rounded-lg animate-pulse" />
          ) : (
            <SpendPieChart campaigns={campaigns} />
          )}
        </div>
      </div>

      <div className="chart-card p-5">
        <h3 className="text-sm font-semibold mb-4" style={{ color: "hsl(var(--foreground))" }}>
          📊 Campaign Performance Comparison
        </h3>
        {loading ? (
          <div className="h-[260px] bg-muted rounded-lg animate-pulse" />
        ) : (
          <CampaignBarChart campaigns={campaigns} />
        )}
      </div>

      <div className="chart-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>
            📋 Campaign Performance Table
          </h3>
          <span className="text-xs px-2 py-1 rounded-full" style={{ background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }}>
            Click row to drill down →
          </span>
        </div>
        {loading ? (
          <div className="space-y-3">
            {[1,2,3,4].map(i => <div key={i} className="h-12 bg-muted rounded-lg animate-pulse" />)}
          </div>
        ) : (
          <CampaignTable campaigns={campaigns} />
        )}
      </div>
    </div>
  );
}
