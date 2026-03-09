import { AutoDetectedTest, TestVariant, TestVerdict } from "@/lib/abTestEngine";
import { formatINR } from "@/services/metaService";
import { Trophy, TrendingUp, TrendingDown, AlertTriangle, Clock, Ban, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface TestComparisonTableProps {
  test: AutoDetectedTest;
}

function VerdictBadge({ verdict, confidence }: { verdict: TestVerdict; confidence: number }) {
  const config = {
    winner: { bg: "hsl(var(--metric-positive) / 0.15)", color: "hsl(var(--metric-positive))", border: "hsl(var(--metric-positive) / 0.3)", icon: <Trophy size={12} />, label: "Winner Found" },
    loser: { bg: "hsl(var(--metric-negative) / 0.15)", color: "hsl(var(--metric-negative))", border: "hsl(var(--metric-negative) / 0.3)", icon: <Ban size={12} />, label: "Underperforming" },
    inconclusive: { bg: "hsl(var(--metric-warning) / 0.15)", color: "hsl(var(--metric-warning))", border: "hsl(var(--metric-warning) / 0.3)", icon: <AlertTriangle size={12} />, label: "Inconclusive" },
    collecting: { bg: "hsl(var(--muted) / 0.5)", color: "hsl(var(--muted-foreground))", border: "hsl(var(--border))", icon: <Clock size={12} />, label: "Collecting Data" },
  };
  const c = config[verdict];
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium" style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}` }}>
      {c.icon} {c.label} {confidence > 0 && `(${confidence}%)`}
    </span>
  );
}

function MetricCell({ value, isBest, isWorst, format }: { value: number; isBest: boolean; isWorst: boolean; format: "currency" | "percent" | "number" | "multiplier" }) {
  const fmt = () => {
    if (format === "currency") return formatINR(value);
    if (format === "percent") return `${value.toFixed(2)}%`;
    if (format === "multiplier") return `${value.toFixed(1)}x`;
    return value >= 1000 ? `${(value / 1000).toFixed(1)}K` : value.toFixed(0);
  };

  return (
    <td className="px-3 py-3 text-right">
      <span className="text-xs font-semibold inline-flex items-center gap-1" style={{
        color: isBest ? "hsl(var(--metric-positive))" : isWorst ? "hsl(var(--metric-negative))" : "hsl(var(--foreground))",
      }}>
        {isBest && <TrendingUp size={10} />}
        {isWorst && <TrendingDown size={10} />}
        {fmt()}
      </span>
    </td>
  );
}

export default function TestComparisonTable({ test }: TestComparisonTableProps) {
  const [expanded, setExpanded] = useState(false);
  const winner = test.winnerId ? test.variants.find((v) => v.id === test.winnerId) : null;

  const metrics: { key: keyof TestVariant; label: string; format: "currency" | "percent" | "number" | "multiplier"; higherIsBetter: boolean }[] = [
    { key: "spend", label: "Spend", format: "currency", higherIsBetter: false },
    { key: "impressions", label: "Impressions", format: "number", higherIsBetter: true },
    { key: "clicks", label: "Clicks", format: "number", higherIsBetter: true },
    { key: "ctr", label: "CTR", format: "percent", higherIsBetter: true },
    { key: "cpc", label: "CPC", format: "currency", higherIsBetter: false },
    { key: "cpm", label: "CPM", format: "currency", higherIsBetter: false },
    { key: "cpl", label: "CPL", format: "currency", higherIsBetter: false },
    { key: "conversionRate", label: "Conv Rate", format: "percent", higherIsBetter: true },
    { key: "costPerResult", label: "Cost/Result", format: "currency", higherIsBetter: false },
    { key: "roas", label: "ROAS", format: "multiplier", higherIsBetter: true },
  ];

  const visibleMetrics = expanded ? metrics : metrics.slice(0, 6);

  return (
    <div className="chart-card overflow-hidden">
      {/* Header */}
      <div className="p-4 pb-3 flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>{test.groupName}</h3>
          <p className="text-[11px] mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
            {test.variants.length} variants · {test.level === "campaign" ? "Strategy" : test.level === "adset" ? "Audience" : "Creative"} Test
            {test.objective && ` · ${test.objective}`}
          </p>
        </div>
        <VerdictBadge verdict={test.winnerVerdict} confidence={test.confidence} />
      </div>

      {/* Insufficient data message */}
      {!test.hasEnoughData && (
        <div className="mx-4 mb-3 px-3 py-2 rounded-lg flex items-center gap-2 text-[11px]" style={{
          background: "hsl(var(--metric-warning) / 0.08)",
          border: "1px solid hsl(var(--metric-warning) / 0.2)",
          color: "hsl(var(--metric-warning))",
        }}>
          <Clock size={13} />
          {test.dataMessage || "Collecting data — results not yet statistically reliable."}
        </div>
      )}

      {/* Winner banner */}
      {winner && test.winnerVerdict === "winner" && (
        <div className="mx-4 mb-3 px-3 py-2 rounded-lg flex items-center gap-2 text-[11px]" style={{
          background: "hsl(var(--metric-positive) / 0.08)",
          border: "1px solid hsl(var(--metric-positive) / 0.25)",
        }}>
          <Trophy size={13} style={{ color: "hsl(var(--metric-positive))" }} />
          <span style={{ color: "hsl(142 71% 65%)" }}>
            <strong>{winner.name}</strong> wins on {test.primaryMetric} with {test.confidence}% confidence
          </span>
        </div>
      )}

      {/* Comparison Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr style={{ borderBottom: "1px solid hsl(var(--border) / 0.5)" }}>
              <th className="px-4 py-2 text-left font-medium" style={{ color: "hsl(var(--muted-foreground))" }}>
                {test.level === "campaign" ? "Campaign" : test.level === "adset" ? "Audience" : "Creative"}
              </th>
              {visibleMetrics.map((m) => (
                <th key={m.key} className="px-3 py-2 text-right font-medium whitespace-nowrap" style={{ color: "hsl(var(--muted-foreground))" }}>
                  {m.label}
                </th>
              ))}
              <th className="px-3 py-2 text-center font-medium" style={{ color: "hsl(var(--muted-foreground))" }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {test.variants.map((v) => {
              const isWinner = v.id === test.winnerId;
              return (
                <tr key={v.id} className="transition-colors" style={{
                  borderBottom: "1px solid hsl(var(--border) / 0.3)",
                  background: isWinner ? "hsl(var(--metric-positive) / 0.04)" : "transparent",
                }}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5 min-w-[180px]">
                      {v.thumbnail && (
                        <img src={v.thumbnail} alt={v.name} className="w-10 h-7 rounded object-cover shrink-0" style={{ border: "1px solid hsl(var(--border))" }} />
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold truncate" style={{ color: "hsl(var(--foreground))" }}>{v.name}</span>
                          {isWinner && <Trophy size={11} style={{ color: "hsl(var(--metric-positive))" }} />}
                        </div>
                        {v.status && (
                          <span className="text-[10px]" style={{ color: v.status === "Active" ? "hsl(var(--metric-positive))" : "hsl(var(--muted-foreground))" }}>
                            {v.status}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  {visibleMetrics.map((m) => {
                    const val = v[m.key] as number;
                    const values = test.variants.map((x) => x[m.key] as number).filter((x) => x > 0);
                    const best = m.higherIsBetter ? Math.max(...values) : Math.min(...values);
                    const worst = m.higherIsBetter ? Math.min(...values) : Math.max(...values);
                    return (
                      <MetricCell
                        key={m.key}
                        value={val}
                        isBest={val > 0 && val === best && values.length > 1}
                        isWorst={val > 0 && val === worst && values.length > 1}
                        format={m.format}
                      />
                    );
                  })}
                  <td className="px-3 py-3 text-center">
                    {isWinner ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold" style={{
                        background: "hsl(var(--metric-positive) / 0.15)",
                        color: "hsl(var(--metric-positive))",
                      }}>
                        <Trophy size={9} /> Winner
                      </span>
                    ) : test.winnerVerdict === "winner" ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium" style={{
                        background: "hsl(var(--metric-negative) / 0.1)",
                        color: "hsl(var(--metric-negative))",
                      }}>
                        Pause Candidate
                      </span>
                    ) : (
                      <span className="text-[10px]" style={{ color: "hsl(var(--muted-foreground))" }}>Testing</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Expand/Collapse */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full py-2 flex items-center justify-center gap-1 text-[11px] font-medium transition-colors hover:bg-[hsl(var(--muted)/0.2)]"
        style={{ color: "hsl(var(--brand))", borderTop: "1px solid hsl(var(--border) / 0.3)" }}
      >
        {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        {expanded ? "Show Less" : "Show All Metrics"}
      </button>

      {/* Confidence bar */}
      {test.hasEnoughData && (
        <div className="px-4 pb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-medium" style={{ color: "hsl(var(--muted-foreground))" }}>Statistical Confidence</span>
            <span className="text-[11px] font-bold" style={{
              color: test.confidence >= 85 ? "hsl(var(--metric-positive))" : test.confidence >= 65 ? "hsl(var(--metric-warning))" : "hsl(var(--muted-foreground))",
            }}>
              {test.confidence}%
            </span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "hsl(var(--muted))" }}>
            <div className="h-full rounded-full transition-all duration-700" style={{
              width: `${test.confidence}%`,
              background: test.confidence >= 85 ? "hsl(var(--metric-positive))" : test.confidence >= 65 ? "hsl(var(--metric-warning))" : "hsl(var(--brand))",
            }} />
          </div>
        </div>
      )}
    </div>
  );
}
