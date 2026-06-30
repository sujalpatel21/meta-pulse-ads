import { useEffect, useMemo, useState } from "react";
import { useDashboard } from "@/components/layout/Layout";
import {
  Activity, Search, Download, Filter, ChevronDown, ChevronRight,
  PlusCircle, Edit3, DollarSign, AlertTriangle, PauseCircle, PlayCircle,
  Layers, MousePointer2, Clock, X, CalendarIcon, RefreshCw,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/currency";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { fetchActivities, getDateRangeFromPreset, MetaActivity } from "@/services/metaService";

// ============ Types ============
type UpdateCategory =
  | "campaign" | "adset" | "ad" | "budget"
  | "status" | "delivery" | "targeting" | "creative" | "other";

type UpdateSeverity = "green" | "blue" | "orange" | "red" | "gray" | "purple";

interface TimelineUpdate {
  id: string;
  category: UpdateCategory;
  severity: UpdateSeverity;
  icon: LucideIcon;
  title: string;
  objectType: string;
  objectName: string;
  oldValue?: string;
  newValue?: string;
  delta?: string;
  reason?: string;
  actor?: string;
  timestamp: Date;
  rawEventType: string;
}

// ============ Classify a Meta activity ============
function classify(a: MetaActivity, currency: string): TimelineUpdate {
  const et = (a.eventType || "").toLowerCase();
  const label = a.eventLabel || a.eventType || "Change";
  const objType = a.objectType || (et.includes("campaign") ? "Campaign" : et.includes("adset") ? "Ad Set" : et.includes("ad") ? "Ad" : "Object");

  let category: UpdateCategory = "other";
  let severity: UpdateSeverity = "blue";
  let icon: LucideIcon = Edit3;
  let title = label;

  // Helpers to detect currency-style budget fields (Meta sends minor units)
  const isBudgetField = et.includes("budget") || /budget/i.test(label);
  const formatVal = (v: string | null) => {
    if (v === null || v === undefined) return undefined;
    if (isBudgetField && /^-?\d+(\.\d+)?$/.test(v)) {
      // Meta returns budgets in minor units (cents/paise)
      return formatCurrency(parseFloat(v) / 100, currency);
    }
    return v;
  };

  if (et.includes("create") || et.includes("created")) {
    category = objType.toLowerCase().includes("campaign") ? "campaign"
      : objType.toLowerCase().includes("ad_set") || objType.toLowerCase().includes("adset") ? "adset"
      : "ad";
    severity = "green";
    icon = PlusCircle;
    title = `${objType} Created`;
  } else if (et.includes("delete") || et.includes("remove")) {
    category = "status";
    severity = "red";
    icon = X;
    title = `${objType} Deleted`;
  } else if (et.includes("pause")) {
    category = "status";
    severity = "gray";
    icon = PauseCircle;
    title = `${objType} Paused`;
  } else if (et.includes("unpause") || et.includes("resume") || et.includes("activate")) {
    category = "status";
    severity = "green";
    icon = PlayCircle;
    title = `${objType} Activated`;
  } else if (isBudgetField) {
    category = "budget";
    severity = "orange";
    icon = DollarSign;
    title = "Budget Updated";
  } else if (et.includes("bid")) {
    category = "budget";
    severity = "orange";
    icon = DollarSign;
    title = "Bid Updated";
  } else if (et.includes("targeting") || et.includes("audience")) {
    category = "targeting";
    severity = "blue";
    icon = Edit3;
    title = "Targeting Updated";
  } else if (et.includes("creative")) {
    category = "creative";
    severity = "purple";
    icon = MousePointer2;
    title = "Creative Updated";
  } else if (et.includes("status")) {
    category = "status";
    severity = "blue";
    icon = Edit3;
    title = "Status Changed";
  } else if (et.includes("schedule") || et.includes("delivery") || et.includes("placement")) {
    category = "delivery";
    severity = "blue";
    icon = Edit3;
    title = label;
  } else {
    // Default: keep Meta's translated label
    if (objType.toLowerCase().includes("campaign")) { category = "campaign"; icon = Layers; }
    else if (objType.toLowerCase().includes("set")) { category = "adset"; icon = Layers; }
    else if (objType.toLowerCase().includes("ad")) { category = "ad"; icon = MousePointer2; }
  }

  const oldFmt = formatVal(a.oldValue);
  const newFmt = formatVal(a.newValue);

  let delta: string | undefined;
  if (isBudgetField && a.oldValue && a.newValue && /^-?\d+(\.\d+)?$/.test(a.oldValue) && /^-?\d+(\.\d+)?$/.test(a.newValue)) {
    const o = parseFloat(a.oldValue);
    const n = parseFloat(a.newValue);
    if (o !== 0) {
      const pct = ((n - o) / Math.abs(o)) * 100;
      delta = `${pct >= 0 ? "+" : ""}${pct.toFixed(0)}%`;
      if (pct < 0) severity = "orange";
    }
  }

  return {
    id: a.id,
    category,
    severity,
    icon,
    title,
    objectType: objType,
    objectName: a.objectName || a.objectId || "—",
    oldValue: oldFmt,
    newValue: newFmt,
    delta,
    reason: label !== title ? label : undefined,
    actor: a.actorName,
    timestamp: a.eventTime ? new Date(a.eventTime) : new Date(),
    rawEventType: a.eventType,
  };
}

// ============ Helpers ============
const severityClasses: Record<UpdateSeverity, { dot: string; bg: string; text: string; border: string }> = {
  green: { dot: "bg-emerald-500", bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20" },
  blue: { dot: "bg-sky-500", bg: "bg-sky-500/10", text: "text-sky-400", border: "border-sky-500/20" },
  orange: { dot: "bg-amber-500", bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20" },
  red: { dot: "bg-rose-500", bg: "bg-rose-500/10", text: "text-rose-400", border: "border-rose-500/20" },
  gray: { dot: "bg-slate-500", bg: "bg-slate-500/10", text: "text-slate-400", border: "border-slate-500/20" },
  purple: { dot: "bg-violet-500", bg: "bg-violet-500/10", text: "text-violet-400", border: "border-violet-500/20" },
};

const categoryOptions: { value: UpdateCategory | "all"; label: string }[] = [
  { value: "all", label: "All Updates" },
  { value: "budget", label: "Budget" },
  { value: "campaign", label: "Campaign" },
  { value: "adset", label: "Ad Set" },
  { value: "ad", label: "Ads" },
  { value: "status", label: "Status" },
  { value: "targeting", label: "Targeting" },
  { value: "creative", label: "Creative" },
  { value: "delivery", label: "Delivery" },
  { value: "other", label: "Other" },
];

function groupByDay(items: TimelineUpdate[]): Record<string, TimelineUpdate[]> {
  const groups: Record<string, TimelineUpdate[]> = {};
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);

  items.forEach((u) => {
    const d = new Date(u.timestamp); d.setHours(0, 0, 0, 0);
    let label: string;
    if (d.getTime() === today.getTime()) label = "Today";
    else if (d.getTime() === yesterday.getTime()) label = "Yesterday";
    else label = d.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
    (groups[label] ||= []).push(u);
  });
  return groups;
}

function exportCSV(items: TimelineUpdate[]) {
  const rows = [
    ["Time", "Category", "Event", "Object Type", "Object", "Old", "New", "Delta", "Actor"],
    ...items.map((u) => [
      u.timestamp.toISOString(), u.category, u.title, u.objectType, u.objectName,
      u.oldValue ?? "", u.newValue ?? "", u.delta ?? "", u.actor ?? "",
    ]),
  ];
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `updates-${Date.now()}.csv`; a.click();
  URL.revokeObjectURL(url);
}

// ============ Page ============
export default function Updates() {
  const { selectedAccount, dateRange } = useDashboard();
  const currency = selectedAccount?.currency || "INR";

  const [activities, setActivities] = useState<MetaActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [activeFilter, setActiveFilter] = useState<UpdateCategory | "all">("all");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [pickedDate, setPickedDate] = useState<Date | undefined>(undefined);
  const [dateOpen, setDateOpen] = useState(false);

  const load = async () => {
    if (!selectedAccount) return;
    setLoading(true);
    setError(null);
    try {
      // When a specific date is picked, fetch just that day; otherwise use global range
      const range = pickedDate
        ? { from: format(pickedDate, "yyyy-MM-dd"), to: format(pickedDate, "yyyy-MM-dd") }
        : getDateRangeFromPreset(dateRange);
      const data = await fetchActivities(selectedAccount.accountId, range);
      setActivities(data);
    } catch (e: any) {
      setError(e?.message || "Failed to load activity log from Meta");
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [selectedAccount?.accountId, dateRange, pickedDate]);

  const allUpdates = useMemo(
    () => activities.map((a) => classify(a, currency)).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()),
    [activities, currency]
  );

  const filtered = useMemo(() => {
    let list = allUpdates;
    if (activeFilter !== "all") list = list.filter((u) => u.category === activeFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((u) =>
        u.objectName.toLowerCase().includes(q) ||
        u.title.toLowerCase().includes(q) ||
        u.rawEventType.toLowerCase().includes(q)
      );
    }
    return list;
  }, [allUpdates, activeFilter, search]);

  const grouped = useMemo(() => groupByDay(filtered), [filtered]);

  // Summary stats — based on the loaded window
  const summary = {
    total: allUpdates.length,
    budget: allUpdates.filter((u) => u.category === "budget").length,
    campaigns: allUpdates.filter((u) => u.category === "campaign").length,
    adsets: allUpdates.filter((u) => u.category === "adset").length,
    ads: allUpdates.filter((u) => u.category === "ad").length,
    status: allUpdates.filter((u) => u.category === "status").length,
    targeting: allUpdates.filter((u) => u.category === "targeting").length,
    creative: allUpdates.filter((u) => u.category === "creative").length,
  };

  const toggleExpand = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Activity size={20} className="text-[hsl(var(--brand))]" />
            Updates Center
          </h1>
          <p className="text-sm mt-0.5 text-muted-foreground">
            {selectedAccount?.accountName || "—"} · Live change log from Meta Activity API
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-colors hover:bg-muted disabled:opacity-50"
            style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }}
          >
            <RefreshCw size={14} className={cn(loading && "animate-spin")} /> Refresh
          </button>
          <button
            onClick={() => exportCSV(filtered)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-colors hover:bg-muted"
            style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }}
          >
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400">
          ⚠️ {error}
        </div>
      )}

      {/* Summary */}
      <div className="chart-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-1.5 h-4 rounded-full bg-[hsl(var(--chart-1))]" />
          <h3 className="text-sm font-semibold text-foreground">
            {pickedDate ? `Changes on ${format(pickedDate, "MMM d, yyyy")}` : "Changes in selected range"}
          </h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {[
            { label: "Total", value: summary.total, color: "text-foreground" },
            { label: "Budget", value: summary.budget, color: "text-amber-400" },
            { label: "Campaigns", value: summary.campaigns, color: "text-emerald-400" },
            { label: "Ad Sets", value: summary.adsets, color: "text-sky-400" },
            { label: "Ads", value: summary.ads, color: "text-sky-400" },
            { label: "Status", value: summary.status, color: "text-slate-400" },
            { label: "Targeting", value: summary.targeting, color: "text-sky-400" },
            { label: "Creative", value: summary.creative, color: "text-violet-400" },
          ].map((s) => (
            <div key={s.label} className="rounded-lg p-3 border" style={{
              background: "hsl(var(--background-card))",
              borderColor: "hsl(var(--border))",
            }}>
              <div className={cn("text-2xl font-bold", s.color)}>{s.value}</div>
              <div className="text-[11px] mt-1 text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Sticky filter bar */}
      <div className="sticky top-0 z-10 -mx-6 px-6 py-3 backdrop-blur-md border-b"
        style={{ background: "hsl(var(--background) / 0.85)", borderColor: "hsl(var(--border))" }}>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border flex-1 min-w-[220px] max-w-md"
            style={{ background: "hsl(var(--background-card))", borderColor: "hsl(var(--border))" }}>
            <Search size={14} className="text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search campaigns, ads, events..."
              className="bg-transparent border-none outline-none text-sm flex-1 text-foreground"
            />
            {search && (
              <button onClick={() => setSearch("")} className="text-muted-foreground hover:text-foreground">
                <X size={12} />
              </button>
            )}
          </div>
          <Popover open={dateOpen} onOpenChange={setDateOpen}>
            <PopoverTrigger asChild>
              <button
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors hover:bg-muted",
                  pickedDate && "border-[hsl(var(--brand))] text-[hsl(var(--brand))]"
                )}
                style={{
                  background: "hsl(var(--background-card))",
                  borderColor: pickedDate ? undefined : "hsl(var(--border))",
                  color: pickedDate ? undefined : "hsl(var(--foreground))",
                }}
              >
                <CalendarIcon size={13} />
                {pickedDate ? format(pickedDate, "MMM d, yyyy") : "Pick a date"}
                {pickedDate && (
                  <X
                    size={12}
                    className="ml-1 opacity-70 hover:opacity-100"
                    onClick={(e) => { e.stopPropagation(); setPickedDate(undefined); }}
                  />
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={pickedDate}
                onSelect={(d) => { setPickedDate(d); setDateOpen(false); }}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
          <div className="flex items-center gap-1.5 flex-wrap">
            <Filter size={12} className="text-muted-foreground mr-1" />
            {categoryOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setActiveFilter(opt.value)}
                className={cn(
                  "text-xs px-2.5 py-1 rounded-full border transition-all",
                  activeFilter === opt.value
                    ? "bg-[hsl(var(--brand))] text-[hsl(var(--primary-foreground))] border-transparent"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
                style={activeFilter !== opt.value ? { borderColor: "hsl(var(--border))" } : undefined}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Timeline */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="chart-card p-12 text-center">
          <Activity size={32} className="mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">
            No changes recorded by Meta for {pickedDate ? format(pickedDate, "MMM d, yyyy") : "the selected date range"}.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            This timeline shows only real edits captured in Meta's Activity Log — no inferred events.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([day, items]) => (
            <div key={day}>
              <div className="flex items-center gap-3 mb-4">
                <h3 className="text-sm font-semibold text-foreground">{day}</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                  {items.length} {items.length === 1 ? "update" : "updates"}
                </span>
                <div className="flex-1 h-px bg-border" />
              </div>

              <div className="relative pl-6">
                <div className="absolute left-2 top-1 bottom-1 w-px bg-border" />
                <div className="space-y-3">
                  {items.map((u) => {
                    const sev = severityClasses[u.severity];
                    const isOpen = expanded.has(u.id);
                    return (
                      <div key={u.id} className="relative">
                        <div className={cn("absolute -left-[18px] top-4 w-2.5 h-2.5 rounded-full ring-4 ring-[hsl(var(--background))]", sev.dot)} />
                        <button
                          onClick={() => toggleExpand(u.id)}
                          className={cn(
                            "w-full text-left rounded-xl border p-4 transition-all hover:shadow-md",
                            sev.border
                          )}
                          style={{ background: "hsl(var(--background-card))" }}
                        >
                          <div className="flex items-start gap-3">
                            <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", sev.bg, sev.text)}>
                              <u.icon size={16} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-sm font-semibold text-foreground">{u.title}</span>
                                    <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-medium uppercase tracking-wide", sev.bg, sev.text)}>
                                      {u.objectType}
                                    </span>
                                  </div>
                                  <div className="text-xs text-muted-foreground mt-1 truncate">{u.objectName}</div>

                                  {(u.oldValue || u.newValue) && (
                                    <div className="flex items-center gap-2 mt-2 text-xs flex-wrap">
                                      {u.oldValue && (
                                        <span className="px-2 py-0.5 rounded bg-muted text-muted-foreground line-through">
                                          {u.oldValue}
                                        </span>
                                      )}
                                      {u.newValue && (
                                        <>
                                          <ChevronRight size={12} className="text-muted-foreground" />
                                          <span className="px-2 py-0.5 rounded bg-foreground/5 text-foreground font-medium">
                                            {u.newValue}
                                          </span>
                                        </>
                                      )}
                                      {u.delta && (
                                        <span className={cn("text-xs font-semibold", sev.text)}>{u.delta}</span>
                                      )}
                                    </div>
                                  )}

                                  {u.reason && !isOpen && (
                                    <div className="text-xs text-muted-foreground mt-2 line-clamp-1">
                                      {u.reason}
                                    </div>
                                  )}
                                </div>

                                <div className="flex items-center gap-2 shrink-0 text-xs text-muted-foreground">
                                  <Clock size={11} />
                                  {u.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                  <ChevronDown size={14} className={cn("transition-transform", isOpen && "rotate-180")} />
                                </div>
                              </div>

                              {isOpen && (
                                <div className="mt-3 pt-3 border-t space-y-2 animate-fade-in" style={{ borderColor: "hsl(var(--border))" }}>
                                  {u.reason && (
                                    <div className="text-xs">
                                      <span className="text-muted-foreground">Event: </span>
                                      <span className="text-foreground">{u.reason}</span>
                                    </div>
                                  )}
                                  <div className="text-xs">
                                    <span className="text-muted-foreground">Event Type: </span>
                                    <span className="text-foreground font-mono">{u.rawEventType}</span>
                                  </div>
                                  {u.actor && (
                                    <div className="text-xs">
                                      <span className="text-muted-foreground">Changed by: </span>
                                      <span className="text-foreground">{u.actor}</span>
                                    </div>
                                  )}
                                  <div className="text-xs">
                                    <span className="text-muted-foreground">Timestamp: </span>
                                    <span className="text-foreground">{u.timestamp.toLocaleString()}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
