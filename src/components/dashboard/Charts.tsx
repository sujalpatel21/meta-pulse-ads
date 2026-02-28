import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadialBarChart, RadialBar, Legend,
} from "recharts";
import { DailyMetric, Campaign } from "@/data/mockData";

// ── Premium color palette ──
const COLORS = {
  blue: "hsl(214, 100%, 60%)",
  blueDim: "hsl(214, 80%, 45%)",
  green: "hsl(142, 71%, 45%)",
  greenDim: "hsl(142, 50%, 35%)",
  amber: "hsl(38, 92%, 50%)",
  purple: "hsl(280, 68%, 60%)",
  red: "hsl(0, 84%, 60%)",
  cyan: "hsl(190, 90%, 50%)",
  pink: "hsl(330, 80%, 60%)",
};

const PIE_COLORS = [COLORS.blue, COLORS.green, COLORS.amber, COLORS.purple, COLORS.cyan, COLORS.pink, COLORS.red];

// ── Custom Tooltip ──
function CustomTooltip({ active, payload, label, currency = true }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "linear-gradient(135deg, hsl(220 35% 10% / 0.98), hsl(220 30% 8% / 0.98))",
      border: "1px solid hsl(214 100% 60% / 0.3)",
      borderRadius: "12px",
      padding: "12px 16px",
      boxShadow: "0 8px 32px hsl(222 47% 2% / 0.6), 0 0 20px hsl(214 100% 60% / 0.1)",
      backdropFilter: "blur(12px)",
    }}>
      <p style={{ color: "hsl(215 18% 52%)", fontSize: "11px", marginBottom: "8px", fontWeight: 500 }}>{label}</p>
      {payload.map((entry: any, i: number) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
          <div style={{
            width: "8px", height: "8px", borderRadius: "50%",
            background: entry.color,
            boxShadow: `0 0 6px ${entry.color}`,
          }} />
          <span style={{ color: "hsl(215 20% 65%)", fontSize: "12px", minWidth: "50px" }}>{entry.name}</span>
          <span style={{ color: "hsl(214 30% 94%)", fontSize: "12px", fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>
            {currency && entry.name === "Spend" ? `₹${Number(entry.value).toLocaleString("en-IN")}` : Number(entry.value).toLocaleString("en-IN")}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Spend vs Leads Area Chart ──
export function SpendLeadsChart({ data }: { data: DailyMetric[] }) {
  const formatted = data.map((d) => ({
    date: d.date.slice(5),
    Spend: d.spend,
    Leads: d.leads,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={formatted} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={COLORS.blue} stopOpacity={0.4} />
            <stop offset="50%" stopColor={COLORS.blue} stopOpacity={0.1} />
            <stop offset="100%" stopColor={COLORS.blue} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="leadsGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={COLORS.green} stopOpacity={0.4} />
            <stop offset="50%" stopColor={COLORS.green} stopOpacity={0.1} />
            <stop offset="100%" stopColor={COLORS.green} stopOpacity={0} />
          </linearGradient>
          <filter id="glowBlue">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="glowGreen">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 25% 14% / 0.5)" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fill: "hsl(215 18% 52%)", fontSize: 11 }}
          axisLine={false} tickLine={false}
        />
        <YAxis
          yAxisId="left"
          tick={{ fill: "hsl(215 18% 52%)", fontSize: 11 }}
          axisLine={false} tickLine={false}
          tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`}
        />
        <YAxis
          yAxisId="right" orientation="right"
          tick={{ fill: "hsl(215 18% 52%)", fontSize: 11 }}
          axisLine={false} tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          yAxisId="left" type="monotone" dataKey="Spend"
          stroke={COLORS.blue} strokeWidth={2.5}
          fill="url(#spendGradient)" filter="url(#glowBlue)"
          activeDot={{ r: 6, fill: COLORS.blue, stroke: "hsl(220 35% 9%)", strokeWidth: 3 }}
        />
        <Area
          yAxisId="right" type="monotone" dataKey="Leads"
          stroke={COLORS.green} strokeWidth={2.5}
          fill="url(#leadsGradient)" filter="url(#glowGreen)"
          activeDot={{ r: 6, fill: COLORS.green, stroke: "hsl(220 35% 9%)", strokeWidth: 3 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ── Campaign Performance Bar Chart ──
export function CampaignBarChart({ campaigns }: { campaigns: Campaign[] }) {
  const data = campaigns.slice(0, 8).map((c) => ({
    name: c.name.length > 18 ? c.name.slice(0, 16) + "…" : c.name,
    Spend: c.spend,
    Leads: c.leads,
    ROAS: c.roas,
  }));

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 60 }} barGap={4}>
        <defs>
          <linearGradient id="barSpend" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={COLORS.blue} stopOpacity={1} />
            <stop offset="100%" stopColor={COLORS.blueDim} stopOpacity={0.8} />
          </linearGradient>
          <linearGradient id="barLeads" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={COLORS.green} stopOpacity={1} />
            <stop offset="100%" stopColor={COLORS.greenDim} stopOpacity={0.8} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 25% 14% / 0.5)" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fill: "hsl(215 18% 52%)", fontSize: 10 }}
          axisLine={false} tickLine={false}
          angle={-40} textAnchor="end" height={70}
        />
        <YAxis
          tick={{ fill: "hsl(215 18% 52%)", fontSize: 11 }}
          axisLine={false} tickLine={false}
          tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="Spend" fill="url(#barSpend)" radius={[6, 6, 0, 0]} maxBarSize={40} />
        <Bar dataKey="Leads" fill="url(#barLeads)" radius={[6, 6, 0, 0]} maxBarSize={40} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── Spend Distribution Donut Chart ──
export function SpendPieChart({ campaigns }: { campaigns: Campaign[] }) {
  const data = campaigns.map((c) => ({
    name: c.name.length > 20 ? c.name.slice(0, 18) + "…" : c.name,
    value: c.spend,
  }));
  const total = data.reduce((s, d) => s + d.value, 0);

  const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.08) return null;
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central"
        fontSize={11} fontWeight={700} style={{ textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}>
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <defs>
            {PIE_COLORS.map((color, i) => (
              <linearGradient key={i} id={`pieGrad${i}`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={1} />
                <stop offset="100%" stopColor={color} stopOpacity={0.7} />
              </linearGradient>
            ))}
          </defs>
          <Pie
            data={data} cx="50%" cy="45%"
            outerRadius={105} innerRadius={60}
            dataKey="value" labelLine={false} label={renderLabel}
            strokeWidth={2} stroke="hsl(220 35% 9%)"
          >
            {data.map((_, index) => (
              <Cell key={index} fill={`url(#pieGrad${index % PIE_COLORS.length})`} />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const val = payload[0].value as number;
              return (
                <div style={{
                  background: "linear-gradient(135deg, hsl(220 35% 10% / 0.98), hsl(220 30% 8% / 0.98))",
                  border: "1px solid hsl(214 100% 60% / 0.3)",
                  borderRadius: "12px", padding: "10px 14px",
                  boxShadow: "0 8px 32px hsl(222 47% 2% / 0.6)",
                }}>
                  <p style={{ color: "hsl(214 30% 94%)", fontSize: "12px", fontWeight: 600 }}>{payload[0].name}</p>
                  <p style={{ color: "hsl(215 18% 52%)", fontSize: "11px", marginTop: "4px" }}>
                    ₹{val.toLocaleString("en-IN")} · {((val / total) * 100).toFixed(1)}%
                  </p>
                </div>
              );
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      {/* Center label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" style={{ top: "-10%" }}>
        <span style={{ color: "hsl(215 18% 52%)", fontSize: "10px", fontWeight: 500 }}>TOTAL</span>
        <span style={{ color: "hsl(214 30% 94%)", fontSize: "16px", fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>
          ₹{(total / 1000).toFixed(0)}K
        </span>
      </div>
      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 -mt-4">
        {data.slice(0, 6).map((d, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length], boxShadow: `0 0 6px ${PIE_COLORS[i % PIE_COLORS.length]}` }} />
            <span style={{ color: "hsl(215 18% 52%)", fontSize: "10px" }}>{d.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── ROAS Radial Gauge ──
export function ROASGauge({ campaigns }: { campaigns: Campaign[] }) {
  const totalSpend = campaigns.reduce((s, c) => s + c.spend, 0);
  const totalPurchaseValue = campaigns.reduce((s, c) => s + (c.roas * c.spend), 0);
  const avgROAS = totalSpend > 0 ? totalPurchaseValue / totalSpend : 0;
  const gaugePercent = Math.min((avgROAS / 5) * 100, 100); // 5x as max

  const data = [{ name: "ROAS", value: gaugePercent, fill: avgROAS >= 2 ? COLORS.green : avgROAS >= 1 ? COLORS.amber : COLORS.red }];

  return (
    <div className="relative flex flex-col items-center">
      <ResponsiveContainer width="100%" height={180}>
        <RadialBarChart
          cx="50%" cy="100%" innerRadius="70%" outerRadius="100%"
          startAngle={180} endAngle={0}
          data={data} barSize={12}
        >
          <defs>
            <linearGradient id="roasGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={data[0].fill} stopOpacity={0.6} />
              <stop offset="100%" stopColor={data[0].fill} stopOpacity={1} />
            </linearGradient>
          </defs>
          <RadialBar
            dataKey="value"
            cornerRadius={8}
            fill="url(#roasGrad)"
            background={{ fill: "hsl(220 25% 14%)" }}
          />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute bottom-4 text-center">
        <span style={{ color: "hsl(214 30% 94%)", fontSize: "24px", fontWeight: 800, fontFamily: "'JetBrains Mono', monospace" }}>
          {avgROAS.toFixed(2)}x
        </span>
        <p style={{ color: "hsl(215 18% 52%)", fontSize: "10px", fontWeight: 500, marginTop: "2px" }}>AVG ROAS</p>
      </div>
    </div>
  );
}

// ── Performance Summary Cards Row ──
export function PerformanceSummary({ campaigns }: { campaigns: Campaign[] }) {
  const total = campaigns.reduce((acc, c) => ({
    spend: acc.spend + c.spend,
    impressions: acc.impressions + c.impressions,
    clicks: acc.clicks + c.clicks,
    leads: acc.leads + c.leads,
  }), { spend: 0, impressions: 0, clicks: 0, leads: 0 });

  const cpl = total.leads > 0 ? total.spend / total.leads : 0;
  const cpc = total.clicks > 0 ? total.spend / total.clicks : 0;
  const ctr = total.impressions > 0 ? (total.clicks / total.impressions * 100) : 0;

  const metrics = [
    { label: "Cost/Lead", value: `₹${cpl.toFixed(0)}`, color: COLORS.amber, icon: "🎯" },
    { label: "CPC", value: `₹${cpc.toFixed(1)}`, color: COLORS.blue, icon: "👆" },
    { label: "CTR", value: `${ctr.toFixed(2)}%`, color: COLORS.green, icon: "📊" },
    { label: "Active", value: `${campaigns.filter(c => c.status === "Active").length}/${campaigns.length}`, color: COLORS.cyan, icon: "⚡" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {metrics.map((m, i) => (
        <div key={i} className="chart-card p-4 flex items-center gap-3 group hover:border-[hsl(214,100%,60%,0.3)] transition-all">
          <div className="text-xl">{m.icon}</div>
          <div>
            <p style={{ color: "hsl(215 18% 52%)", fontSize: "11px", fontWeight: 500 }}>{m.label}</p>
            <p style={{ color: m.color, fontSize: "18px", fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>{m.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Mini Sparkline ──
export function SparkLine({ data, color = COLORS.blue }: { data: number[]; color?: string }) {
  const formatted = data.map((v, i) => ({ i, v }));
  return (
    <ResponsiveContainer width={80} height={32}>
      <AreaChart data={formatted}>
        <defs>
          <linearGradient id={`spark-${color.replace(/[^a-z0-9]/gi, "")}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} fill={`url(#spark-${color.replace(/[^a-z0-9]/gi, "")})`} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
