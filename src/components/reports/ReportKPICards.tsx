import { Campaign } from "@/data/mockData";
import { TrendingUp, TrendingDown, DollarSign, Users, MousePointerClick, Eye } from "lucide-react";
import { useDashboard } from "@/components/layout/Layout";
import { formatCurrency, formatCurrencyFixed, getCurrencySymbol } from "@/lib/currency";

interface KPIs {
  spend: number;
  impressions: number;
  clicks: number;
  leads: number;
  purchases: number;
  ctr: number;
  cpc: number;
  cpl: number;
  roas: number;
}

interface Props {
  kpis: KPIs;
  campaigns: Campaign[];
}

export default function ReportKPICards({ kpis, campaigns }: Props) {
  const { selectedAccount } = useDashboard();
  const currency = selectedAccount?.currency || "INR";
  const cards = [
    { label: "Total Spend", value: formatCurrency(kpis.spend, currency), icon: DollarSign, color: "var(--brand)" },
    { label: "Total Leads", value: kpis.leads.toLocaleString(), icon: Users, color: "hsl(var(--metric-positive))" },
    { label: "Avg CTR", value: `${kpis.ctr.toFixed(2)}%`, icon: MousePointerClick, color: "hsl(var(--chart-3))" },
    { label: "Avg CPL", value: kpis.cpl > 0 ? formatCurrencyFixed(kpis.cpl, currency, 0) : "—", icon: TrendingDown, color: "hsl(var(--metric-warning))" },
    { label: "ROAS", value: `${kpis.roas.toFixed(1)}x`, icon: TrendingUp, color: kpis.roas >= 2 ? "hsl(var(--metric-positive))" : "hsl(var(--metric-negative))" },
    { label: "Impressions", value: `${(kpis.impressions / 1000).toFixed(0)}K`, icon: Eye, color: "hsl(var(--chart-4))" },
  ];

  return (
    <div className="grid grid-cols-6 gap-3">
      {cards.map(c => (
        <div key={c.label} className="kpi-card p-4 text-center">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-2" style={{ background: `${c.color}15` }}>
            <c.icon size={16} style={{ color: c.color }} />
          </div>
          <div className="text-lg font-bold font-mono text-foreground">{c.value}</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">{c.label}</div>
        </div>
      ))}
    </div>
  );
}
