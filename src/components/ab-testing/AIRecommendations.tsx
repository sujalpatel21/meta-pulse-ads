import { Recommendation, RecommendationAction } from "@/lib/abTestEngine";
import { Rocket, Pause, Copy, DollarSign, RefreshCw, Eye, Lightbulb, ArrowRight } from "lucide-react";

interface AIRecommendationsProps {
  recommendations: Recommendation[];
}

const ACTION_CONFIG: Record<RecommendationAction, { icon: React.ReactNode; color: string; bg: string; label: string }> = {
  scale: { icon: <Rocket size={14} />, color: "hsl(var(--metric-positive))", bg: "hsl(var(--metric-positive) / 0.12)", label: "Scale Up" },
  pause: { icon: <Pause size={14} />, color: "hsl(var(--metric-negative))", bg: "hsl(var(--metric-negative) / 0.12)", label: "Pause" },
  duplicate: { icon: <Copy size={14} />, color: "hsl(var(--brand))", bg: "hsl(var(--brand) / 0.12)", label: "Duplicate" },
  increase_budget: { icon: <DollarSign size={14} />, color: "hsl(var(--metric-warning))", bg: "hsl(var(--metric-warning) / 0.12)", label: "Budget ↑" },
  refresh_creative: { icon: <RefreshCw size={14} />, color: "hsl(280 100% 65%)", bg: "hsl(280 100% 65% / 0.12)", label: "Refresh" },
  monitor: { icon: <Eye size={14} />, color: "hsl(var(--muted-foreground))", bg: "hsl(var(--muted) / 0.3)", label: "Monitor" },
};

const PRIORITY_STYLES = {
  high: { dot: "hsl(var(--metric-negative))", label: "High Priority" },
  medium: { dot: "hsl(var(--metric-warning))", label: "Medium" },
  low: { dot: "hsl(var(--muted-foreground))", label: "Low" },
};

export default function AIRecommendations({ recommendations }: AIRecommendationsProps) {
  if (recommendations.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "hsl(var(--brand) / 0.15)" }}>
          <Lightbulb size={15} style={{ color: "hsl(var(--brand))" }} />
        </div>
        <div>
          <h3 className="text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>AI Recommendations</h3>
          <p className="text-[10px]" style={{ color: "hsl(var(--muted-foreground))" }}>{recommendations.length} actions based on test analysis</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {recommendations.map((rec) => {
          const actionCfg = ACTION_CONFIG[rec.action];
          const priorityCfg = PRIORITY_STYLES[rec.priority];

          return (
            <div key={rec.id} className="chart-card p-4 hover:shadow-lg transition-shadow">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: actionCfg.bg }}>
                    <span style={{ color: actionCfg.color }}>{actionCfg.icon}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: actionCfg.color }}>
                      {actionCfg.label}
                    </span>
                    <h4 className="text-xs font-semibold mt-0.5 leading-tight" style={{ color: "hsl(var(--foreground))" }}>
                      {rec.title}
                    </h4>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: priorityCfg.dot }} />
                  <span className="text-[9px] font-medium" style={{ color: "hsl(var(--muted-foreground))" }}>{priorityCfg.label}</span>
                </div>
              </div>

              {/* Reasoning */}
              <p className="text-[11px] leading-relaxed mb-3" style={{ color: "hsl(var(--muted-foreground))" }}>
                {rec.reasoning}
              </p>

              {/* Metrics */}
              {rec.metrics.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {rec.metrics.map((m) => (
                    <div key={m.label} className="px-2 py-1 rounded-md" style={{
                      background: "hsl(var(--muted) / 0.3)",
                      border: "1px solid hsl(var(--border) / 0.5)",
                    }}>
                      <span className="text-[9px] uppercase tracking-wider block" style={{ color: "hsl(var(--muted-foreground))" }}>{m.label}</span>
                      <span className="text-[11px] font-bold" style={{ color: "hsl(var(--foreground))" }}>
                        {m.value}
                        {m.delta && (
                          <span className="ml-1 text-[9px]" style={{
                            color: m.delta.startsWith("+") ? "hsl(var(--metric-negative))" : "hsl(var(--metric-positive))",
                          }}>
                            {m.delta}
                          </span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Impact */}
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md" style={{
                background: actionCfg.bg,
                border: `1px solid ${actionCfg.color}25`,
              }}>
                <ArrowRight size={10} style={{ color: actionCfg.color }} />
                <span className="text-[10px] font-medium" style={{ color: actionCfg.color }}>
                  {rec.impact}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
