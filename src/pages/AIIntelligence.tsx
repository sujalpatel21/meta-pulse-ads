import { useState, useMemo } from "react";
import { useDashboard } from "@/components/layout/Layout";
import { supabase } from "@/integrations/supabase/client";
import {
  Brain, RefreshCw, AlertTriangle, Target, TrendingUp, Zap,
  CheckCircle2, Shield, ChevronDown, ChevronRight,
  Skull, Flame, Droplets, Activity, ArrowUpRight, Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  analyzeAccount, AccountIntel, CampaignIntel, Signal,
  getSignalColor, getSignalBg, getSignalLabel, getHealthColor,
} from "@/lib/decisionEngine";
import { AreaChart, Area, ResponsiveContainer } from "recharts";

// ── Health Score Ring ──────────────────────────────────────────────

function HealthScoreRing({ score, size = 160, label }: { score: number; size?: number; label?: string }) {
  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const color = getHealthColor(score);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
        <circle cx={size/2} cy={size/2} r={radius} fill="none"
          stroke="hsl(220 25% 14%)" strokeWidth="8" />
        <circle cx={size/2} cy={size/2} r={radius} fill="none"
          stroke={color} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          style={{ transition: "stroke-dashoffset 1.2s ease-out", filter: `drop-shadow(0 0 6px ${color})` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono font-extrabold" style={{
          fontSize: size > 120 ? "36px" : "24px", color,
          textShadow: `0 0 16px ${color}`,
        }}>
          {score}
        </span>
        {label && <span className="text-[10px] text-muted-foreground font-medium mt-0.5">{label}</span>}
      </div>
    </div>
  );
}

// ── Signal Badge ──────────────────────────────────────────────────

function SignalBadge({ type, className }: { type: string; className?: string }) {
  const label = getSignalLabel(type as any);
  const color = getSignalColor(type as any);
  const bg = getSignalBg(type as any);

  return (
    <span
      className={cn("inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold", className)}
      style={{ background: bg, color, border: `1px solid ${color}30` }}
    >
      {label}
    </span>
  );
}

// ── Mini Sparkline ────────────────────────────────────────────────

function MiniSparkline({ data, color = "hsl(214 100% 60%)" }: { data: number[]; color?: string }) {
  const formatted = data.map((v, i) => ({ i, v }));
  return (
    <ResponsiveContainer width={72} height={28}>
      <AreaChart data={formatted}>
        <defs>
          <linearGradient id={`ms-${color.replace(/[^a-z0-9]/gi, "")}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.4} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5}
          fill={`url(#ms-${color.replace(/[^a-z0-9]/gi, "")})`} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ── Leakage Meter ─────────────────────────────────────────────────

function LeakageMeter({ amount, max }: { amount: number; max: number }) {
  const pct = Math.min((amount / Math.max(max, 1)) * 100, 100);
  const color = pct > 30 ? "hsl(0 84% 60%)" : pct > 15 ? "hsl(38 92% 50%)" : "hsl(142 71% 45%)";

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="text-[10px] text-muted-foreground font-medium">BUDGET LEAK</span>
        <span className="text-xs font-mono font-bold" style={{ color }}>
          ₹{amount.toLocaleString("en-IN")}
        </span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "hsl(220 25% 14%)" }}>
        <div className="h-full rounded-full transition-all duration-700" style={{
          width: `${pct}%`,
          background: `linear-gradient(90deg, ${color}, ${pct > 30 ? "hsl(0 84% 50%)" : color})`,
          boxShadow: `0 0 8px ${color}`,
        }} />
      </div>
    </div>
  );
}

// ── Campaign Intel Card ───────────────────────────────────────────

function CampaignIntelCard({ intel }: { intel: CampaignIntel }) {
  const [expanded, setExpanded] = useState(false);
  const c = intel.campaign;
  const dailySpend = c.dailyMetrics?.map((d) => d.spend) || [];
  const dailyLeads = c.dailyMetrics?.map((d) => d.leads) || [];

  return (
    <div className="chart-card overflow-hidden group hover:border-[hsl(214,100%,60%,0.2)] transition-all">
      {/* Main row */}
      <div
        className="p-4 cursor-pointer flex items-center gap-4"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Health score */}
        <HealthScoreRing score={intel.healthScore} size={56} />

        {/* Campaign info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-bold text-foreground truncate">{c.name}</h3>
            <SignalBadge type={intel.primaryAction} />
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="font-mono">₹{c.spend.toLocaleString("en-IN")}</span>
            <span className="font-mono">{c.leads} leads</span>
            <span className="font-mono">{c.ctr.toFixed(2)}% CTR</span>
            {intel.cpl > 0 && <span className="font-mono">₹{intel.cpl.toFixed(0)} CPL</span>}
            {c.roas > 0 && (
              <span className="font-mono" style={{
                color: c.roas >= 2 ? "hsl(142 71% 45%)" : c.roas >= 1 ? "hsl(38 92% 50%)" : "hsl(0 84% 60%)",
              }}>
                {c.roas.toFixed(1)}x ROAS
              </span>
            )}
          </div>
        </div>

        {/* Sparkline */}
        <div className="hidden md:block">
          <MiniSparkline data={dailySpend} color={getHealthColor(intel.healthScore)} />
        </div>

        {/* Budget pacing */}
        <div className="hidden lg:block w-24">
          <div className="text-[10px] text-muted-foreground mb-0.5">Pacing</div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "hsl(220 25% 14%)" }}>
            <div className="h-full rounded-full" style={{
              width: `${Math.min(intel.budgetPacing, 100)}%`,
              background: intel.budgetPacing > 110 ? "hsl(0 84% 60%)" : intel.budgetPacing > 90 ? "hsl(38 92% 50%)" : "hsl(142 71% 45%)",
            }} />
          </div>
          <div className="text-[10px] font-mono text-muted-foreground mt-0.5">{intel.budgetPacing.toFixed(0)}%</div>
        </div>

        {/* Expand icon */}
        <div className="text-muted-foreground">
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </div>
      </div>

      {/* Expanded signals */}
      {expanded && (
        <div className="px-4 pb-4 space-y-2 border-t animate-fade-in" style={{ borderColor: "hsl(var(--border) / 0.5)" }}>
          {intel.signals.map((signal, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-lg" style={{ background: getSignalBg(signal.type) }}>
              <SignalIcon type={signal.type} />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold" style={{ color: getSignalColor(signal.type) }}>
                    {signal.title}
                  </span>
                  {signal.confidence && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{
                      background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))"
                    }}>
                      {signal.confidence}% confidence
                    </span>
                  )}
                </div>
                <p className="text-xs text-foreground/80 mt-0.5 leading-relaxed">{signal.detail}</p>
              </div>
              {signal.value !== undefined && signal.type !== "fatigue" && (
                <span className="text-xs font-mono font-bold shrink-0" style={{ color: getSignalColor(signal.type) }}>
                  ₹{signal.value.toLocaleString("en-IN")}
                </span>
              )}
            </div>
          ))}

          {/* Projection */}
          {intel.primaryAction === "scale" && intel.projectedLeadsAt20 > 0 && (
            <div className="flex items-center gap-3 p-3 rounded-lg" style={{
              background: "hsl(142 71% 45% / 0.08)", border: "1px solid hsl(142 71% 45% / 0.2)"
            }}>
              <TrendingUp size={14} style={{ color: "hsl(142 71% 45%)" }} />
              <span className="text-xs text-foreground/80">
                Scale 20% → Projected <strong className="font-mono" style={{ color: "hsl(142 71% 45%)" }}>
                  {intel.projectedLeadsAt20} leads
                </strong> (+{intel.projectedLeadsAt20 - intel.campaign.leads})
              </span>
            </div>
          )}

          {intel.wastedSpend > 0 && (
            <div className="flex items-center gap-3 p-3 rounded-lg" style={{
              background: "hsl(0 84% 60% / 0.08)", border: "1px solid hsl(0 84% 60% / 0.2)"
            }}>
              <Droplets size={14} style={{ color: "hsl(0 84% 60%)" }} />
              <span className="text-xs text-foreground/80">
                Estimated wasted spend: <strong className="font-mono" style={{ color: "hsl(0 84% 60%)" }}>
                  ₹{intel.wastedSpend.toLocaleString("en-IN")}
                </strong>
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SignalIcon({ type }: { type: string }) {
  const color = getSignalColor(type as any);
  const size = 14;
  switch (type) {
    case "scale": return <TrendingUp size={size} style={{ color }} />;
    case "kill": return <Skull size={size} style={{ color }} />;
    case "fatigue": return <Flame size={size} style={{ color }} />;
    case "leakage": return <Droplets size={size} style={{ color }} />;
    default: return <Eye size={size} style={{ color }} />;
  }
}

// ── AI Deep Analysis Section ──────────────────────────────────────

interface AIAnalysis {
  scaling_score: number;
  scaling_score_reasoning: string;
  strengths: string[];
  weaknesses: string[];
  bottlenecks: string[];
  risks: string[];
  recommendations: string[];
}

function AnalysisSection({
  title, icon: Icon, color, items, defaultOpen = false,
}: {
  title: string; icon: any; color: string; items: string[]; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  if (!items.length) return null;

  return (
    <div className="chart-card overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 hover:bg-[hsl(var(--muted)/0.3)] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: `${color}20`, border: `1px solid ${color}40` }}>
            <Icon size={16} style={{ color }} />
          </div>
          <span className="text-sm font-semibold text-foreground">{title}</span>
          <span className="text-xs px-2 py-0.5 rounded-full"
            style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}>
            {items.length}
          </span>
        </div>
        {open ? <ChevronDown size={16} className="text-muted-foreground" /> : <ChevronRight size={16} className="text-muted-foreground" />}
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-2 animate-fade-in">
          {items.map((item, i) => (
            <div key={i} className="flex gap-3 p-3 rounded-lg" style={{ background: "hsl(var(--muted) / 0.3)" }}>
              <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
              <p className="text-sm text-foreground/90 leading-relaxed">{item}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────

export default function AIIntelligence() {
  const { campaigns, campaignsLoading, selectedAccount, dateRange } = useDashboard();
  const { toast } = useToast();
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Client-side decision intelligence — instant, no API call needed
  const intel = useMemo(() => analyzeAccount(campaigns), [campaigns]);

  const dateRangeLabels: Record<string, string> = {
    last7: "Last 7 Days", last14: "Last 14 Days", last30: "Last 30 Days",
    last90: "Last 90 Days", thisMonth: "This Month", lastMonth: "Last Month",
  };

  const generateDeepAnalysis = async () => {
    if (!campaigns.length) return;
    setAiLoading(true);
    setAiError(null);

    try {
      const campaignData = campaigns.map((c) => ({
        name: c.name, objective: c.objective, status: c.status,
        budget: c.budget, spend: c.spend, impressions: c.impressions,
        clicks: c.clicks, leads: c.leads, purchases: c.purchases,
        ctr: c.ctr, cpc: c.cpc, roas: c.roas,
      }));

      const { data, error: fnError } = await supabase.functions.invoke("ai-intelligence", {
        body: {
          campaignData,
          accountName: selectedAccount?.accountName || "Unknown",
          dateRange: dateRangeLabels[dateRange] || dateRange,
        },
      });

      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);

      setAiAnalysis(data);
      toast({ title: "Deep Analysis Complete", description: "AI strategic insights generated." });
    } catch (e: any) {
      setAiError(e.message);
      toast({ title: "Analysis Failed", description: e.message, variant: "destructive" });
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, hsl(280 68% 60%), hsl(214 100% 60%))" }}>
            <Brain size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">MetaPulse Command Center</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {selectedAccount?.accountName || "Loading..."} · {dateRangeLabels[dateRange] || dateRange}
            </p>
          </div>
        </div>
      </div>

      {campaignsLoading ? (
        <div className="chart-card p-12 flex flex-col items-center justify-center space-y-4">
          <div className="w-12 h-12 rounded-full border-2 border-muted animate-spin" style={{ borderTopColor: "hsl(280 68% 60%)" }} />
          <p className="text-sm text-muted-foreground">Loading campaign data...</p>
        </div>
      ) : campaigns.length === 0 ? (
        <div className="chart-card p-12 text-center">
          <p className="text-muted-foreground">No campaigns found.</p>
        </div>
      ) : (
        <>
          {/* ── AI COMMAND CENTER ── */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Health Score - larger */}
            <div className="chart-card p-5 flex flex-col items-center justify-center col-span-2 lg:col-span-1">
              <HealthScoreRing score={intel.healthScore} size={140} label="ACCOUNT HEALTH" />
            </div>

            {/* Stat cards */}
            {[
              {
                label: "Budget Leak Today",
                value: `₹${intel.totalBudgetLeak.toLocaleString("en-IN")}`,
                icon: Droplets,
                color: intel.totalBudgetLeak > 5000 ? "hsl(0 84% 60%)" : "hsl(38 92% 50%)",
                sub: "Estimated daily waste",
              },
              {
                label: "Scale Opportunities",
                value: intel.scaleOpportunities.toString(),
                icon: TrendingUp,
                color: "hsl(142 71% 45%)",
                sub: `of ${campaigns.length} campaigns`,
              },
              {
                label: "Kill Recommendations",
                value: intel.killRecommendations.toString(),
                icon: Skull,
                color: "hsl(0 84% 60%)",
                sub: "Pause immediately",
              },
              {
                label: "Monitoring",
                value: intel.monitorCount.toString(),
                icon: Eye,
                color: "hsl(38 92% 50%)",
                sub: "Watch closely",
              },
            ].map((stat, i) => (
              <div key={i} className="chart-card p-4 flex flex-col justify-between">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{
                    background: `${stat.color}15`, border: `1px solid ${stat.color}30`,
                  }}>
                    <stat.icon size={14} style={{ color: stat.color }} />
                  </div>
                  <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">{stat.label}</span>
                </div>
                <p className="text-2xl font-extrabold font-mono" style={{ color: stat.color }}>{stat.value}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{stat.sub}</p>
              </div>
            ))}
          </div>

          {/* ── Account-level leakage meter ── */}
          {intel.totalBudgetLeak > 0 && (
            <div className="chart-card p-4">
              <LeakageMeter
                amount={intel.totalBudgetLeak}
                max={campaigns.reduce((s, c) => s + c.spend, 0)}
              />
            </div>
          )}

          {/* ── AI Deep Analysis Section ── */}
          <div className="chart-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Brain size={16} style={{ color: "hsl(280 68% 60%)" }} />
                <h2 className="text-sm font-bold text-foreground">AI Deep Strategic Analysis</h2>
              </div>
              <button
                onClick={generateDeepAnalysis}
                disabled={aiLoading}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all",
                  aiLoading ? "opacity-60" : "hover:scale-105"
                )}
                style={{
                  background: "linear-gradient(135deg, hsl(280 68% 60%), hsl(214 100% 60%))",
                  color: "white",
                }}
              >
                <RefreshCw size={12} className={cn(aiLoading && "animate-spin")} />
                {aiLoading ? "Analyzing..." : aiAnalysis ? "Regenerate" : "Generate Deep Analysis"}
              </button>
            </div>

            {aiLoading && (
              <div className="flex items-center justify-center py-8 space-x-3">
                <div className="w-8 h-8 rounded-full border-2 border-muted animate-spin" style={{ borderTopColor: "hsl(280 68% 60%)" }} />
                <p className="text-xs text-muted-foreground">Analyzing performance patterns across {campaigns.length} campaigns...</p>
              </div>
            )}

            {aiError && !aiLoading && (
              <div className="p-4 rounded-lg text-center" style={{ background: "hsl(0 84% 60% / 0.08)" }}>
                <p className="text-xs text-foreground">{aiError}</p>
                <button onClick={generateDeepAnalysis} className="text-xs mt-2 px-3 py-1 rounded-lg" style={{ background: "hsl(var(--muted))" }}>
                  Try Again
                </button>
              </div>
            )}

            {!aiAnalysis && !aiLoading && !aiError && (
              <div className="text-center py-6">
                <p className="text-xs text-muted-foreground">
                  Click "Generate Deep Analysis" for AI-powered strategic insights with specific recommendations.
                </p>
              </div>
            )}

            {aiAnalysis && !aiLoading && (
              <div className="space-y-3">
                <AnalysisSection title="Strengths" icon={CheckCircle2} color="hsl(142 71% 45%)" items={aiAnalysis.strengths} defaultOpen />
                <AnalysisSection title="Weaknesses" icon={AlertTriangle} color="hsl(38 92% 50%)" items={aiAnalysis.weaknesses} defaultOpen />
                <AnalysisSection title="Bottlenecks" icon={Zap} color="hsl(280 68% 60%)" items={aiAnalysis.bottlenecks} />
                <AnalysisSection title="Risk Signals" icon={Shield} color="hsl(0 84% 60%)" items={aiAnalysis.risks} />
                <AnalysisSection title="Recommendations" icon={Target} color="hsl(214 100% 60%)" items={aiAnalysis.recommendations} defaultOpen />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
