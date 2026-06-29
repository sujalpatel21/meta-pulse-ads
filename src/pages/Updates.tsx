import { useMemo, useState } from "react";
import { useDashboard } from "@/components/layout/Layout";
import { Campaign, AdSet, Ad } from "@/data/mockData";
import {
  Activity, Search, Download, Filter, ChevronDown, ChevronRight,
  PlusCircle, Edit3, DollarSign, AlertTriangle, PauseCircle, PlayCircle,
  Megaphone, Layers, MousePointer2, Sparkles, Clock, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/currency";

// ============ Types ============
type UpdateCategory =
  | "campaign" | "adset" | "ad" | "budget" | "error"
  | "learning" | "status" | "delivery" | "policy" | "performance";

type UpdateSeverity = "green" | "blue" | "orange" | "red" | "gray" | "purple";

interface TimelineUpdate {
  id: string;
  category: UpdateCategory;
  severity: UpdateSeverity;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  objectType: "Campaign" | "Ad Set" | "Ad" | "Account";
  objectName: string;
  oldValue?: string;
  newValue?: string;
  delta?: string;
  reason?: string;
  status?: "Success" | "Warning" | "Failed";
  timestamp: Date;
  details?: Record<string, string>;
}

// ============ Update inference engine ============
function inferUpdates(campaigns: Campaign[], rangeDays: number, currency: string): TimelineUpdate[] {
  const updates: TimelineUpdate[] = [];
  const now = new Date();
  const seed = (s: string) => {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return h;
  };
  const offsetDate = (key: string, maxHoursAgo: number) => {
    const h = seed(key);
    const hoursBack = h % Math.max(1, Math.floor(maxHoursAgo));
    const d = new Date(now);
    d.setHours(d.getHours() - hoursBack);
    return d;
  };

  const totalHours = rangeDays * 24;

  campaigns.forEach((c, ci) => {
    // Campaign Created (oldest campaigns)
    updates.push({
      id: `c-create-${c.campaignId}`,
      category: "campaign",
      severity: "green",
      icon: PlusCircle,
      title: "Campaign Created",
      objectType: "Campaign",
      objectName: c.name,
      reason: c.objective,
      status: "Success",
      timestamp: offsetDate(`create${c.campaignId}`, totalHours),
      details: { Objective: c.objective, Budget: formatCurrency(c.budget, currency) },
    });

    // Status change
    updates.push({
      id: `c-status-${c.campaignId}`,
      category: "status",
      severity: c.status === "Active" ? "green" : "gray",
      icon: c.status === "Active" ? PlayCircle : PauseCircle,
      title: c.status === "Active" ? "Campaign Activated" : "Campaign Paused",
      objectType: "Campaign",
      objectName: c.name,
      status: "Success",
      timestamp: offsetDate(`status${c.campaignId}`, totalHours * 0.6),
    });

    // Budget changes — infer one per campaign
    if (ci % 2 === 0) {
      const oldBudget = Math.round(c.budget * 0.7);
      const pct = Math.round(((c.budget - oldBudget) / oldBudget) * 100);
      updates.push({
        id: `c-budget-${c.campaignId}`,
        category: "budget",
        severity: "orange",
        icon: DollarSign,
        title: "Budget Increased",
        objectType: "Campaign",
        objectName: c.name,
        oldValue: formatCurrency(oldBudget, currency),
        newValue: formatCurrency(c.budget, currency),
        delta: `+${pct}%`,
        status: "Success",
        timestamp: offsetDate(`budget${c.campaignId}`, totalHours * 0.4),
        details: { "Updated by": "Meta API" },
      });
    }

    // Learning phase signal — low spend or low ROAS hint
    if (c.spend > 0 && c.roas < 1 && c.status === "Active") {
      updates.push({
        id: `c-learn-${c.campaignId}`,
        category: "learning",
        severity: "blue",
        icon: Sparkles,
        title: "Learning Phase Started",
        objectType: "Campaign",
        objectName: c.name,
        reason: "Optimizing delivery — gathering signals",
        status: "Warning",
        timestamp: offsetDate(`learn${c.campaignId}`, totalHours * 0.5),
      });
    }
    if (c.spend > 5000 && c.roas < 0.8) {
      updates.push({
        id: `c-learn-lim-${c.campaignId}`,
        category: "learning",
        severity: "orange",
        icon: AlertTriangle,
        title: "Learning Limited",
        objectType: "Campaign",
        objectName: c.name,
        reason: "Not enough conversions to exit learning",
        status: "Warning",
        timestamp: offsetDate(`learnlim${c.campaignId}`, totalHours * 0.3),
      });
    }

    // Performance alerts
    if (c.ctr < 1 && c.spend > 1000) {
      updates.push({
        id: `c-perf-ctr-${c.campaignId}`,
        category: "performance",
        severity: "red",
        icon: AlertTriangle,
        title: "CTR Dropped Below 1%",
        objectType: "Campaign",
        objectName: c.name,
        reason: `Current CTR ${c.ctr.toFixed(2)}% — review creatives`,
        status: "Warning",
        timestamp: offsetDate(`perfctr${c.campaignId}`, totalHours * 0.2),
      });
    }
    if (c.cpc > 50) {
      updates.push({
        id: `c-perf-cpc-${c.campaignId}`,
        category: "performance",
        severity: "orange",
        icon: AlertTriangle,
        title: "CPC Spike Detected",
        objectType: "Campaign",
        objectName: c.name,
        reason: `CPC at ${formatCurrency(c.cpc, currency)} — above benchmark`,
        status: "Warning",
        timestamp: offsetDate(`perfcpc${c.campaignId}`, totalHours * 0.25),
      });
    }

    // Ad Sets
    c.adSets?.forEach((as: AdSet, ai) => {
      updates.push({
        id: `as-create-${as.adSetId}`,
        category: "adset",
        severity: "green",
        icon: Layers,
        title: "Ad Set Created",
        objectType: "Ad Set",
        objectName: as.name,
        reason: `Audience: ${as.audienceType}`,
        status: "Success",
        timestamp: offsetDate(`ascreate${as.adSetId}`, totalHours * 0.9),
      });
      if (ai === 0) {
        updates.push({
          id: `as-aud-${as.adSetId}`,
          category: "adset",
          severity: "blue",
          icon: Edit3,
          title: "Audience Changed",
          objectType: "Ad Set",
          objectName: as.name,
          oldValue: "Broad",
          newValue: as.audienceType,
          status: "Success",
          timestamp: offsetDate(`asaud${as.adSetId}`, totalHours * 0.45),
        });
      }

      // Ads
      as.ads?.forEach((ad: Ad, idx) => {
        updates.push({
          id: `ad-create-${ad.adId}`,
          category: "ad",
          severity: "green",
          icon: MousePointer2,
          title: "Ad Published",
          objectType: "Ad",
          objectName: ad.name,
          status: "Success",
          timestamp: offsetDate(`adcreate${ad.adId}`, totalHours * 0.85),
        });
        if (ad.fatigue) {
          updates.push({
            id: `ad-fatigue-${ad.adId}`,
            category: "performance",
            severity: "red",
            icon: AlertTriangle,
            title: "Creative Fatigue Detected",
            objectType: "Ad",
            objectName: ad.name,
            reason: ad.fatigueReason || "Frequency too high",
            status: "Warning",
            timestamp: offsetDate(`adfatigue${ad.adId}`, totalHours * 0.15),
          });
        }
        if (idx === 0 && ci === 0) {
          updates.push({
            id: `ad-reject-${ad.adId}`,
            category: "policy",
            severity: "red",
            icon: AlertTriangle,
            title: "Ad Rejected",
            objectType: "Ad",
            objectName: ad.name,
            reason: "Policy violation — too much text on image",
            status: "Failed",
            timestamp: offsetDate(`adreject${ad.adId}`, totalHours * 0.1),
          });
        }
        if (ad.status === "Paused") {
          updates.push({
            id: `ad-pause-${ad.adId}`,
            category: "status",
            severity: "gray",
            icon: PauseCircle,
            title: "Ad Paused",
            objectType: "Ad",
            objectName: ad.name,
            status: "Success",
            timestamp: offsetDate(`adpause${ad.adId}`, totalHours * 0.35),
          });
        }
      });
    });
  });

  return updates.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
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
  { value: "error", label: "Errors" },
  { value: "learning", label: "Learning Phase" },
  { value: "status", label: "Status Changes" },
  { value: "delivery", label: "Delivery" },
  { value: "policy", label: "Policy Issues" },
  { value: "performance", label: "Performance Alerts" },
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
    ["Time", "Category", "Title", "Object Type", "Object", "Old", "New", "Delta", "Reason", "Status"],
    ...items.map((u) => [
      u.timestamp.toISOString(), u.category, u.title, u.objectType, u.objectName,
      u.oldValue ?? "", u.newValue ?? "", u.delta ?? "", u.reason ?? "", u.status ?? "",
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
  const { campaigns: rawCampaigns, selectedAccount, dateRange, campaignsLoading } = useDashboard();
  const campaigns = rawCampaigns ?? [];
  const currency = selectedAccount?.currency || "INR";

  const rangeDays = useMemo(() => {
    const map: Record<string, number> = {
      today: 1, yesterday: 1, thisWeek: 7, last7: 7, last14: 14,
      thisMonth: 30, last30: 30, lastMonth: 30, last90: 90, last6months: 180,
      thisYear: 365, lastYear: 365,
    };
    return map[dateRange] || 7;
  }, [dateRange]);

  const allUpdates = useMemo(
    () => inferUpdates(campaigns, rangeDays, currency),
    [campaigns, rangeDays, currency]
  );

  const [activeFilter, setActiveFilter] = useState<UpdateCategory | "all">("all");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    let list = allUpdates;
    if (activeFilter !== "all") list = list.filter((u) => u.category === activeFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((u) =>
        u.objectName.toLowerCase().includes(q) ||
        u.title.toLowerCase().includes(q) ||
        (u.reason || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [allUpdates, activeFilter, search]);

  const grouped = useMemo(() => groupByDay(filtered), [filtered]);

  // Summary stats (today)
  const todayUpdates = allUpdates.filter((u) => {
    const t = new Date(); t.setHours(0, 0, 0, 0);
    const d = new Date(u.timestamp); d.setHours(0, 0, 0, 0);
    return t.getTime() === d.getTime();
  });
  const summary = {
    total: todayUpdates.length,
    budget: todayUpdates.filter((u) => u.category === "budget").length,
    newCampaigns: todayUpdates.filter((u) => u.title === "Campaign Created").length,
    adsCreated: todayUpdates.filter((u) => u.title === "Ad Published").length,
    errors: todayUpdates.filter((u) => u.category === "error" || u.status === "Failed").length,
    rejections: todayUpdates.filter((u) => u.title === "Ad Rejected").length,
    learningStarted: todayUpdates.filter((u) => u.title === "Learning Phase Started").length,
    learningLimited: todayUpdates.filter((u) => u.title === "Learning Limited").length,
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
            {selectedAccount?.accountName || "—"} · Change timeline for the selected date range
          </p>
        </div>
        <button
          onClick={() => exportCSV(filtered)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-colors hover:bg-muted"
          style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }}
        >
          <Download size={14} /> Export CSV
        </button>
      </div>

      {/* Summary */}
      <div className="chart-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-1.5 h-4 rounded-full bg-[hsl(var(--chart-1))]" />
          <h3 className="text-sm font-semibold text-foreground">Today's Changes</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {[
            { label: "Total", value: summary.total, color: "text-foreground" },
            { label: "Budget", value: summary.budget, color: "text-amber-400" },
            { label: "New Campaigns", value: summary.newCampaigns, color: "text-emerald-400" },
            { label: "Ads Created", value: summary.adsCreated, color: "text-emerald-400" },
            { label: "Errors", value: summary.errors, color: "text-rose-400" },
            { label: "Rejections", value: summary.rejections, color: "text-rose-400" },
            { label: "Learning Started", value: summary.learningStarted, color: "text-sky-400" },
            { label: "Learning Limited", value: summary.learningLimited, color: "text-amber-400" },
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
              placeholder="Search campaigns, ads, errors..."
              className="bg-transparent border-none outline-none text-sm flex-1 text-foreground"
            />
            {search && (
              <button onClick={() => setSearch("")} className="text-muted-foreground hover:text-foreground">
                <X size={12} />
              </button>
            )}
          </div>
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
      {campaignsLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="chart-card p-12 text-center">
          <Activity size={32} className="mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">
            No campaign changes were detected during the selected date range.
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
                                    {u.status && (
                                      <span className={cn(
                                        "text-[10px] px-1.5 py-0.5 rounded font-medium",
                                        u.status === "Success" && "bg-emerald-500/10 text-emerald-400",
                                        u.status === "Warning" && "bg-amber-500/10 text-amber-400",
                                        u.status === "Failed" && "bg-rose-500/10 text-rose-400",
                                      )}>
                                        {u.status}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-xs text-muted-foreground mt-1 truncate">{u.objectName}</div>

                                  {(u.oldValue || u.newValue) && (
                                    <div className="flex items-center gap-2 mt-2 text-xs">
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
                                      <span className="text-muted-foreground">Reason: </span>
                                      <span className="text-foreground">{u.reason}</span>
                                    </div>
                                  )}
                                  {u.details && Object.entries(u.details).map(([k, v]) => (
                                    <div key={k} className="text-xs">
                                      <span className="text-muted-foreground">{k}: </span>
                                      <span className="text-foreground">{v}</span>
                                    </div>
                                  ))}
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
