import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip,
} from "recharts";
import { Campaign } from "@/data/mockData";
import { TrendingUp, TrendingDown, ArrowRight, Zap, AlertTriangle, CheckCircle } from "lucide-react";

// ── Premium color palette (matching Charts.tsx) ──
const COLORS = {
  blue: "hsl(214, 100%, 60%)",
  green: "hsl(142, 71%, 45%)",
  amber: "hsl(38, 92%, 50%)",
  purple: "hsl(280, 68%, 60%)",
  red: "hsl(0, 84%, 60%)",
  cyan: "hsl(190, 90%, 50%)",
};

const RADAR_COLORS = [COLORS.blue, COLORS.green, COLORS.amber, COLORS.purple];

// ── Glass Tooltip ──
function GlassTooltip({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: "linear-gradient(135deg, hsl(220 35% 10% / 0.98), hsl(220 30% 8% / 0.98))",
      border: "1px solid hsl(214 100% 60% / 0.3)",
      borderRadius: "12px",
      padding: "10px 14px",
      boxShadow: "0 8px 32px hsl(222 47% 2% / 0.6), 0 0 20px hsl(214 100% 60% / 0.1)",
      backdropFilter: "blur(12px)",
      fontSize: "12px",
    }}>
      {children}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// 1. CONVERSION FUNNEL FLOW
// ════════════════════════════════════════════════════════════════
export function ConversionFunnel({ campaigns }: { campaigns: Campaign[] }) {
  const totals = campaigns.reduce((acc, c) => ({
    impressions: acc.impressions + c.impressions,
    clicks: acc.clicks + c.clicks,
    leads: acc.leads + c.leads,
    purchases: acc.purchases + c.purchases,
  }), { impressions: 0, clicks: 0, leads: 0, purchases: 0 });

  const stages = [
    { label: "Impressions", value: totals.impressions, color: COLORS.blue, icon: "👁️" },
    { label: "Clicks", value: totals.clicks, color: COLORS.cyan, icon: "👆" },
    { label: "Leads", value: totals.leads, color: COLORS.green, icon: "🎯" },
    { label: "Purchases", value: totals.purchases, color: COLORS.purple, icon: "💰" },
  ];

  const maxVal = stages[0].value;

  return (
    <div className="space-y-3">
      {stages.map((stage, i) => {
        const widthPct = Math.max((stage.value / maxVal) * 100, 8);
        const dropOff = i > 0 ? ((1 - stage.value / stages[i - 1].value) * 100).toFixed(1) : null;
        const convRate = i > 0 ? ((stage.value / stages[i - 1].value) * 100).toFixed(2) : null;

        return (
          <div key={stage.label}>
            {/* Drop-off indicator between stages */}
            {dropOff && (
              <div className="flex items-center gap-2 mb-1.5 ml-2">
                <ArrowRight size={10} style={{ color: "hsl(215, 18%, 52%)" }} />
                <span style={{ color: "hsl(0, 84%, 65%)", fontSize: "10px", fontWeight: 600 }}>
                  -{dropOff}% drop
                </span>
                <span style={{ color: "hsl(215, 18%, 42%)", fontSize: "10px" }}>
                  ({convRate}% conv.)
                </span>
              </div>
            )}
            <div className="flex items-center gap-3">
              <span className="text-sm w-6 text-center">{stage.icon}</span>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span style={{ color: "hsl(215, 20%, 65%)", fontSize: "11px", fontWeight: 500 }}>
                    {stage.label}
                  </span>
                  <span style={{ 
                    color: stage.color, fontSize: "13px", fontWeight: 700,
                    fontFamily: "'JetBrains Mono', monospace",
                  }}>
                    {stage.value >= 1000 ? `${(stage.value / 1000).toFixed(1)}K` : stage.value}
                  </span>
                </div>
                <div style={{
                  height: "10px",
                  background: "hsl(220, 25%, 12%)",
                  borderRadius: "6px",
                  overflow: "hidden",
                  position: "relative",
                }}>
                  <div style={{
                    width: `${widthPct}%`,
                    height: "100%",
                    borderRadius: "6px",
                    background: `linear-gradient(90deg, ${stage.color}, ${stage.color}dd)`,
                    boxShadow: `0 0 12px ${stage.color}40`,
                    transition: "width 1s ease-out",
                  }} />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// 2. CAMPAIGN HEALTH HEATMAP
// ════════════════════════════════════════════════════════════════
function getHealthColor(metric: string, value: number): string {
  const thresholds: Record<string, [number, number]> = {
    CTR: [2.0, 3.5],
    CPC: [6, 4],      // inverted: lower is better
    ROAS: [1.5, 2.5],
    CPL: [300, 150],   // inverted: lower is better
  };

  const [warn, good] = thresholds[metric] || [0, 0];
  const inverted = metric === "CPC" || metric === "CPL";

  if (inverted) {
    if (value <= good) return COLORS.green;
    if (value <= warn) return COLORS.amber;
    return COLORS.red;
  } else {
    if (value >= good) return COLORS.green;
    if (value >= warn) return COLORS.amber;
    return COLORS.red;
  }
}

export function CampaignHealthHeatmap({ campaigns }: { campaigns: Campaign[] }) {
  const metrics = ["CTR", "CPC", "ROAS", "CPL"] as const;

  const rows = campaigns.slice(0, 6).map(c => {
    const cpl = c.leads > 0 ? c.spend / c.leads : 0;
    return {
      name: c.name.length > 22 ? c.name.slice(0, 20) + "…" : c.name,
      values: {
        CTR: c.ctr,
        CPC: c.cpc,
        ROAS: c.roas,
        CPL: cpl,
      },
    };
  });

  return (
    <div className="overflow-x-auto">
      <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "3px" }}>
        <thead>
          <tr>
            <th style={{ color: "hsl(215, 18%, 52%)", fontSize: "10px", fontWeight: 600, textAlign: "left", padding: "4px 8px", letterSpacing: "0.05em" }}>
              CAMPAIGN
            </th>
            {metrics.map(m => (
              <th key={m} style={{ color: "hsl(215, 18%, 52%)", fontSize: "10px", fontWeight: 600, textAlign: "center", padding: "4px 8px", letterSpacing: "0.05em" }}>
                {m}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              <td style={{
                color: "hsl(214, 30%, 88%)", fontSize: "11px", fontWeight: 500,
                padding: "6px 8px", maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {row.name}
              </td>
              {metrics.map(m => {
                const val = row.values[m];
                const color = getHealthColor(m, val);
                return (
                  <td key={m} style={{
                    textAlign: "center", padding: "6px 8px",
                    background: `${color}18`,
                    borderRadius: "6px",
                    border: `1px solid ${color}30`,
                  }}>
                    <span style={{
                      color, fontSize: "12px", fontWeight: 700,
                      fontFamily: "'JetBrains Mono', monospace",
                    }}>
                      {m === "CTR" ? `${val.toFixed(1)}%` :
                       m === "ROAS" ? `${val.toFixed(1)}x` :
                       `₹${val.toFixed(0)}`}
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-3">
        {[
          { label: "Healthy", color: COLORS.green },
          { label: "Warning", color: COLORS.amber },
          { label: "Critical", color: COLORS.red },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1.5">
            <div style={{ width: "8px", height: "8px", borderRadius: "2px", background: l.color, boxShadow: `0 0 6px ${l.color}40` }} />
            <span style={{ color: "hsl(215, 18%, 52%)", fontSize: "10px" }}>{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// 3. BUDGET UTILIZATION RADIALS
// ════════════════════════════════════════════════════════════════
export function BudgetUtilization({ campaigns }: { campaigns: Campaign[] }) {
  const data = campaigns.slice(0, 5).map(c => {
    const pct = c.budget > 0 ? (c.spend / c.budget) * 100 : 0;
    const color = pct > 110 ? COLORS.red : pct > 90 ? COLORS.amber : COLORS.green;
    return {
      name: c.name.length > 18 ? c.name.slice(0, 16) + "…" : c.name,
      pct: Math.min(pct, 150),
      color,
      spend: c.spend,
      budget: c.budget,
      rawPct: pct,
    };
  });

  return (
    <div className="space-y-3">
      {data.map((d, i) => {
        const isOver = d.rawPct > 100;
        return (
          <div key={i} className="flex items-center gap-3">
            {/* Mini radial */}
            <div style={{ position: "relative", width: "40px", height: "40px", flexShrink: 0 }}>
              <svg width="40" height="40" viewBox="0 0 40 40">
                <circle cx="20" cy="20" r="16" fill="none" stroke="hsl(220, 25%, 14%)" strokeWidth="4" />
                <circle
                  cx="20" cy="20" r="16" fill="none"
                  stroke={d.color}
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={`${Math.min(d.pct, 100) * 1.005} 100.5`}
                  transform="rotate(-90 20 20)"
                  style={{ filter: `drop-shadow(0 0 4px ${d.color}60)`, transition: "stroke-dasharray 1s ease" }}
                />
              </svg>
              <div style={{
                position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "9px", fontWeight: 700, color: d.color,
                fontFamily: "'JetBrains Mono', monospace",
              }}>
                {Math.round(d.rawPct)}%
              </div>
            </div>
            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span style={{ color: "hsl(214, 30%, 88%)", fontSize: "11px", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {d.name}
                </span>
                {isOver && (
                  <span style={{
                    fontSize: "9px", fontWeight: 600, padding: "1px 6px", borderRadius: "4px",
                    background: "hsl(0, 84%, 60% / 0.15)",
                    color: "hsl(0, 84%, 65%)",
                    border: "1px solid hsl(0, 84%, 60% / 0.3)",
                  }}>
                    OVER
                  </span>
                )}
              </div>
              <div style={{ color: "hsl(215, 18%, 52%)", fontSize: "10px", marginTop: "2px" }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  ₹{(d.spend / 1000).toFixed(1)}K
                </span>
                <span style={{ margin: "0 4px" }}>/</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  ₹{(d.budget / 1000).toFixed(1)}K
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// 4. TOP VS BOTTOM PERFORMERS
// ════════════════════════════════════════════════════════════════
export function TopBottomPerformers({ campaigns }: { campaigns: Campaign[] }) {
  if (campaigns.length < 2) return null;

  const sorted = [...campaigns].sort((a, b) => b.roas - a.roas);
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];
  const multiplier = worst.roas > 0 ? (best.roas / worst.roas).toFixed(1) : "∞";

  const bestCPL = best.leads > 0 ? best.spend / best.leads : 0;
  const worstCPL = worst.leads > 0 ? worst.spend / worst.leads : 0;

  return (
    <div className="space-y-4">
      {/* Comparison header */}
      <div className="text-center" style={{ 
        color: "hsl(214, 100%, 70%)", fontSize: "11px", fontWeight: 600,
        padding: "6px 12px", borderRadius: "8px",
        background: "hsl(214, 100%, 60% / 0.08)",
        border: "1px solid hsl(214, 100%, 60% / 0.15)",
      }}>
        🏆 Best outperforms worst by <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 800 }}>{multiplier}x</span> on ROAS
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Best */}
        <div style={{
          background: "hsl(142, 71%, 45% / 0.06)",
          border: "1px solid hsl(142, 71%, 45% / 0.2)",
          borderRadius: "10px", padding: "14px",
        }}>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={14} style={{ color: COLORS.green }} />
            <span style={{ color: COLORS.green, fontSize: "10px", fontWeight: 700, letterSpacing: "0.05em" }}>TOP PERFORMER</span>
          </div>
          <p style={{ color: "hsl(214, 30%, 94%)", fontSize: "12px", fontWeight: 600, marginBottom: "10px", lineHeight: 1.3 }}>
            {best.name}
          </p>
          <div className="space-y-2">
            {[
              { label: "ROAS", value: `${best.roas.toFixed(1)}x` },
              { label: "CPL", value: bestCPL > 0 ? `₹${bestCPL.toFixed(0)}` : "N/A" },
              { label: "CTR", value: `${best.ctr.toFixed(1)}%` },
              { label: "Spend", value: `₹${(best.spend / 1000).toFixed(1)}K` },
            ].map(m => (
              <div key={m.label} className="flex items-center justify-between">
                <span style={{ color: "hsl(215, 18%, 52%)", fontSize: "10px" }}>{m.label}</span>
                <span style={{ color: COLORS.green, fontSize: "12px", fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>
                  {m.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Worst */}
        <div style={{
          background: "hsl(0, 84%, 60% / 0.06)",
          border: "1px solid hsl(0, 84%, 60% / 0.2)",
          borderRadius: "10px", padding: "14px",
        }}>
          <div className="flex items-center gap-2 mb-3">
            <TrendingDown size={14} style={{ color: COLORS.red }} />
            <span style={{ color: COLORS.red, fontSize: "10px", fontWeight: 700, letterSpacing: "0.05em" }}>BOTTOM PERFORMER</span>
          </div>
          <p style={{ color: "hsl(214, 30%, 94%)", fontSize: "12px", fontWeight: 600, marginBottom: "10px", lineHeight: 1.3 }}>
            {worst.name}
          </p>
          <div className="space-y-2">
            {[
              { label: "ROAS", value: `${worst.roas.toFixed(1)}x` },
              { label: "CPL", value: worstCPL > 0 ? `₹${worstCPL.toFixed(0)}` : "N/A" },
              { label: "CTR", value: `${worst.ctr.toFixed(1)}%` },
              { label: "Spend", value: `₹${(worst.spend / 1000).toFixed(1)}K` },
            ].map(m => (
              <div key={m.label} className="flex items-center justify-between">
                <span style={{ color: "hsl(215, 18%, 52%)", fontSize: "10px" }}>{m.label}</span>
                <span style={{ color: COLORS.red, fontSize: "12px", fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>
                  {m.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// 5. EFFICIENCY RADAR CHART
// ════════════════════════════════════════════════════════════════
export function EfficiencyRadar({ campaigns }: { campaigns: Campaign[] }) {
  const top4 = [...campaigns].sort((a, b) => b.roas - a.roas).slice(0, 4);

  // Normalize each metric to 0-100 scale
  const maxCTR = Math.max(...campaigns.map(c => c.ctr), 1);
  const maxROAS = Math.max(...campaigns.map(c => c.roas), 1);
  const maxCPC = Math.max(...campaigns.map(c => c.cpc), 1);
  const maxLeadRate = Math.max(...campaigns.map(c => c.impressions > 0 ? (c.leads / c.impressions) * 10000 : 0), 1);
  const maxEfficiency = Math.max(...campaigns.map(c => c.leads > 0 ? c.roas * (c.spend / c.leads > 0 ? 1 / (c.spend / c.leads) : 0) * 10000 : 0), 1);

  const radarData = [
    { metric: "CTR" },
    { metric: "ROAS" },
    { metric: "Low CPC" },
    { metric: "Lead Rate" },
    { metric: "Efficiency" },
  ].map(d => {
    const point: any = { ...d };
    top4.forEach((c, i) => {
      const cpl = c.leads > 0 ? c.spend / c.leads : 9999;
      const leadRate = c.impressions > 0 ? (c.leads / c.impressions) * 10000 : 0;
      const efficiency = c.leads > 0 ? c.roas * (1 / cpl) * 10000 : 0;

      switch (d.metric) {
        case "CTR": point[`c${i}`] = (c.ctr / maxCTR) * 100; break;
        case "ROAS": point[`c${i}`] = (c.roas / maxROAS) * 100; break;
        case "Low CPC": point[`c${i}`] = ((maxCPC - c.cpc) / maxCPC) * 100; break;
        case "Lead Rate": point[`c${i}`] = (leadRate / maxLeadRate) * 100; break;
        case "Efficiency": point[`c${i}`] = maxEfficiency > 0 ? (efficiency / maxEfficiency) * 100 : 0; break;
      }
    });
    return point;
  });

  return (
    <div>
      <ResponsiveContainer width="100%" height={280}>
        <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="72%">
          <PolarGrid stroke="hsl(220, 25%, 14%)" />
          <PolarAngleAxis
            dataKey="metric"
            tick={{ fill: "hsl(215, 18%, 52%)", fontSize: 10, fontWeight: 500 }}
          />
          <PolarRadiusAxis tick={false} axisLine={false} domain={[0, 100]} />
          {top4.map((c, i) => (
            <Radar
              key={c.campaignId}
              name={c.name}
              dataKey={`c${i}`}
              stroke={RADAR_COLORS[i]}
              fill={RADAR_COLORS[i]}
              fillOpacity={0.08}
              strokeWidth={2}
              dot={{ r: 3, fill: RADAR_COLORS[i] }}
            />
          ))}
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              return (
                <GlassTooltip>
                  <p style={{ color: "hsl(215, 18%, 52%)", fontSize: "10px", marginBottom: "6px", fontWeight: 600 }}>{label}</p>
                  {payload.map((p: any, i: number) => (
                    <div key={i} className="flex items-center gap-2 mb-1">
                      <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: p.stroke, boxShadow: `0 0 4px ${p.stroke}` }} />
                      <span style={{ color: "hsl(215, 20%, 65%)", fontSize: "10px", maxWidth: "100px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</span>
                      <span style={{ color: "hsl(214, 30%, 94%)", fontSize: "11px", fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>
                        {Number(p.value).toFixed(0)}
                      </span>
                    </div>
                  ))}
                </GlassTooltip>
              );
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 -mt-2">
        {top4.map((c, i) => (
          <div key={c.campaignId} className="flex items-center gap-1.5">
            <div style={{ width: "8px", height: "3px", borderRadius: "2px", background: RADAR_COLORS[i], boxShadow: `0 0 6px ${RADAR_COLORS[i]}40` }} />
            <span style={{ color: "hsl(215, 18%, 52%)", fontSize: "10px" }}>
              {c.name.length > 16 ? c.name.slice(0, 14) + "…" : c.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
