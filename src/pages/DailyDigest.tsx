import { useDashboard } from "@/components/layout/Layout";
import { analyzeAccount, CampaignIntel } from "@/lib/decisionEngine";
import { formatCurrencyShort, formatCurrencyFixed, getCurrencySymbol } from "@/lib/currency";
import { computeKPIs } from "@/data/mockData";
import {
  AlertTriangle, TrendingUp, TrendingDown, Zap, Target,
  Clock, ArrowUpRight, ArrowDownRight, Shield, Flame,
  CheckCircle2, XCircle, Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Priority = "critical" | "warning" | "opportunity";

interface AttentionItem {
  priority: Priority;
  title: string;
  detail: string;
  metric?: string;
  icon: React.ReactNode;
}

function buildAttentionItems(
  intels: CampaignIntel[],
  currency: string
): AttentionItem[] {
  const items: AttentionItem[] = [];

  // Kill signals → critical
  intels
    .filter((ci) => ci.primaryAction === "kill")
    .forEach((ci) => {
      items.push({
        priority: "critical",
        title: `Pause "${ci.campaign.name}"`,
        detail: `Health ${ci.healthScore}/100 · ${formatCurrencyShort(ci.wastedSpend, currency)} wasted spend · ${ci.campaign.leads} leads`,
        metric: `CPL ${formatCurrencyFixed(ci.cpl, currency, 0)}`,
        icon: <XCircle size={16} />,
      });
    });

  // Fatigue
  intels
    .filter((ci) => ci.fatiguePercent > 40)
    .forEach((ci) => {
      items.push({
        priority: "warning",
        title: `Creative fatigue in "${ci.campaign.name}"`,
        detail: `${ci.fatiguePercent.toFixed(0)}% of ads show fatigue signs — refresh creatives`,
        icon: <Flame size={16} />,
      });
    });

  // Over-pacing
  intels
    .filter((ci) => ci.budgetPacing > 110)
    .forEach((ci) => {
      items.push({
        priority: "warning",
        title: `Budget overspend: "${ci.campaign.name}"`,
        detail: `Pacing at ${ci.budgetPacing.toFixed(0)}% of budget (${formatCurrencyShort(ci.campaign.spend, currency)} / ${formatCurrencyShort(ci.campaign.budget, currency)})`,
        icon: <AlertTriangle size={16} />,
      });
    });

  // Scale opportunities
  intels
    .filter((ci) => ci.primaryAction === "scale")
    .forEach((ci) => {
      items.push({
        priority: "opportunity",
        title: `Scale "${ci.campaign.name}"`,
        detail: `Strong performance · Health ${ci.healthScore}/100 · +${ci.projectedLeadsAt20} leads at +20% budget`,
        metric: `ROAS ${ci.campaign.roas.toFixed(1)}x`,
        icon: <TrendingUp size={16} />,
      });
    });

  // Sort: critical first, then warning, then opportunity
  const order: Record<Priority, number> = { critical: 0, warning: 1, opportunity: 2 };
  items.sort((a, b) => order[a.priority] - order[b.priority]);
  return items;
}

const priorityStyles: Record<Priority, { bg: string; border: string; text: string; badge: string }> = {
  critical: {
    bg: "hsl(0 84% 60% / 0.06)",
    border: "hsl(0 84% 60% / 0.2)",
    text: "hsl(0 84% 65%)",
    badge: "hsl(0 84% 60%)",
  },
  warning: {
    bg: "hsl(38 92% 50% / 0.06)",
    border: "hsl(38 92% 50% / 0.2)",
    text: "hsl(38 92% 60%)",
    badge: "hsl(38 92% 50%)",
  },
  opportunity: {
    bg: "hsl(142 71% 45% / 0.06)",
    border: "hsl(142 71% 45% / 0.2)",
    text: "hsl(142 71% 55%)",
    badge: "hsl(142 71% 45%)",
  },
};

export default function DailyDigest() {
  const { campaigns, campaignsLoading: loading, selectedAccount } = useDashboard();
  const currency = selectedAccount?.currency || "INR";
  const sym = getCurrencySymbol(currency);
  const accountIntel = analyzeAccount(campaigns);
  const kpis = computeKPIs(campaigns);
  const attentionItems = buildAttentionItems(accountIntel.campaignIntels, currency);

  const activeCampaigns = campaigns.filter((c) => c.status === "Active");
  const pausedCampaigns = campaigns.filter((c) => c.status === "Paused");

  // Spend pacing
  const totalBudget = campaigns.reduce((s, c) => s + c.budget, 0);
  const totalSpend = kpis.spend;
  const pacingPct = totalBudget > 0 ? (totalSpend / totalBudget) * 100 : 0;

  const now = new Date();
  const greeting =
    now.getHours() < 12 ? "Good morning" : now.getHours() < 17 ? "Good afternoon" : "Good evening";

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="h-8 w-64 bg-muted rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground">{greeting} 👋</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Here's your executive briefing for {now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            label: "Total Spend",
            value: formatCurrencyShort(totalSpend, currency),
            sub: `of ${formatCurrencyShort(totalBudget, currency)} budget`,
            icon: <Target size={14} />,
            color: "hsl(var(--brand))",
          },
          {
            label: "Account Health",
            value: `${accountIntel.healthScore}/100`,
            sub: accountIntel.healthScore > 70 ? "Strong" : accountIntel.healthScore > 40 ? "Needs attention" : "Critical",
            icon: <Shield size={14} />,
            color:
              accountIntel.healthScore > 70
                ? "hsl(var(--metric-positive))"
                : accountIntel.healthScore > 40
                ? "hsl(var(--metric-warning))"
                : "hsl(var(--metric-negative))",
          },
          {
            label: "Active / Paused",
            value: `${activeCampaigns.length} / ${pausedCampaigns.length}`,
            sub: `${campaigns.length} total campaigns`,
            icon: <Zap size={14} />,
            color: "hsl(var(--chart-4))",
          },
          {
            label: "Budget Pacing",
            value: `${pacingPct.toFixed(0)}%`,
            sub: pacingPct > 100 ? "Over budget ⚠️" : pacingPct > 80 ? "On track" : "Under-pacing",
            icon: <Clock size={14} />,
            color: pacingPct > 100 ? "hsl(var(--metric-negative))" : "hsl(var(--metric-positive))",
          },
        ].map((stat, i) => (
          <div
            key={i}
            className="chart-card p-4 flex flex-col gap-2"
          >
            <div className="flex items-center gap-1.5">
              <span style={{ color: stat.color }}>{stat.icon}</span>
              <span className="text-xs text-muted-foreground">{stat.label}</span>
            </div>
            <div className="text-lg font-bold text-foreground">{stat.value}</div>
            <div className="text-[11px] text-muted-foreground">{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* Attention Items */}
      <div className="chart-card p-5">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
          <span
            className="w-1.5 h-4 rounded-full"
            style={{ background: "hsl(var(--metric-negative))" }}
          />
          Needs Your Attention
          {attentionItems.length > 0 && (
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{
                background: "hsl(var(--metric-negative) / 0.12)",
                color: "hsl(var(--metric-negative))",
              }}
            >
              {attentionItems.filter((a) => a.priority === "critical").length} critical
            </span>
          )}
        </h2>

        {attentionItems.length === 0 ? (
          <div className="flex items-center gap-3 p-4 rounded-lg" style={{ background: "hsl(142 71% 45% / 0.06)" }}>
            <CheckCircle2 size={20} style={{ color: "hsl(142 71% 55%)" }} />
            <div>
              <p className="text-sm font-medium text-foreground">All clear! 🎉</p>
              <p className="text-xs text-muted-foreground">No critical issues detected. Your campaigns are performing within expected parameters.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {attentionItems.slice(0, 6).map((item, i) => {
              const style = priorityStyles[item.priority];
              return (
                <div
                  key={i}
                  className="flex items-start gap-3 p-3 rounded-lg border transition-colors"
                  style={{
                    background: style.bg,
                    borderColor: style.border,
                  }}
                >
                  <span className="mt-0.5" style={{ color: style.text }}>
                    {item.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{item.title}</span>
                      {item.metric && (
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded font-mono"
                          style={{ background: style.border, color: style.text }}
                        >
                          {item.metric}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.detail}</p>
                  </div>
                  <span
                    className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full shrink-0"
                    style={{ background: style.border, color: style.text }}
                  >
                    {item.priority}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Performance Snapshot */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Scale Opportunities */}
        <div className="chart-card p-5">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
            <ArrowUpRight size={14} style={{ color: "hsl(var(--metric-positive))" }} />
            Scale Opportunities
          </h3>
          {accountIntel.campaignIntels
            .filter((ci) => ci.primaryAction === "scale")
            .length === 0 ? (
            <p className="text-xs text-muted-foreground">No scale candidates identified right now.</p>
          ) : (
            <div className="space-y-2">
              {accountIntel.campaignIntels
                .filter((ci) => ci.primaryAction === "scale")
                .slice(0, 4)
                .map((ci) => (
                  <div
                    key={ci.campaign.campaignId}
                    className="flex items-center justify-between p-2.5 rounded-lg border"
                    style={{
                      background: "hsl(142 71% 45% / 0.04)",
                      borderColor: "hsl(142 71% 45% / 0.15)",
                    }}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{ci.campaign.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        ROAS {ci.campaign.roas.toFixed(1)}x · CPL {formatCurrencyFixed(ci.cpl, currency, 0)}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-bold" style={{ color: "hsl(var(--metric-positive))" }}>
                        +{ci.projectedLeadsAt20} leads
                      </div>
                      <p className="text-[10px] text-muted-foreground">at +20% budget</p>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Kill / Pause Recommendations */}
        <div className="chart-card p-5">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
            <ArrowDownRight size={14} style={{ color: "hsl(var(--metric-negative))" }} />
            Pause Recommendations
          </h3>
          {accountIntel.campaignIntels
            .filter((ci) => ci.primaryAction === "kill")
            .length === 0 ? (
            <p className="text-xs text-muted-foreground">No campaigns flagged for pausing.</p>
          ) : (
            <div className="space-y-2">
              {accountIntel.campaignIntels
                .filter((ci) => ci.primaryAction === "kill")
                .slice(0, 4)
                .map((ci) => (
                  <div
                    key={ci.campaign.campaignId}
                    className="flex items-center justify-between p-2.5 rounded-lg border"
                    style={{
                      background: "hsl(0 84% 60% / 0.04)",
                      borderColor: "hsl(0 84% 60% / 0.15)",
                    }}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{ci.campaign.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        Health {ci.healthScore}/100 · {ci.campaign.leads} leads
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-bold" style={{ color: "hsl(var(--metric-negative))" }}>
                        {formatCurrencyShort(ci.wastedSpend, currency)}
                      </div>
                      <p className="text-[10px] text-muted-foreground">wasted spend</p>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Key Metrics Summary */}
      <div className="chart-card p-5">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
          <Eye size={14} style={{ color: "hsl(var(--brand))" }} />
          Key Metrics Snapshot
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Avg CPL", value: formatCurrencyFixed(accountIntel.avgCPL, currency, 0) },
            { label: "Avg CPC", value: formatCurrencyFixed(accountIntel.avgCPC, currency, 2) },
            { label: "Avg CTR", value: `${accountIntel.avgCTR.toFixed(2)}%` },
            { label: "Budget Leaked", value: formatCurrencyShort(accountIntel.totalBudgetLeak, currency) },
          ].map((m, i) => (
            <div key={i} className="text-center p-3 rounded-lg" style={{ background: "hsl(var(--muted) / 0.5)" }}>
              <div className="text-lg font-bold text-foreground">{m.value}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">{m.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
