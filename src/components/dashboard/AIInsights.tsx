import { useState, useEffect } from "react";
import { Zap, ChevronDown, ChevronUp, RefreshCw } from "lucide-react";
import { Campaign } from "@/data/mockData";
import { generateAIInsights } from "@/services/metaService";

interface AIInsightsProps {
  campaigns: Campaign[];
}

export default function AIInsights({ campaigns }: AIInsightsProps) {
  const [insights, setInsights] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(true);

  const loadInsights = async () => {
    setLoading(true);
    const result = await generateAIInsights(campaigns);
    setInsights(result);
    setLoading(false);
  };

  useEffect(() => {
    loadInsights();
  }, [campaigns]);

  return (
    <div className="ai-insight-box p-5 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center animate-pulse-brand"
            style={{ background: "hsl(var(--brand) / 0.2)" }}
          >
            <Zap size={14} style={{ color: "hsl(var(--brand))" }} />
          </div>
          <div>
            <h3 className="text-sm font-bold" style={{ color: "hsl(var(--foreground))" }}>
              AI Performance Insights
            </h3>
            <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
              Logic-based analysis · Ready for AI API upgrade
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadInsights}
            className="p-1.5 rounded-md transition-all hover:bg-muted"
            style={{ color: "hsl(var(--muted-foreground))" }}
            disabled={loading}
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 rounded-md transition-all hover:bg-muted"
            style={{ color: "hsl(var(--muted-foreground))" }}
          >
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="space-y-3">
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse flex gap-3">
                  <div className="w-1 h-12 rounded-full bg-muted shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-muted rounded-full w-3/4" />
                    <div className="h-3 bg-muted rounded-full w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            insights.map((insight, i) => (
              <div key={i} className="flex gap-3 items-start">
                <div
                  className="w-1 rounded-full shrink-0 mt-1"
                  style={{
                    height: "auto",
                    minHeight: "32px",
                    background: "var(--gradient-brand)",
                  }}
                />
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "hsl(var(--foreground))" }}
                  dangerouslySetInnerHTML={{ __html: insight }}
                />
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
