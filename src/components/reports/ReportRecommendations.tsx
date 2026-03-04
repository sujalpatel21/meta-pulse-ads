import { Recommendation } from "@/lib/reportEngine";
import { Zap } from "lucide-react";

interface Props {
  recommendations: Recommendation[];
}

const priorityColors: Record<string, string> = {
  urgent: "hsl(var(--metric-negative))",
  high: "hsl(var(--metric-warning))",
  medium: "hsl(var(--chart-1))",
  low: "hsl(var(--metric-neutral))",
};

export default function ReportRecommendations({ recommendations }: Props) {
  if (recommendations.length === 0) return null;

  return (
    <div className="chart-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Zap size={16} className="text-primary" />
        <h2 className="text-sm font-semibold text-foreground">🧠 AI Recommendations</h2>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/15 text-primary font-mono">{recommendations.length} ACTIONS</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {recommendations.map((r, i) => (
          <div key={i} className="p-3 rounded-lg bg-card border border-border hover:border-primary/30 transition-colors group">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-base">{r.icon}</span>
                <span className="text-xs font-bold text-foreground">{r.action}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] px-1.5 py-0.5 rounded capitalize font-mono" style={{
                  background: `${priorityColors[r.priority]}15`,
                  color: priorityColors[r.priority],
                }}>
                  {r.priority}
                </span>
                {/* Impact score */}
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 10 }).map((_, j) => (
                    <div key={j} className="w-1 h-3 rounded-sm" style={{
                      background: j < r.impact ? priorityColors[r.priority] : "hsl(var(--muted))",
                    }} />
                  ))}
                </div>
              </div>
            </div>
            <div className="text-[10px] font-medium text-primary/70 mb-1 truncate">{r.target}</div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">{r.detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
