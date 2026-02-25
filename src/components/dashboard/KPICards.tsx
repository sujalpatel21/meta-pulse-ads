import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { formatINR, formatNumber } from "@/services/metaService";

export interface KPIData {
  label: string;
  value: string | number;
  formatted: string;
  change?: number;
  prefix?: string;
  suffix?: string;
  icon?: string;
  color?: "brand" | "positive" | "negative" | "warning" | "neutral";
}

interface KPICardsProps {
  data: KPIData[];
  loading?: boolean;
}

export default function KPICards({ data, loading }: KPICardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="kpi-card p-5 space-y-3 animate-pulse">
            <div className="h-3 w-20 rounded-full bg-muted" />
            <div className="h-7 w-28 rounded-lg bg-muted" />
            <div className="h-3 w-16 rounded-full bg-muted" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {data.map((kpi, i) => (
        <KPICard key={i} kpi={kpi} index={i} />
      ))}
    </div>
  );
}

function KPICard({ kpi, index }: { kpi: KPIData; index: number }) {
  const isUp = kpi.change !== undefined && kpi.change > 0;
  const isDown = kpi.change !== undefined && kpi.change < 0;

  return (
    <div
      className="kpi-card p-5 animate-fade-in"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="flex items-start justify-between mb-3">
        <span
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: "hsl(var(--muted-foreground))" }}
        >
          {kpi.label}
        </span>
        {kpi.icon && (
          <span className="text-lg">{kpi.icon}</span>
        )}
      </div>

      <div
        className="text-2xl font-bold mb-2 font-mono"
        style={{ color: "hsl(var(--foreground))" }}
      >
        {kpi.formatted}
      </div>

      {kpi.change !== undefined && (
        <div
          className="flex items-center gap-1 text-xs font-medium"
          style={{
            color: isUp
              ? "hsl(var(--metric-positive))"
              : isDown
              ? "hsl(var(--metric-negative))"
              : "hsl(var(--metric-neutral))",
          }}
        >
          {isUp ? <TrendingUp size={12} /> : isDown ? <TrendingDown size={12} /> : <Minus size={12} />}
          <span>
            {isUp ? "+" : ""}{kpi.change.toFixed(1)}% vs prev period
          </span>
        </div>
      )}
    </div>
  );
}

// ── KPI factory from campaign data ────────────────────────────────
export function buildKPIData(
  spend: number,
  impressions: number,
  clicks: number,
  leads: number,
  purchases: number,
  ctr: number,
  cpc: number,
  roas: number
): KPIData[] {
  const cpl = leads > 0 ? spend / leads : 0;
  const cpPurchase = purchases > 0 ? spend / purchases : 0;

  return [
    {
      label: "Total Spend",
      value: spend,
      formatted: `₹${spend.toLocaleString("en-IN")}`,
      icon: "💰",
    },
    {
      label: "Impressions",
      value: impressions,
      formatted: formatNumber(impressions),
      icon: "👁️",
    },
    {
      label: "Clicks",
      value: clicks,
      formatted: formatNumber(clicks),
      icon: "🖱️",
    },
    {
      label: "CTR",
      value: ctr,
      formatted: `${ctr.toFixed(2)}%`,
      icon: "📈",
    },
    {
      label: "CPC",
      value: cpc,
      formatted: `₹${cpc.toFixed(2)}`,
      icon: "💸",
    },
    {
      label: "Leads",
      value: leads,
      formatted: leads.toLocaleString("en-IN"),
      icon: "🎯",
    },
    {
      label: "Purchases",
      value: purchases,
      formatted: purchases.toLocaleString("en-IN"),
      icon: "🛒",
    },
    {
      label: "ROAS",
      value: roas,
      formatted: `${roas.toFixed(1)}x`,
      icon: "📊",
    },
  ];
}
