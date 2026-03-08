import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, Cell,
} from "recharts";
import { Campaign } from "@/data/mockData";
import { TrendingUp, TrendingDown, Trophy, Star, Image, Crown } from "lucide-react";

// ── Premium color palette ──
const COLORS = {
  blue: "hsl(214, 100%, 60%)",
  green: "hsl(142, 71%, 45%)",
  amber: "hsl(38, 92%, 50%)",
  purple: "hsl(280, 68%, 60%)",
  red: "hsl(0, 84%, 60%)",
  cyan: "hsl(190, 90%, 50%)",
  pink: "hsl(330, 80%, 60%)",
};

// ════════════════════════════════════════════════════════════════
// 1. CAMPAIGN HEALTH HEATMAP
// ════════════════════════════════════════════════════════════════
function getHealthColor(metric: string, value: number): string {
  const thresholds: Record<string, [number, number]> = {
    CTR: [2.0, 3.5],
    CPC: [6, 4],
    ROAS: [1.5, 2.5],
    CPL: [300, 150],
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
      values: { CTR: c.ctr, CPC: c.cpc, ROAS: c.roas, CPL: cpl },
    };
  });

  return (
    <div className="overflow-x-auto">
      <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "3px" }}>
        <thead>
          <tr>
            <th style={{ color: "hsl(215, 18%, 52%)", fontSize: "10px", fontWeight: 600, textAlign: "left", padding: "4px 8px", letterSpacing: "0.05em" }}>CAMPAIGN</th>
            {metrics.map(m => (
              <th key={m} style={{ color: "hsl(215, 18%, 52%)", fontSize: "10px", fontWeight: 600, textAlign: "center", padding: "4px 8px", letterSpacing: "0.05em" }}>{m}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              <td style={{ color: "hsl(214, 30%, 88%)", fontSize: "11px", fontWeight: 500, padding: "6px 8px", maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.name}</td>
              {metrics.map(m => {
                const val = row.values[m];
                const color = getHealthColor(m, val);
                return (
                  <td key={m} style={{ textAlign: "center", padding: "6px 8px", background: `${color}18`, borderRadius: "6px", border: `1px solid ${color}30` }}>
                    <span style={{ color, fontSize: "12px", fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>
                      {m === "CTR" ? `${val.toFixed(1)}%` : m === "ROAS" ? `${val.toFixed(1)}x` : `₹${val.toFixed(0)}`}
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex items-center justify-center gap-4 mt-3">
        {[{ label: "Healthy", color: COLORS.green }, { label: "Warning", color: COLORS.amber }, { label: "Critical", color: COLORS.red }].map(l => (
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
// 2. TOP VS BOTTOM PERFORMERS
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
      <div className="text-center" style={{
        color: "hsl(214, 100%, 70%)", fontSize: "11px", fontWeight: 600,
        padding: "6px 12px", borderRadius: "8px",
        background: "hsl(214, 100%, 60% / 0.08)", border: "1px solid hsl(214, 100%, 60% / 0.15)",
      }}>
        🏆 Best outperforms worst by <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 800 }}>{multiplier}x</span> on ROAS
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[{ camp: best, label: "TOP PERFORMER", Icon: TrendingUp, color: COLORS.green, cpl: bestCPL },
          { camp: worst, label: "BOTTOM PERFORMER", Icon: TrendingDown, color: COLORS.red, cpl: worstCPL }].map(({ camp, label, Icon, color, cpl }) => (
          <div key={label} style={{ background: `${color}0F`, border: `1px solid ${color}33`, borderRadius: "10px", padding: "14px" }}>
            <div className="flex items-center gap-2 mb-3">
              <Icon size={14} style={{ color }} />
              <span style={{ color, fontSize: "10px", fontWeight: 700, letterSpacing: "0.05em" }}>{label}</span>
            </div>
            <p style={{ color: "hsl(214, 30%, 94%)", fontSize: "12px", fontWeight: 600, marginBottom: "10px", lineHeight: 1.3 }}>{camp.name}</p>
            <div className="space-y-2">
              {[{ label: "ROAS", value: `${camp.roas.toFixed(1)}x` }, { label: "CPL", value: cpl > 0 ? `₹${cpl.toFixed(0)}` : "N/A" },
                { label: "CTR", value: `${camp.ctr.toFixed(1)}%` }, { label: "Spend", value: `₹${(camp.spend / 1000).toFixed(1)}K` }].map(m => (
                <div key={m.label} className="flex items-center justify-between">
                  <span style={{ color: "hsl(215, 18%, 52%)", fontSize: "10px" }}>{m.label}</span>
                  <span style={{ color, fontSize: "12px", fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>{m.value}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// 3. BEST CAMPAIGN CARD
// ════════════════════════════════════════════════════════════════
export function BestCampaignCard({ campaigns }: { campaigns: Campaign[] }) {
  if (!campaigns.length) return null;

  // Best by ROAS
  const best = [...campaigns].sort((a, b) => b.roas - a.roas)[0];
  const cpl = best.leads > 0 ? best.spend / best.leads : 0;
  const avgROAS = campaigns.reduce((s, c) => s + c.roas, 0) / campaigns.length;
  const roasVsAvg = avgROAS > 0 ? ((best.roas - avgROAS) / avgROAS * 100).toFixed(0) : "0";

  return (
    <div style={{
      background: "linear-gradient(135deg, hsl(142, 71%, 45% / 0.08), hsl(214, 100%, 60% / 0.05))",
      border: "1px solid hsl(142, 71%, 45% / 0.2)",
      borderRadius: "12px", padding: "16px", position: "relative", overflow: "hidden",
    }}>
      {/* Glow accent */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: "2px",
        background: "linear-gradient(90deg, hsl(142, 71%, 45%), hsl(214, 100%, 60%))",
      }} />

      <div className="flex items-center gap-2 mb-3">
        <Crown size={16} style={{ color: COLORS.amber }} />
        <span style={{ color: COLORS.amber, fontSize: "11px", fontWeight: 700, letterSpacing: "0.05em" }}>
          BEST CAMPAIGN
        </span>
        <span style={{
          marginLeft: "auto", fontSize: "9px", fontWeight: 600, padding: "2px 8px", borderRadius: "4px",
          background: "hsl(142, 71%, 45% / 0.15)", color: COLORS.green, border: "1px solid hsl(142, 71%, 45% / 0.3)",
        }}>
          +{roasVsAvg}% vs avg
        </span>
      </div>

      <p style={{ color: "hsl(214, 30%, 94%)", fontSize: "14px", fontWeight: 700, marginBottom: "4px" }}>{best.name}</p>
      <p style={{ color: "hsl(215, 18%, 52%)", fontSize: "11px", marginBottom: "14px" }}>{best.objective} · {best.status}</p>

      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "ROAS", value: `${best.roas.toFixed(1)}x`, color: COLORS.green },
          { label: "CTR", value: `${best.ctr.toFixed(2)}%`, color: COLORS.blue },
          { label: "CPL", value: cpl > 0 ? `₹${cpl.toFixed(0)}` : "N/A", color: COLORS.amber },
          { label: "Spend", value: `₹${(best.spend / 1000).toFixed(1)}K`, color: COLORS.cyan },
        ].map(m => (
          <div key={m.label} style={{
            background: "hsl(220, 25%, 10% / 0.6)", borderRadius: "8px", padding: "10px",
            border: "1px solid hsl(220, 25%, 14%)",
          }}>
            <p style={{ color: "hsl(215, 18%, 52%)", fontSize: "9px", fontWeight: 600, letterSpacing: "0.05em", marginBottom: "4px" }}>{m.label}</p>
            <p style={{ color: m.color, fontSize: "16px", fontWeight: 800, fontFamily: "'JetBrains Mono', monospace" }}>{m.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// 4. BEST CREATIVE (TOP AD) CARD
// ════════════════════════════════════════════════════════════════
export function BestCreativeCard({ campaigns }: { campaigns: Campaign[] }) {
  // Find the best performing ad across all campaigns
  let bestAd: { name: string; thumbnail: string; roas: number; ctr: number; cpc: number; engagementScore: number; spend: number; campaignName: string } | null = null;

  campaigns.forEach(c => {
    c.adSets.forEach(as => {
      as.ads.forEach(ad => {
        if (!bestAd || ad.roas > bestAd.roas) {
          bestAd = {
            name: ad.name, thumbnail: ad.thumbnail, roas: ad.roas,
            ctr: ad.ctr, cpc: ad.cpc, engagementScore: ad.engagementScore,
            spend: ad.spend, campaignName: c.name,
          };
        }
      });
    });
  });

  if (!bestAd) return null;
  const ad = bestAd!;

  return (
    <div style={{
      background: "linear-gradient(135deg, hsl(280, 68%, 60% / 0.08), hsl(330, 80%, 60% / 0.05))",
      border: "1px solid hsl(280, 68%, 60% / 0.2)",
      borderRadius: "12px", padding: "16px", position: "relative", overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: "2px",
        background: "linear-gradient(90deg, hsl(280, 68%, 60%), hsl(330, 80%, 60%))",
      }} />

      <div className="flex items-center gap-2 mb-3">
        <Star size={16} style={{ color: COLORS.purple }} />
        <span style={{ color: COLORS.purple, fontSize: "11px", fontWeight: 700, letterSpacing: "0.05em" }}>
          BEST CREATIVE
        </span>
        <span style={{
          marginLeft: "auto", fontSize: "9px", fontWeight: 600, padding: "2px 8px", borderRadius: "4px",
          background: "hsl(142, 71%, 45% / 0.15)", color: COLORS.green, border: "1px solid hsl(142, 71%, 45% / 0.3)",
        }}>
          {ad.engagementScore}/100 score
        </span>
      </div>

      {/* Thumbnail + info */}
      <div className="flex gap-3 mb-3">
        <img
          src={ad.thumbnail}
          alt={ad.name}
          style={{
            width: "64px", height: "48px", borderRadius: "8px", objectFit: "cover",
            border: "1px solid hsl(220, 25%, 18%)",
          }}
        />
        <div className="flex-1 min-w-0">
          <p style={{ color: "hsl(214, 30%, 94%)", fontSize: "13px", fontWeight: 600, marginBottom: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {ad.name}
          </p>
          <p style={{ color: "hsl(215, 18%, 52%)", fontSize: "10px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {ad.campaignName}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {[
          { label: "ROAS", value: `${ad.roas.toFixed(1)}x`, color: COLORS.green },
          { label: "CTR", value: `${ad.ctr.toFixed(2)}%`, color: COLORS.blue },
          { label: "CPC", value: `₹${ad.cpc.toFixed(1)}`, color: COLORS.amber },
          { label: "Spend", value: `₹${(ad.spend / 1000).toFixed(1)}K`, color: COLORS.cyan },
        ].map(m => (
          <div key={m.label} style={{
            background: "hsl(220, 25%, 10% / 0.6)", borderRadius: "6px", padding: "8px",
            border: "1px solid hsl(220, 25%, 14%)",
          }}>
            <p style={{ color: "hsl(215, 18%, 52%)", fontSize: "9px", fontWeight: 600, letterSpacing: "0.05em", marginBottom: "2px" }}>{m.label}</p>
            <p style={{ color: m.color, fontSize: "14px", fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>{m.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// 5. SPEND & ROAS TREND CHART
// ════════════════════════════════════════════════════════════════
export function SpendROASTrend({ campaigns }: { campaigns: Campaign[] }) {
  // Aggregate daily metrics across all campaigns
  const dailyMap: Record<string, { spend: number; revenue: number }> = {};
  campaigns.forEach(c => {
    c.dailyMetrics.forEach(d => {
      if (!dailyMap[d.date]) dailyMap[d.date] = { spend: 0, revenue: 0 };
      dailyMap[d.date].spend += d.spend;
      dailyMap[d.date].revenue += d.spend * c.roas; // approximate revenue
    });
  });

  const data = Object.entries(dailyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({
      date: date.slice(5),
      Spend: v.spend,
      ROAS: v.spend > 0 ? +(v.revenue / v.spend).toFixed(2) : 0,
    }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="spendTrendGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={COLORS.blue} stopOpacity={0.35} />
            <stop offset="100%" stopColor={COLORS.blue} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="roasTrendGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={COLORS.green} stopOpacity={0.35} />
            <stop offset="100%" stopColor={COLORS.green} stopOpacity={0} />
          </linearGradient>
          <filter id="glowB"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          <filter id="glowG"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 25% 14% / 0.5)" vertical={false} />
        <XAxis dataKey="date" tick={{ fill: "hsl(215 18% 52%)", fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis yAxisId="left" tick={{ fill: "hsl(215 18% 52%)", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} />
        <YAxis yAxisId="right" orientation="right" tick={{ fill: "hsl(215 18% 52%)", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}x`} domain={[0, 'auto']} />
        <RechartsTooltip
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null;
            return (
              <div style={{
                background: "linear-gradient(135deg, hsl(220 35% 10% / 0.98), hsl(220 30% 8% / 0.98))",
                border: "1px solid hsl(214 100% 60% / 0.3)", borderRadius: "12px",
                padding: "10px 14px", boxShadow: "0 8px 32px hsl(222 47% 2% / 0.6)",
              }}>
                <p style={{ color: "hsl(215 18% 52%)", fontSize: "11px", marginBottom: "6px" }}>{label}</p>
                {payload.map((p: any, i: number) => (
                  <div key={i} className="flex items-center gap-2 mb-1">
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: p.color, boxShadow: `0 0 6px ${p.color}` }} />
                    <span style={{ color: "hsl(215 20% 65%)", fontSize: "11px" }}>{p.name}</span>
                    <span style={{ color: "hsl(214 30% 94%)", fontSize: "12px", fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>
                      {p.name === "Spend" ? `₹${Number(p.value).toLocaleString("en-IN")}` : `${p.value}x`}
                    </span>
                  </div>
                ))}
              </div>
            );
          }}
        />
        <Area yAxisId="left" type="monotone" dataKey="Spend" stroke={COLORS.blue} strokeWidth={2.5} fill="url(#spendTrendGrad)" filter="url(#glowB)"
          activeDot={{ r: 5, fill: COLORS.blue, stroke: "hsl(220 35% 9%)", strokeWidth: 3 }} />
        <Area yAxisId="right" type="monotone" dataKey="ROAS" stroke={COLORS.green} strokeWidth={2.5} fill="url(#roasTrendGrad)" filter="url(#glowG)"
          activeDot={{ r: 5, fill: COLORS.green, stroke: "hsl(220 35% 9%)", strokeWidth: 3 }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ════════════════════════════════════════════════════════════════
// 6. CAMPAIGN SPEND BREAKDOWN BAR
// ════════════════════════════════════════════════════════════════
export function CampaignSpendBar({ campaigns }: { campaigns: Campaign[] }) {
  const BAR_COLORS = [COLORS.blue, COLORS.green, COLORS.amber, COLORS.purple, COLORS.cyan, COLORS.pink, COLORS.red];
  const data = [...campaigns].sort((a, b) => b.spend - a.spend).slice(0, 6).map((c, i) => ({
    name: c.name.length > 16 ? c.name.slice(0, 14) + "…" : c.name,
    spend: c.spend,
    roas: c.roas,
    color: BAR_COLORS[i % BAR_COLORS.length],
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <defs>
          {data.map((d, i) => (
            <linearGradient key={i} id={`barG${i}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={d.color} stopOpacity={0.8} />
              <stop offset="100%" stopColor={d.color} stopOpacity={1} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 25% 14% / 0.5)" horizontal={false} />
        <XAxis type="number" tick={{ fill: "hsl(215 18% 52%)", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} />
        <YAxis type="category" dataKey="name" tick={{ fill: "hsl(215 18% 52%)", fontSize: 10 }} axisLine={false} tickLine={false} width={110} />
        <RechartsTooltip
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const d = payload[0].payload;
            return (
              <div style={{
                background: "linear-gradient(135deg, hsl(220 35% 10% / 0.98), hsl(220 30% 8% / 0.98))",
                border: "1px solid hsl(214 100% 60% / 0.3)", borderRadius: "12px",
                padding: "10px 14px", boxShadow: "0 8px 32px hsl(222 47% 2% / 0.6)",
              }}>
                <p style={{ color: "hsl(214 30% 94%)", fontSize: "12px", fontWeight: 600 }}>{d.name}</p>
                <p style={{ color: "hsl(215 18% 52%)", fontSize: "11px", marginTop: "4px" }}>
                  Spend: ₹{Number(d.spend).toLocaleString("en-IN")} · ROAS: {d.roas.toFixed(1)}x
                </p>
              </div>
            );
          }}
        />
        <Bar dataKey="spend" radius={[0, 6, 6, 0]} maxBarSize={24}>
          {data.map((d, i) => (
            <Cell key={i} fill={`url(#barG${i})`} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
