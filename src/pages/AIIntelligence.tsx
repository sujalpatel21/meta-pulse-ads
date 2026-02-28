import { useState } from "react";
import { useDashboard } from "@/components/layout/Layout";
import { supabase } from "@/integrations/supabase/client";
import { Brain, ChevronDown, ChevronRight, RefreshCw, Shield, AlertTriangle, Target, TrendingUp, Zap, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface AIAnalysis {
  scaling_score: number;
  scaling_score_reasoning: string;
  strengths: string[];
  weaknesses: string[];
  bottlenecks: string[];
  risks: string[];
  recommendations: string[];
}

// ── Scaling Score Circle ──
function ScalingScoreCircle({ score, reasoning }: { score: number; reasoning: string }) {
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const color = score >= 70 ? "hsl(142 71% 45%)" : score >= 40 ? "hsl(38 92% 50%)" : "hsl(0 84% 60%)";
  const label = score >= 70 ? "Ready to Scale" : score >= 40 ? "Needs Optimization" : "High Risk";

  return (
    <div className="chart-card p-8 flex flex-col items-center text-center">
      <div className="relative w-[200px] h-[200px]">
        <svg width="200" height="200" viewBox="0 0 200 200" className="transform -rotate-90">
          {/* Background circle */}
          <circle cx="100" cy="100" r={radius} fill="none"
            stroke="hsl(220 25% 14%)" strokeWidth="10" />
          {/* Progress arc */}
          <circle cx="100" cy="100" r={radius} fill="none"
            stroke={color} strokeWidth="10" strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            style={{
              transition: "stroke-dashoffset 1.5s ease-out",
              filter: `drop-shadow(0 0 8px ${color})`,
            }}
          />
        </svg>
        {/* Center score */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span style={{
            fontSize: "42px", fontWeight: 800, color,
            fontFamily: "'JetBrains Mono', monospace",
            textShadow: `0 0 20px ${color}`,
          }}>
            {score}
          </span>
          <span className="text-xs text-muted-foreground font-medium mt-1">/ 100</span>
        </div>
      </div>
      <div className="mt-4 space-y-1">
        <div className="flex items-center justify-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
          <span className="text-sm font-semibold" style={{ color }}>{label}</span>
        </div>
        {reasoning && (
          <p className="text-xs text-muted-foreground max-w-xs mx-auto mt-2">{reasoning}</p>
        )}
      </div>
    </div>
  );
}

// ── Collapsible Section ──
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
            <div key={i} className="flex gap-3 p-3 rounded-lg"
              style={{ background: "hsl(var(--muted) / 0.3)" }}>
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

// ── Main Page ──
export default function AIIntelligence() {
  const { campaigns, campaignsLoading, selectedAccount, dateRange } = useDashboard();
  const { toast } = useToast();
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dateRangeLabels: Record<string, string> = {
    last7: "Last 7 Days", last14: "Last 14 Days", last30: "Last 30 Days",
    last90: "Last 90 Days", thisMonth: "This Month", lastMonth: "Last Month",
  };

  const generateAnalysis = async () => {
    if (!campaigns.length) {
      toast({ title: "No data", description: "No campaign data available to analyze.", variant: "destructive" });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const campaignData = campaigns.map((c) => ({
        name: c.name,
        objective: c.objective,
        status: c.status,
        budget: c.budget,
        spend: c.spend,
        impressions: c.impressions,
        clicks: c.clicks,
        leads: c.leads,
        purchases: c.purchases,
        ctr: c.ctr,
        cpc: c.cpc,
        roas: c.roas,
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

      setAnalysis(data);
      toast({ title: "Analysis Complete", description: "AI Performance Intelligence report generated." });
    } catch (e: any) {
      console.error("AI analysis error:", e);
      setError(e.message || "Failed to generate analysis");
      toast({ title: "Analysis Failed", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, hsl(280 68% 60%), hsl(214 100% 60%))" }}>
              <Brain size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">AI Performance Intelligence</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {selectedAccount?.accountName || "Loading..."} · {dateRangeLabels[dateRange] || dateRange}
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={generateAnalysis}
          disabled={loading || campaignsLoading || !campaigns.length}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all",
            loading
              ? "opacity-60 cursor-not-allowed"
              : "hover:scale-105 hover:shadow-lg"
          )}
          style={{
            background: "linear-gradient(135deg, hsl(280 68% 60%), hsl(214 100% 60%))",
            color: "white",
            boxShadow: "0 4px 20px hsl(280 68% 60% / 0.3)",
          }}
        >
          <RefreshCw size={16} className={cn(loading && "animate-spin")} />
          {loading ? "Analyzing..." : analysis ? "Regenerate Analysis" : "Generate Analysis"}
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="chart-card p-12 flex flex-col items-center justify-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-2 border-muted animate-spin"
              style={{ borderTopColor: "hsl(280 68% 60%)" }} />
            <Brain size={24} className="absolute inset-0 m-auto text-muted-foreground" />
          </div>
          <div className="text-center space-y-1">
            <p className="text-sm font-semibold text-foreground">Analyzing performance patterns...</p>
            <p className="text-xs text-muted-foreground">
              Processing {campaigns.length} campaigns · Detecting trends · Building recommendations
            </p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="chart-card p-6 text-center space-y-2" style={{
          borderColor: "hsl(0 84% 60% / 0.3)",
        }}>
          <AlertTriangle size={24} className="mx-auto" style={{ color: "hsl(0 84% 60%)" }} />
          <p className="text-sm text-foreground">{error}</p>
          <button onClick={generateAnalysis}
            className="text-xs px-3 py-1.5 rounded-lg"
            style={{ background: "hsl(var(--muted))", color: "hsl(var(--foreground))" }}>
            Try Again
          </button>
        </div>
      )}

      {/* Empty State */}
      {!analysis && !loading && !error && (
        <div className="chart-card p-16 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, hsl(280 68% 60% / 0.15), hsl(214 100% 60% / 0.15))", border: "1px solid hsl(280 68% 60% / 0.2)" }}>
            <Brain size={32} style={{ color: "hsl(280 68% 60%)" }} />
          </div>
          <div className="space-y-2 max-w-md">
            <h3 className="text-lg font-semibold text-foreground">Performance Intelligence Engine</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Generate AI-powered analysis of your Meta Ads performance. Get strengths, weaknesses, bottlenecks, risk signals, and strategic recommendations — all tied to your real metrics.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2 mt-2">
            {["Strengths", "Weaknesses", "Bottlenecks", "Risks", "Scaling Score"].map((tag) => (
              <span key={tag} className="text-xs px-3 py-1 rounded-full"
                style={{ background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }}>
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Analysis Results */}
      {analysis && !loading && (
        <div className="space-y-4 animate-fade-in">
          {/* Top Row: Score + Quick Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <ScalingScoreCircle score={analysis.scaling_score} reasoning={analysis.scaling_score_reasoning} />

            <div className="lg:col-span-2 grid grid-cols-2 gap-3">
              {[
                { label: "Strengths Found", count: analysis.strengths.length, color: "hsl(142 71% 45%)", icon: CheckCircle2 },
                { label: "Weaknesses Detected", count: analysis.weaknesses.length, color: "hsl(38 92% 50%)", icon: AlertTriangle },
                { label: "Risk Signals", count: analysis.risks.length, color: "hsl(0 84% 60%)", icon: Shield },
                { label: "Recommendations", count: analysis.recommendations.length, color: "hsl(214 100% 60%)", icon: Target },
              ].map((stat, i) => (
                <div key={i} className="chart-card p-5 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: `${stat.color}15`, border: `1px solid ${stat.color}30` }}>
                    <stat.icon size={18} style={{ color: stat.color }} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold" style={{
                      color: stat.color,
                      fontFamily: "'JetBrains Mono', monospace",
                    }}>{stat.count}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Analysis Sections */}
          <AnalysisSection
            title="Strengths — What's Working"
            icon={TrendingUp}
            color="hsl(142 71% 45%)"
            items={analysis.strengths}
            defaultOpen={true}
          />
          <AnalysisSection
            title="Weaknesses — Performance Leaks"
            icon={AlertTriangle}
            color="hsl(38 92% 50%)"
            items={analysis.weaknesses}
            defaultOpen={true}
          />
          <AnalysisSection
            title="Bottlenecks — Funnel Breaks"
            icon={Zap}
            color="hsl(280 68% 60%)"
            items={analysis.bottlenecks}
          />
          <AnalysisSection
            title="Risk Signals — Watch Closely"
            icon={Shield}
            color="hsl(0 84% 60%)"
            items={analysis.risks}
          />
          <AnalysisSection
            title="Recommendations — Action Steps"
            icon={Target}
            color="hsl(214 100% 60%)"
            items={analysis.recommendations}
            defaultOpen={true}
          />
        </div>
      )}
    </div>
  );
}
