import { LeakageItem } from "@/lib/reportEngine";
import { Droplets } from "lucide-react";

interface Props {
  leakage: LeakageItem[];
  totalLeakage: number;
}

const severityColors: Record<string, string> = {
  critical: "hsl(var(--metric-negative))",
  high: "hsl(var(--metric-warning))",
  medium: "hsl(var(--metric-neutral))",
};

export default function ReportLeakage({ leakage, totalLeakage }: Props) {
  if (leakage.length === 0) return null;

  return (
    <div className="chart-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Droplets size={16} className="text-metric-negative" />
          <h2 className="text-sm font-semibold text-foreground">⚠️ Budget Leakage Detection</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Total Leakage:</span>
          <span className="text-sm font-bold font-mono text-metric-negative">₹{totalLeakage.toLocaleString("en-IN")}</span>
        </div>
      </div>

      {/* Leak meter */}
      <div className="mb-4">
        <div className="progress-bar h-2">
          <div
            className="progress-fill danger"
            style={{ width: `${Math.min(100, (totalLeakage / (totalLeakage + 50000)) * 100)}%` }}
          />
        </div>
        <div className="flex justify-between mt-1 text-[9px] text-muted-foreground">
          <span>₹0</span>
          <span>₹{totalLeakage.toLocaleString("en-IN")} leaked</span>
        </div>
      </div>

      <div className="space-y-2">
        {leakage.map((l, i) => (
          <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-card border border-border">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: severityColors[l.severity] }} />
              <div className="min-w-0">
                <div className="text-xs font-medium text-foreground truncate">{l.source}</div>
                <div className="text-[10px] text-muted-foreground">{l.reason}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[9px] px-1.5 py-0.5 rounded capitalize font-mono" style={{
                background: `${severityColors[l.severity]}15`,
                color: severityColors[l.severity],
              }}>
                {l.severity}
              </span>
              <span className="text-xs font-bold font-mono text-metric-negative">₹{l.amount.toLocaleString("en-IN")}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
