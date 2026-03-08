import { ABTest, ABTestVariant } from "@/data/mockData";
import { formatINR } from "@/services/metaService";
import { Trophy, TrendingUp, Sparkles } from "lucide-react";

interface WinnerCreativesProps {
  tests: ABTest[];
  loading: boolean;
}

function pctDiff(winnerVal: number, loserVal: number): string {
  if (loserVal === 0) return "—";
  const diff = ((winnerVal - loserVal) / loserVal) * 100;
  return `${diff > 0 ? "+" : ""}${diff.toFixed(0)}%`;
}

export default function WinnerCreatives({ tests, loading }: WinnerCreativesProps) {
  const winners = tests
    .filter((t) => t.status === "Completed" && t.winnerId)
    .map((t) => {
      const winner = t.variants.find((v) => v.variantId === t.winnerId)!;
      const losers = t.variants.filter((v) => v.variantId !== t.winnerId);
      const bestLoser = losers[0];
      return { test: t, winner, bestLoser };
    })
    .filter((w) => w.winner);

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-5 w-40 rounded bg-muted/30 animate-pulse" />
        <div className="flex gap-4 overflow-hidden">
          {[1, 2].map((i) => (
            <div key={i} className="chart-card h-[200px] w-[340px] shrink-0 animate-pulse bg-muted/20" />
          ))}
        </div>
      </div>
    );
  }

  if (winners.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Trophy size={16} className="text-[hsl(var(--metric-positive))]" />
        <h2 className="text-sm font-semibold text-foreground">Winner Creatives</h2>
        <span className="text-[10px] text-muted-foreground">({winners.length} winning ads)</span>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin">
        {winners.map(({ test, winner, bestLoser }) => (
          <WinnerCard key={test.testId} test={test} winner={winner} loser={bestLoser} />
        ))}
      </div>
    </div>
  );
}

function WinnerCard({
  test,
  winner,
  loser,
}: {
  test: ABTest;
  winner: ABTestVariant;
  loser?: ABTestVariant;
}) {
  return (
    <div
      className="chart-card shrink-0 w-[340px] p-4 space-y-3 relative overflow-hidden"
      style={{ borderColor: "hsl(var(--metric-positive) / 0.3)" }}
    >
      {/* Gold glow accent */}
      <div
        className="absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl opacity-20 pointer-events-none"
        style={{ background: "hsl(45 93% 50%)" }}
      />

      {/* Header */}
      <div className="flex items-start gap-3">
        {winner.thumbnail ? (
          <img
            src={winner.thumbnail}
            alt={winner.adName}
            className="w-12 h-12 rounded-lg object-cover border border-border/50"
          />
        ) : (
          <div className="w-12 h-12 rounded-lg bg-muted/30 flex items-center justify-center">
            <Sparkles size={16} className="text-muted-foreground" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <Trophy size={12} style={{ color: "hsl(45 93% 58%)" }} />
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "hsl(45 93% 58%)" }}>
              Winner — Variant {winner.variantLabel}
            </span>
          </div>
          <p className="text-xs font-medium text-foreground truncate mt-0.5">{winner.adName}</p>
          <p className="text-[10px] text-muted-foreground truncate">{test.campaignName}</p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-4 gap-2">
        <MetricCell label="CTR" value={`${winner.ctr.toFixed(2)}%`} diff={loser ? pctDiff(winner.ctr, loser.ctr) : undefined} />
        <MetricCell label="CPC" value={formatINR(winner.cpc)} diff={loser ? pctDiff(loser.cpc, winner.cpc) : undefined} invert />
        <MetricCell label="ROAS" value={`${winner.roas.toFixed(1)}x`} diff={loser ? pctDiff(winner.roas, loser.roas) : undefined} />
        <MetricCell label="Conf." value={`${test.confidence}%`} highlight={test.confidence >= 90} />
      </div>

      {/* Won on metric */}
      <div className="flex items-center gap-1.5 pt-1 border-t border-border/30">
        <TrendingUp size={12} className="text-[hsl(var(--metric-positive))]" />
        <span className="text-[10px] text-muted-foreground">
          Won on <span className="font-semibold text-foreground">{test.metric}</span>
          {loser && (
            <span className="ml-1 text-[hsl(var(--metric-positive))]">
              ({pctDiff(
                winner[test.metric.toLowerCase() as keyof ABTestVariant] as number || 0,
                loser[test.metric.toLowerCase() as keyof ABTestVariant] as number || 0
              )} vs runner-up)
            </span>
          )}
        </span>
      </div>
    </div>
  );
}

function MetricCell({
  label,
  value,
  diff,
  invert,
  highlight,
}: {
  label: string;
  value: string;
  diff?: string;
  invert?: boolean;
  highlight?: boolean;
}) {
  const isPositive = diff && diff.startsWith("+");

  return (
    <div className="text-center">
      <p className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`text-xs font-bold ${highlight ? "text-[hsl(var(--metric-positive))]" : "text-foreground"}`}>
        {value}
      </p>
      {diff && (
        <p className={`text-[9px] font-medium ${isPositive ? "text-[hsl(var(--metric-positive))]" : "text-[hsl(var(--metric-negative))]"}`}>
          {diff}
        </p>
      )}
    </div>
  );
}
