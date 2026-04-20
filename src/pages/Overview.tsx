import { useDashboard } from "@/components/layout/Layout";
import { computeKPIs } from "@/data/mockData";
import KPICards, { buildKPIData } from "@/components/dashboard/KPICards";
import { PerformanceSummary } from "@/components/dashboard/Charts";
import CampaignTable from "@/components/dashboard/CampaignTable";
import AIInsights from "@/components/dashboard/AIInsights";
import AlertsBanner from "@/components/alerts/AlertsBanner";
import {
  CampaignHealthHeatmap,
  TopBottomPerformers,
  BestCampaignCard,
  BestCreativeCard,
  SpendROASTrend,
  CampaignSpendBar,
} from "@/components/dashboard/InsightCharts";

export default function Overview() {
  const { selectedAccount, campaigns: rawCampaigns, campaignsLoading: loading, apiError } = useDashboard();
  const campaigns = rawCampaigns ?? [];
  const accountName = selectedAccount?.accountName || "Loading...";

  const kpis = computeKPIs(campaigns);
  const currency = selectedAccount?.currency || "INR";
  const kpiData = buildKPIData(
    kpis.spend, kpis.impressions, kpis.clicks,
    kpis.leads, kpis.purchases, kpis.ctr, kpis.cpc, kpis.roas, currency
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Overview Dashboard</h1>
          <p className="text-sm mt-0.5 text-muted-foreground">{accountName} · {campaigns.length} campaigns</p>
        </div>
        {!loading && campaigns.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[hsl(var(--metric-positive))] animate-pulse" />
            <span className="text-xs text-muted-foreground">Live data</span>
          </div>
        )}
      </div>

      {/* API Error */}
      {apiError && (
        <div className="p-3 rounded-lg text-sm" style={{
          background: "hsl(0 84% 50% / 0.1)", color: "hsl(0 84% 60%)", border: "1px solid hsl(0 84% 50% / 0.2)",
        }}>
          ⚠️ Live API Error: {apiError}
        </div>
      )}

      {/* AI Insights */}
      {!loading && campaigns.length > 0 && <AIInsights campaigns={campaigns} />}

      {/* Alerts Banner */}
      {!loading && <AlertsBanner campaigns={campaigns} />}

      {/* KPI Cards */}
      <KPICards data={kpiData} loading={loading} />

      {/* Performance Summary */}
      {!loading && campaigns.length > 0 && <PerformanceSummary campaigns={campaigns} />}

      {/* Row 1: Best Campaign + Best Creative + Campaign Health Heatmap */}
      {!loading && campaigns.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-4">
            <BestCampaignCard campaigns={campaigns} />
          </div>
          <div className="lg:col-span-3">
            <BestCreativeCard campaigns={campaigns} />
          </div>
          <div className="chart-card p-5 lg:col-span-5">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
              <span className="w-1.5 h-4 rounded-full bg-[hsl(var(--chart-2))]" />
              Campaign Health Matrix
            </h3>
            <CampaignHealthHeatmap campaigns={campaigns} />
          </div>
        </div>
      )}

      {/* Row 2: Spend & ROAS Trend + Spend Breakdown Bar */}
      {!loading && campaigns.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="chart-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <span className="w-1.5 h-4 rounded-full bg-[hsl(var(--chart-1))]" />
                Spend & ROAS Trend
              </h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-[3px] rounded-full" style={{ background: COLORS.blue }} />
                  <span className="text-[10px] text-muted-foreground">Spend</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-[3px] rounded-full" style={{ background: COLORS.green }} />
                  <span className="text-[10px] text-muted-foreground">ROAS</span>
                </div>
              </div>
            </div>
            <SpendROASTrend campaigns={campaigns} />
          </div>

          <div className="chart-card p-5">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
              <span className="w-1.5 h-4 rounded-full bg-[hsl(var(--chart-3))]" />
              Spend Breakdown by Campaign
            </h3>
            <CampaignSpendBar campaigns={campaigns} />
          </div>
        </div>
      )}

      {/* Row 3: Top vs Bottom Performers */}
      {!loading && campaigns.length > 0 && (
        <div className="chart-card p-5">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
            <span className="w-1.5 h-4 rounded-full bg-[hsl(var(--chart-4))]" />
            Top vs Bottom Performers
          </h3>
          <TopBottomPerformers campaigns={campaigns} />
        </div>
      )}

      {/* Campaign Table */}
      <div className="chart-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <span className="w-1.5 h-4 rounded-full bg-[hsl(var(--chart-1))]" />
            Campaign Performance Table
          </h3>
          <span className="text-xs px-2.5 py-1 rounded-full" style={{
            background: "hsl(214 100% 60% / 0.1)", color: "hsl(214 100% 70%)", border: "1px solid hsl(214 100% 60% / 0.2)",
          }}>
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

// Color ref for inline use
const COLORS = {
  blue: "hsl(214, 100%, 60%)",
  green: "hsl(142, 71%, 45%)",
};
