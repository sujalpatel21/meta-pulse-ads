import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { DailyMetric, Campaign } from "@/data/mockData";

const CHART_COLORS = [
  "hsl(214, 100%, 60%)",
  "hsl(142, 71%, 45%)",
  "hsl(38, 92%, 50%)",
  "hsl(280, 68%, 60%)",
  "hsl(0, 84%, 60%)",
];

const tooltipStyle = {
  background: "hsl(220, 35%, 9%)",
  border: "1px solid hsl(220, 25%, 14%)",
  borderRadius: "10px",
  color: "hsl(214, 30%, 94%)",
  fontSize: "12px",
};

// ── Spend vs Leads Line Chart ──────────────────────────────────────
export function SpendLeadsChart({ data }: { data: DailyMetric[] }) {
  const formatted = data.map((d) => ({
    date: d.date.slice(5), // MM-DD
    Spend: d.spend,
    Leads: d.leads,
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={formatted} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 25%, 14%)" />
        <XAxis
          dataKey="date"
          tick={{ fill: "hsl(215, 18%, 52%)", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          yAxisId="left"
          tick={{ fill: "hsl(215, 18%, 52%)", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          tick={{ fill: "hsl(215, 18%, 52%)", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(value: number, name: string) => [
            name === "Spend" ? `₹${value.toLocaleString("en-IN")}` : value,
            name,
          ]}
        />
        <Legend
          wrapperStyle={{ fontSize: "12px", color: "hsl(215, 18%, 52%)" }}
        />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="Spend"
          stroke={CHART_COLORS[0]}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 5, fill: CHART_COLORS[0] }}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="Leads"
          stroke={CHART_COLORS[1]}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 5, fill: CHART_COLORS[1] }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ── Campaign Comparison Bar Chart ─────────────────────────────────
export function CampaignBarChart({ campaigns }: { campaigns: Campaign[] }) {
  const data = campaigns.slice(0, 6).map((c) => ({
    name: c.name.length > 20 ? c.name.slice(0, 18) + "…" : c.name,
    Spend: c.spend,
    Leads: c.leads,
    ROAS: c.roas,
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 50 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 25%, 14%)" />
        <XAxis
          dataKey="name"
          tick={{ fill: "hsl(215, 18%, 52%)", fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          angle={-35}
          textAnchor="end"
          height={60}
        />
        <YAxis
          tick={{ fill: "hsl(215, 18%, 52%)", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(value: number, name: string) => [
            name === "Spend" ? `₹${value.toLocaleString("en-IN")}` : value,
            name,
          ]}
        />
        <Legend wrapperStyle={{ fontSize: "12px", color: "hsl(215, 18%, 52%)" }} />
        <Bar dataKey="Spend" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} />
        <Bar dataKey="Leads" fill={CHART_COLORS[1]} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── Spend Distribution Pie Chart ──────────────────────────────────
export function SpendPieChart({ campaigns }: { campaigns: Campaign[] }) {
  const data = campaigns.map((c) => ({
    name: c.name.length > 22 ? c.name.slice(0, 20) + "…" : c.name,
    value: c.spend,
  }));

  const total = data.reduce((s, d) => s + d.value, 0);

  const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: {
    cx: number; cy: number; midAngle: number;
    innerRadius: number; outerRadius: number; percent: number;
  }) => {
    if (percent < 0.08) return null;
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={10} fontWeight={600}>
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          outerRadius={95}
          innerRadius={50}
          dataKey="value"
          labelLine={false}
          label={renderLabel}
        >
          {data.map((_, index) => (
            <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} stroke="transparent" />
          ))}
        </Pie>
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(value: number) => [
            `₹${value.toLocaleString("en-IN")} (${((value / total) * 100).toFixed(1)}%)`,
            "Spend",
          ]}
        />
        <Legend
          wrapperStyle={{ fontSize: "11px", color: "hsl(215, 18%, 52%)" }}
          iconSize={8}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

// ── Mini Sparkline (used in tables) ──────────────────────────────
export function SparkLine({ data, color = CHART_COLORS[0] }: { data: number[]; color?: string }) {
  const formatted = data.map((v, i) => ({ i, v }));
  return (
    <ResponsiveContainer width={80} height={32}>
      <LineChart data={formatted}>
        <Line type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
