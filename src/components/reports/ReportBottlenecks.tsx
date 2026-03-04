import { Bottleneck } from "@/lib/reportEngine";
import { AlertTriangle } from "lucide-react";

interface Props {
  bottlenecks: Bottleneck[];
}

const typeColors: Record<string, string> = {
  landing_page: "hsl(var(--metric-negative))",
  creative: "hsl(var(--metric-warning))",
  audience: "hsl(var(--chart-4))",
  offer: "hsl(var(--metric-negative))",
  targeting: "hsl(var(--metric-warning))",
};

export default function ReportBottlenecks({ bottlenecks }: Props) {
  if (bottlenecks.length === 0) return null;

  return (
    <div className="chart-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle size={16} className="text-metric-warning" />
        <h2 className="text-sm font-semibold text-foreground">🔍 Funnel Bottleneck Detection</h2>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-metric-warning/15 text-metric-warning font-mono">{bottlenecks.length} FOUND</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {bottlenecks.map((b, i) => (
          <div key={i} className="p-3 rounded-lg border border-border bg-card hover:border-primary/30 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-base">{b.icon}</span>
                <span className="text-xs font-semibold text-foreground">{b.title}</span>
              </div>
              <div className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold" style={{
                background: `${typeColors[b.type]}15`,
                color: typeColors[b.type],
              }}>
                {b.metric}: {b.value}
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">{b.detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
