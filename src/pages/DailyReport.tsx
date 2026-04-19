import { useEffect, useState } from "react";
import { useDashboard } from "@/components/layout/Layout";
import { fetchDailyReport, DailyReportData } from "@/services/metaService";
import { formatCurrency, formatCurrencyFixed, getCurrencySymbol } from "@/lib/currency";
import { ArrowUp, ArrowDown, Minus, Wallet, TrendingUp, Rocket, Activity, Loader2, RefreshCw } from "lucide-react";

type Status = "over" | "under" | "ontrack" | "unknown";

function getSpendStatus(spend: number, budget: number): Status {
  if (!budget || budget <= 0) return "unknown";
  const ratio = spend / budget;
  if (ratio > 1.05) return "over";
  if (ratio < 0.85) return "under";
  return "ontrack";
}

const statusMeta: Record<Status, { label: string; cls: string; dot: string }> = {
  over: { label: "Over-spending", cls: "text-red-400 bg-red-500/10 border-red-500/30", dot: "bg-red-500" },
  under: { label: "Under-spending", cls: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30", dot: "bg-yellow-500" },
  ontrack: { label: "On-track", cls: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30", dot: "bg-emerald-500" },
  unknown: { label: "No budget set", cls: "text-muted-foreground bg-muted/30 border-border", dot: "bg-muted-foreground" },
};

function ChangeBadge({ current, previous, currency, isCurrency = false, isPercent = false, invertColor = false }: {
  current: number; previous: number; currency: string; isCurrency?: boolean; isPercent?: boolean; invertColor?: boolean;
}) {
  if (previous === 0 && current === 0) {
    return <span className="text-xs text-muted-foreground inline-flex items-center gap-1"><Minus size={12} /> No change</span>;
  }
  const diff = current - previous;
  const pct = previous !== 0 ? (diff / previous) * 100 : 0;
  const up = diff > 0;
  const down = diff < 0;
  const positiveIsGood = !invertColor;
  const goodDirection = positiveIsGood ? up : down;
  const color = goodDirection ? "text-emerald-400" : (up || down ? "text-red-400" : "text-muted-foreground");
  const Icon = up ? ArrowUp : down ? ArrowDown : Minus;
  const formatted = isCurrency
    ? `${diff >= 0 ? "+" : "-"}${formatCurrency(Math.abs(diff), currency)}`
    : isPercent
    ? `${diff >= 0 ? "+" : ""}${diff.toFixed(2)}%`
    : `${diff >= 0 ? "+" : ""}${diff.toLocaleString()}`;
  return (
    <span className={`text-xs inline-flex items-center gap-1 ${color}`}>
      <Icon size={12} /> {formatted} ({pct >= 0 ? "+" : ""}{pct.toFixed(1)}%)
    </span>
  );
}

function MetricRow({ label, current, previous, currency, isCurrency, isPercent, invertColor }: {
  label: string; current: number | null; previous: number | null; currency: string;
  isCurrency?: boolean; isPercent?: boolean; invertColor?: boolean;
}) {
  if (current === null || current === undefined) {
    return (
      <div className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="text-xs text-muted-foreground">Data not available</span>
      </div>
    );
  }
  const display = isCurrency
    ? formatCurrencyFixed(current, currency, 2)
    : isPercent
    ? `${current.toFixed(2)}%`
    : current.toLocaleString();
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex flex-col items-end gap-0.5">
        <span className="text-base font-mono font-semibold text-foreground">{display}</span>
        {previous !== null && previous !== undefined && (
          <ChangeBadge
            current={current}
            previous={previous}
            currency={currency}
            isCurrency={isCurrency}
            isPercent={isPercent}
            invertColor={invertColor}
          />
        )}
      </div>
    </div>
  );
}

function LaunchList({ items }: { items: { id: string; name: string }[] }) {
  if (items.length === 0) return <span className="text-xs text-muted-foreground">None</span>;
  return (
    <ul className="space-y-1 mt-1">
      {items.slice(0, 5).map((it) => (
        <li key={it.id} className="text-xs text-foreground truncate" title={it.name}>• {it.name}</li>
      ))}
      {items.length > 5 && <li className="text-xs text-muted-foreground">+ {items.length - 5} more</li>}
    </ul>
  );
}

export default function DailyReport() {
  const { selectedAccount } = useDashboard();
  const currency = selectedAccount?.currency || "USD";
  const [data, setData] = useState<DailyReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!selectedAccount) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchDailyReport(selectedAccount.accountId);
      setData(res);
    } catch (e: any) {
      console.error("Daily report error:", e);
      setError(e.message || "Failed to load report");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAccount?.accountId]);

  const y = data?.yesterday;
  const d = data?.dayBefore;
  const status: Status = y ? getSpendStatus(y.spend, data!.totalDailyBudget) : "unknown";
  const sm = statusMeta[status];

  const yDateLabel = y?.date ? new Date(y.date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }) : "Yesterday";
  const dDateLabel = d?.date ? new Date(d.date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }) : "Day before";

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">📅 Daily Report</h1>
          <p className="text-sm mt-0.5 text-muted-foreground">
            {selectedAccount?.accountName || "Loading..."} · {yDateLabel} vs {dDateLabel}
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border border-border bg-card text-foreground hover:bg-muted transition-colors disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="text-center space-y-3">
            <Loader2 size={24} className="animate-spin mx-auto text-primary" />
            <p className="text-sm text-muted-foreground">Loading yesterday's performance...</p>
          </div>
        </div>
      )}

      {!loading && error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {!loading && !error && data && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Budget vs Spend */}
          <div className="kpi-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet size={16} className="text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Budget vs Spend</h3>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-mono uppercase ${sm.cls}`}>
                {sm.label}
              </span>
            </div>
            <div className="space-y-1">
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-muted-foreground">Total Daily Budget</span>
                <span className="text-sm font-mono text-foreground">
                  {data.totalDailyBudget > 0 ? formatCurrency(data.totalDailyBudget, currency) : "Data not available"}
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-muted-foreground">Total Spend</span>
                <span className="text-xl font-mono font-bold text-foreground">
                  {y ? formatCurrency(y.spend, currency) : "Data not available"}
                </span>
              </div>
              {y && d && (
                <div className="pt-1">
                  <ChangeBadge current={y.spend} previous={d.spend} currency={currency} isCurrency />
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Performance Metrics (CPM, CTR, CPL) */}
          <div className="kpi-card p-5 space-y-2">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp size={16} className="text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Performance</h3>
            </div>
            <MetricRow
              label="CPM"
              current={y?.cpm ?? null}
              previous={d?.cpm ?? null}
              currency={currency}
              isCurrency
              invertColor
            />
            <MetricRow
              label="CTR"
              current={y?.ctr ?? null}
              previous={d?.ctr ?? null}
              currency={currency}
              isPercent
            />
            <MetricRow
              label="CPL"
              current={y && y.leads > 0 ? y.cpl : null}
              previous={d && d.leads > 0 ? d.cpl : null}
              currency={currency}
              isCurrency
              invertColor
            />
          </div>

          {/* Card 3: Results */}
          <div className="kpi-card p-5 space-y-2">
            <div className="flex items-center gap-2 mb-1">
              <Activity size={16} className="text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Results</h3>
            </div>
            <MetricRow
              label="Total Results"
              current={y?.results ?? null}
              previous={d?.results ?? null}
              currency={currency}
            />
            <MetricRow
              label="Cost / Result"
              current={y && y.results > 0 ? y.cpr : null}
              previous={d && d.results > 0 ? d.cpr : null}
              currency={currency}
              isCurrency
              invertColor
            />
            <MetricRow
              label="Clicks"
              current={y?.clicks ?? null}
              previous={d?.clicks ?? null}
              currency={currency}
            />
          </div>

          {/* Card 4: New Launches */}
          <div className="kpi-card p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Rocket size={16} className="text-primary" />
              <h3 className="text-sm font-semibold text-foreground">New Launches</h3>
            </div>
            {data.newLaunches.campaigns.length === 0 &&
            data.newLaunches.adSets.length === 0 &&
            data.newLaunches.ads.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No new campaigns, ad sets, or ads were launched yesterday.
              </p>
            ) : (
              <div className="space-y-3">
                <div>
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Campaigns ({data.newLaunches.campaigns.length})
                  </span>
                  <LaunchList items={data.newLaunches.campaigns} />
                </div>
                <div>
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Ad Sets ({data.newLaunches.adSets.length})
                  </span>
                  <LaunchList items={data.newLaunches.adSets} />
                </div>
                <div>
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Ads ({data.newLaunches.ads.length})
                  </span>
                  <LaunchList items={data.newLaunches.ads} />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
