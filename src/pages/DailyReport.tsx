import { useEffect, useState } from "react";
import { useDashboard } from "@/components/layout/Layout";
import { fetchDailyReport, DailyReportData } from "@/services/metaService";
import { formatCurrency, formatCurrencyFixed } from "@/lib/currency";
import {
  Wallet, TrendingUp, Rocket, Activity, Loader2, RefreshCw,
  Eye, MousePointerClick, Target, ShoppingCart, Layers, MousePointer2, Megaphone,
  CheckCircle2, AlertTriangle, AlertCircle, ArrowUp, ArrowDown, SlidersHorizontal,
} from "lucide-react";

type Status = "over" | "under" | "ontrack" | "unknown";

function getSpendStatus(spend: number, budget: number): Status {
  if (!budget || budget <= 0) return "unknown";
  const ratio = spend / budget;
  if (ratio > 1.05) return "over";
  if (ratio < 0.85) return "under";
  return "ontrack";
}

const statusMeta: Record<Status, { label: string; cls: string; ring: string; Icon: any; tone: string }> = {
  over: {
    label: "Over-spending",
    cls: "text-red-300 bg-red-500/15 border-red-500/40",
    ring: "ring-red-500/30",
    Icon: AlertCircle,
    tone: "from-red-500/20 to-red-500/0",
  },
  under: {
    label: "Under-spending",
    cls: "text-yellow-300 bg-yellow-500/15 border-yellow-500/40",
    ring: "ring-yellow-500/30",
    Icon: AlertTriangle,
    tone: "from-yellow-500/20 to-yellow-500/0",
  },
  ontrack: {
    label: "On-track",
    cls: "text-emerald-300 bg-emerald-500/15 border-emerald-500/40",
    ring: "ring-emerald-500/30",
    Icon: CheckCircle2,
    tone: "from-emerald-500/20 to-emerald-500/0",
  },
  unknown: {
    label: "No daily budget",
    cls: "text-muted-foreground bg-muted/40 border-border",
    ring: "ring-border",
    Icon: AlertCircle,
    tone: "from-muted/20 to-muted/0",
  },
};

function MetricTile({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: any;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-background/40 p-3 hover:border-border transition-colors">
      <div className="flex items-center gap-1.5 mb-2">
        <Icon size={12} className="text-muted-foreground" />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
      </div>
      <div className="text-lg font-mono font-bold text-foreground leading-tight">{value}</div>
      {sub && <div className="text-[10px] text-muted-foreground mt-1">{sub}</div>}
    </div>
  );
}

function LaunchSection({
  icon: Icon,
  label,
  items,
}: {
  icon: any;
  label: string;
  items: { id: string; name: string }[];
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Icon size={12} className="text-muted-foreground" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {label}
          </span>
        </div>
        <span
          className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
            items.length > 0
              ? "bg-primary/15 text-primary"
              : "bg-muted/40 text-muted-foreground"
          }`}
        >
          {items.length}
        </span>
      </div>
      {items.length === 0 ? (
        <p className="text-[11px] text-muted-foreground italic">None</p>
      ) : (
        <ul className="space-y-1">
          {items.slice(0, 4).map((it) => (
            <li
              key={it.id}
              className="text-xs text-foreground truncate flex items-center gap-1.5"
              title={it.name}
            >
              <span className="w-1 h-1 rounded-full bg-primary shrink-0" />
              {it.name}
            </li>
          ))}
          {items.length > 4 && (
            <li className="text-[11px] text-muted-foreground pl-2.5">
              + {items.length - 4} more
            </li>
          )}
        </ul>
      )}
    </div>
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
  const status: Status = y ? getSpendStatus(y.spend, data!.totalDailyBudget) : "unknown";
  const sm = statusMeta[status];
  const StatusIcon = sm.Icon;

  const yDateLabel = y?.date
    ? new Date(y.date).toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "Yesterday";

  // Budget delta
  const spendDiff = y && data ? y.spend - data.totalDailyBudget : 0;
  const spendPct =
    y && data && data.totalDailyBudget > 0
      ? (spendDiff / data.totalDailyBudget) * 100
      : 0;

  const newLaunchTotal =
    (data?.newLaunches.campaigns.length || 0) +
    (data?.newLaunches.adSets.length || 0) +
    (data?.newLaunches.ads.length || 0);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-bold text-foreground">Daily Report</h1>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/15 text-primary font-mono uppercase tracking-wider">
              Yesterday
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {selectedAccount?.accountName || "Loading..."} · {yDateLabel}
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
        <div className="flex items-center justify-center py-24">
          <div className="text-center space-y-3">
            <Loader2 size={28} className="animate-spin mx-auto text-primary" />
            <p className="text-sm text-muted-foreground">Loading yesterday's performance...</p>
          </div>
        </div>
      )}

      {!loading && error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {!loading && !error && data && !y && (
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <AlertCircle size={32} className="mx-auto text-muted-foreground mb-3" />
          <p className="text-sm font-semibold text-foreground">Data not available</p>
          <p className="text-xs text-muted-foreground mt-1">
            No insights returned for yesterday from Meta.
          </p>
        </div>
      )}

      {!loading && !error && data && y && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* === Card 1: Budget vs Spend (Hero) === */}
          <div
            className={`relative overflow-hidden rounded-xl border bg-card p-5 lg:col-span-1 ring-1 ${sm.ring}`}
          >
            <div
              className={`absolute inset-0 bg-gradient-to-br ${sm.tone} opacity-50 pointer-events-none`}
            />
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Wallet size={16} className="text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">Budget vs Spend</h3>
                </div>
                <span
                  className={`inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full border font-mono uppercase tracking-wider ${sm.cls}`}
                >
                  <StatusIcon size={10} /> {sm.label}
                </span>
              </div>

              <div className="mb-4">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Total Spend
                </div>
                <div className="text-3xl font-mono font-bold text-foreground">
                  {formatCurrency(y.spend, currency)}
                </div>
                {data.totalDailyBudget > 0 && (
                  <div className="text-xs text-muted-foreground mt-1">
                    of {formatCurrency(data.totalDailyBudget, currency)} budget
                  </div>
                )}
              </div>

              {/* Progress bar */}
              {data.totalDailyBudget > 0 && (
                <>
                  <div className="h-2 rounded-full bg-muted/50 overflow-hidden mb-3">
                    <div
                      className={`h-full transition-all ${
                        status === "over"
                          ? "bg-red-500"
                          : status === "under"
                          ? "bg-yellow-500"
                          : "bg-emerald-500"
                      }`}
                      style={{
                        width: `${Math.min(
                          100,
                          (y.spend / data.totalDailyBudget) * 100
                        )}%`,
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Variance</span>
                    <span
                      className={`font-mono font-semibold ${
                        spendDiff > 0
                          ? "text-red-400"
                          : spendDiff < 0
                          ? "text-yellow-400"
                          : "text-emerald-400"
                      }`}
                    >
                      {spendDiff >= 0 ? "+" : "-"}
                      {formatCurrency(Math.abs(spendDiff), currency)}
                      {" "}({spendPct >= 0 ? "+" : ""}
                      {spendPct.toFixed(1)}%)
                    </span>
                  </div>
                </>
              )}

              {data.totalDailyBudget <= 0 && (
                <div className="text-xs text-muted-foreground italic mt-2">
                  No daily budget configured for active campaigns.
                </div>
              )}
            </div>
          </div>

          {/* === Card 2: Performance Metrics === */}
          <div className="rounded-xl border border-border bg-card p-5 lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={16} className="text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Performance Metrics</h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <MetricTile
                icon={Eye}
                label="CPM"
                value={y.cpm > 0 ? formatCurrencyFixed(y.cpm, currency, 2) : "—"}
                sub="Cost per 1k impr."
              />
              <MetricTile
                icon={MousePointerClick}
                label="CTR"
                value={y.ctr > 0 ? `${y.ctr.toFixed(2)}%` : "—"}
                sub="Click-through rate"
              />
              <MetricTile
                icon={Target}
                label="CPL"
                value={
                  y.leads > 0 ? formatCurrencyFixed(y.cpl, currency, 2) : "—"
                }
                sub={`${y.leads.toLocaleString()} leads`}
              />
              <MetricTile
                icon={ShoppingCart}
                label="Cost / Result"
                value={
                  y.results > 0 ? formatCurrencyFixed(y.cpr, currency, 2) : "—"
                }
                sub={`${y.results.toLocaleString()} results`}
              />
            </div>

            {/* Volume bar */}
            <div className="mt-4 pt-4 border-t border-border/60 grid grid-cols-2 gap-3">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Impressions
                </div>
                <div className="text-base font-mono font-semibold text-foreground">
                  {y.impressions.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Clicks
                </div>
                <div className="text-base font-mono font-semibold text-foreground">
                  {y.clicks.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* === Card 3: New Launches === */}
          <div className="rounded-xl border border-border bg-card p-5 lg:col-span-1">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Rocket size={16} className="text-primary" />
                <h3 className="text-sm font-semibold text-foreground">New Launches</h3>
              </div>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                  newLaunchTotal > 0
                    ? "bg-primary/15 text-primary"
                    : "bg-muted/40 text-muted-foreground"
                }`}
              >
                {newLaunchTotal} total
              </span>
            </div>

            {newLaunchTotal === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-12 h-12 rounded-full bg-muted/40 flex items-center justify-center mb-3">
                  <Rocket size={20} className="text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground max-w-[200px]">
                  No new campaigns, ad sets, or ads were launched yesterday.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <LaunchSection
                  icon={Megaphone}
                  label="Campaigns"
                  items={data.newLaunches.campaigns}
                />
                <LaunchSection
                  icon={Layers}
                  label="Ad Sets"
                  items={data.newLaunches.adSets}
                />
                <LaunchSection
                  icon={MousePointer2}
                  label="Ads"
                  items={data.newLaunches.ads}
                />
              </div>
            )}
          </div>

          {/* === Card 4: At-a-glance summary (full width) === */}
          <div className="lg:col-span-3 rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Activity size={16} className="text-primary" />
              <h3 className="text-sm font-semibold text-foreground">At a Glance</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              <MetricTile
                icon={Wallet}
                label="Spend"
                value={formatCurrency(y.spend, currency)}
              />
              <MetricTile
                icon={Eye}
                label="Impressions"
                value={y.impressions.toLocaleString()}
              />
              <MetricTile
                icon={MousePointerClick}
                label="Clicks"
                value={y.clicks.toLocaleString()}
              />
              <MetricTile
                icon={Target}
                label="Leads"
                value={y.leads.toLocaleString()}
              />
              <MetricTile
                icon={ShoppingCart}
                label="Purchases"
                value={y.purchases.toLocaleString()}
              />
              <MetricTile
                icon={Activity}
                label="Total Results"
                value={y.results.toLocaleString()}
              />
            </div>
          </div>

          {/* === Card 5: Budget Changes (full width) === */}
          <div className="lg:col-span-3 rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <SlidersHorizontal size={16} className="text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Budget Changes</h3>
              </div>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                  data.budgetChanges.length > 0
                    ? "bg-primary/15 text-primary"
                    : "bg-muted/40 text-muted-foreground"
                }`}
              >
                {data.budgetChanges.length} {data.budgetChanges.length === 1 ? "change" : "changes"}
              </span>
            </div>

            {data.budgetChanges.length === 0 ? (
              <div className="flex items-center gap-3 py-4 px-4 rounded-lg bg-muted/20 border border-border/50">
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                <p className="text-xs text-muted-foreground">
                  No budget changes were made yesterday.
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-lg border border-border/60">
                <table className="w-full text-xs">
                  <thead className="bg-muted/30">
                    <tr className="text-left">
                      <th className="px-3 py-2 font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">Object</th>
                      <th className="px-3 py-2 font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">Change</th>
                      <th className="px-3 py-2 font-semibold text-[10px] uppercase tracking-wider text-muted-foreground text-right">Old</th>
                      <th className="px-3 py-2 font-semibold text-[10px] uppercase tracking-wider text-muted-foreground text-right">New</th>
                      <th className="px-3 py-2 font-semibold text-[10px] uppercase tracking-wider text-muted-foreground text-right">Delta</th>
                      <th className="px-3 py-2 font-semibold text-[10px] uppercase tracking-wider text-muted-foreground text-right">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.budgetChanges.map((bc) => {
                      const up = bc.delta > 0;
                      const down = bc.delta < 0;
                      const pct =
                        bc.oldValue && bc.oldValue > 0
                          ? (bc.delta / bc.oldValue) * 100
                          : null;
                      const time = new Date(bc.eventTime).toLocaleTimeString(undefined, {
                        hour: "2-digit",
                        minute: "2-digit",
                      });
                      return (
                        <tr
                          key={bc.id}
                          className="border-t border-border/40 hover:bg-muted/20 transition-colors"
                        >
                          <td className="px-3 py-2.5 text-foreground font-medium truncate max-w-[200px]" title={bc.objectName}>
                            {bc.objectName}
                          </td>
                          <td className="px-3 py-2.5 text-muted-foreground capitalize">
                            {bc.eventType?.replace(/_/g, " ").toLowerCase()}
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono text-muted-foreground">
                            {bc.oldValue !== null ? formatCurrency(bc.oldValue, currency) : "—"}
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono text-foreground">
                            {bc.newValue !== null ? formatCurrency(bc.newValue, currency) : "—"}
                          </td>
                          <td className="px-3 py-2.5 text-right">
                            <span
                              className={`inline-flex items-center gap-1 font-mono font-semibold ${
                                up ? "text-emerald-400" : down ? "text-red-400" : "text-muted-foreground"
                              }`}
                            >
                              {up ? <ArrowUp size={11} /> : down ? <ArrowDown size={11} /> : null}
                              {bc.delta >= 0 ? "+" : "-"}
                              {formatCurrency(Math.abs(bc.delta), currency)}
                              {pct !== null && (
                                <span className="text-[10px] opacity-70">
                                  ({pct >= 0 ? "+" : ""}{pct.toFixed(1)}%)
                                </span>
                              )}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono text-muted-foreground">
                            {time}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
