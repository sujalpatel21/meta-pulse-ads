import { Campaign } from "@/data/mockData";
import { formatCurrencyShort, getCurrencySymbol } from "@/lib/currency";
import { ArrowDown, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface FunnelStage {
  label: string;
  value: number;
  color: string;
}

interface FunnelChartProps {
  campaigns: Campaign[];
  currency?: string;
}

export default function FunnelChart({ campaigns, currency = "INR" }: FunnelChartProps) {
  const totals = campaigns.reduce(
    (acc, c) => ({
      impressions: acc.impressions + c.impressions,
      clicks: acc.clicks + c.clicks,
      leads: acc.leads + c.leads,
      purchases: acc.purchases + c.purchases,
      spend: acc.spend + c.spend,
    }),
    { impressions: 0, clicks: 0, leads: 0, purchases: 0, spend: 0 }
  );

  const stages: FunnelStage[] = [
    { label: "Impressions", value: totals.impressions, color: "hsl(var(--chart-1))" },
    { label: "Clicks", value: totals.clicks, color: "hsl(var(--chart-2))" },
    { label: "Leads", value: totals.leads, color: "hsl(var(--chart-3))" },
    { label: "Purchases", value: totals.purchases, color: "hsl(var(--chart-4))" },
  ];

  const maxValue = stages[0]?.value || 1;

  // Conversion rates between stages
  const conversionRates = stages.slice(1).map((stage, i) => {
    const prev = stages[i].value;
    return prev > 0 ? (stage.value / prev) * 100 : 0;
  });

  // Find biggest drop-off
  const minConversionIdx = conversionRates.indexOf(Math.min(...conversionRates));

  function formatNum(n: number): string {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return n.toFixed(0);
  }

  // Cost metrics
  const cpc = totals.clicks > 0 ? totals.spend / totals.clicks : 0;
  const cpl = totals.leads > 0 ? totals.spend / totals.leads : 0;
  const costPerPurchase = totals.purchases > 0 ? totals.spend / totals.purchases : 0;

  return (
    <div className="space-y-6">
      {/* Funnel bars */}
      <div className="space-y-1">
        {stages.map((stage, i) => {
          const widthPct = Math.max((stage.value / maxValue) * 100, 8);
          const isLeakPoint = i > 0 && i - 1 === minConversionIdx;

          return (
            <div key={stage.label}>
              {/* Conversion arrow between stages */}
              {i > 0 && (
                <div className="flex items-center justify-center gap-2 py-1.5">
                  <ArrowDown size={12} className="text-muted-foreground" />
                  <span
                    className={cn(
                      "text-[11px] font-mono px-2 py-0.5 rounded-full",
                      isLeakPoint
                        ? "font-semibold"
                        : ""
                    )}
                    style={{
                      background: isLeakPoint
                        ? "hsl(var(--metric-negative) / 0.12)"
                        : "hsl(var(--muted))",
                      color: isLeakPoint
                        ? "hsl(var(--metric-negative))"
                        : "hsl(var(--muted-foreground))",
                    }}
                  >
                    {conversionRates[i - 1].toFixed(2)}% conversion
                    {isLeakPoint && " ⚠️ biggest drop"}
                  </span>
                  <ArrowDown size={12} className="text-muted-foreground" />
                </div>
              )}

              {/* Bar */}
              <div className="flex items-center gap-3">
                <div className="w-24 text-right shrink-0">
                  <span className="text-xs font-medium text-foreground">{stage.label}</span>
                </div>
                <div className="flex-1 relative">
                  <div
                    className="h-10 rounded-lg flex items-center px-3 transition-all duration-500"
                    style={{
                      width: `${widthPct}%`,
                      background: `${stage.color}`,
                      opacity: 0.85,
                      minWidth: "80px",
                    }}
                  >
                    <span className="text-sm font-bold" style={{ color: "hsl(var(--primary-foreground))" }}>
                      {formatNum(stage.value)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Cost per stage */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Cost per Click", value: formatCurrencyShort(cpc, currency) },
          { label: "Cost per Lead", value: formatCurrencyShort(cpl, currency) },
          { label: "Cost per Purchase", value: totals.purchases > 0 ? formatCurrencyShort(costPerPurchase, currency) : "N/A" },
        ].map((m, i) => (
          <div
            key={i}
            className="text-center p-3 rounded-lg"
            style={{ background: "hsl(var(--muted) / 0.5)" }}
          >
            <div className="text-base font-bold text-foreground">{m.value}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">{m.label}</div>
          </div>
        ))}
      </div>

      {/* Leakage callout */}
      {minConversionIdx >= 0 && conversionRates[minConversionIdx] < 10 && (
        <div
          className="flex items-start gap-3 p-3 rounded-lg border"
          style={{
            background: "hsl(38 92% 50% / 0.06)",
            borderColor: "hsl(38 92% 50% / 0.2)",
          }}
        >
          <AlertTriangle size={16} style={{ color: "hsl(38 92% 60%)" }} className="mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-foreground">
              Biggest leakage: {stages[minConversionIdx].label} → {stages[minConversionIdx + 1].label}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Only {conversionRates[minConversionIdx].toFixed(2)}% conversion at this stage.
              {minConversionIdx === 0 && " Improve ad relevance and targeting."}
              {minConversionIdx === 1 && " Optimize landing pages and lead forms."}
              {minConversionIdx === 2 && " Improve offer quality and follow-up sequences."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
