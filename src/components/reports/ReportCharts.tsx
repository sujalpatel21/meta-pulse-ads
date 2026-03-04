import { DailyMetric, Campaign } from "@/data/mockData";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";

interface Props {
  dailyMetrics: DailyMetric[];
  campaigns: Campaign[];
}

const COLORS = [
  "hsl(214, 100%, 60%)",
  "hsl(142, 71%, 45%)",
  "hsl(38, 92%, 50%)",
  "hsl(280, 68%, 60%)",
  "hsl(0, 84%, 60%)",
];

export default function ReportCharts({ dailyMetrics, campaigns }: Props) {
  const pieData = campaigns.map(c => ({ name: c.name.length > 20 ? c.name.slice(0, 20) + "…" : c.name, value: c.spend }));
  const barData = campaigns.map(c => ({
    name: c.name.length > 15 ? c.name.slice(0, 15) + "…" : c.name,
    spend: c.spend,
    leads: c.leads * 100,
    roas: c.roas * 10000,
  }));

  const tooltipStyle = {
    contentStyle: {
      background: "hsl(220, 35%, 9%)",
      border: "1px solid hsl(220, 25%, 14%)",
      borderRadius: "8px",
      fontSize: "11px",
      color: "hsl(214, 30%, 94%)",
    },
  };

  return (
    <div className="grid grid-cols-3 gap-4">
      {/* Spend vs Leads Trend */}
      <div className="chart-card p-4">
        <h3 className="text-xs font-semibold text-foreground mb-3">📈 Spend vs Leads Trend</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={dailyMetrics}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 25%, 14%)" />
            <XAxis dataKey="date" tick={{ fontSize: 9, fill: "hsl(215, 18%, 52%)" }} tickFormatter={v => v.slice(5)} />
            <YAxis tick={{ fontSize: 9, fill: "hsl(215, 18%, 52%)" }} />
            <Tooltip {...tooltipStyle} />
            <Line type="monotone" dataKey="spend" stroke="hsl(214, 100%, 60%)" strokeWidth={2} dot={false} name="Spend (₹)" />
            <Line type="monotone" dataKey="leads" stroke="hsl(142, 71%, 45%)" strokeWidth={2} dot={false} name="Leads" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Campaign Performance Bar */}
      <div className="chart-card p-4">
        <h3 className="text-xs font-semibold text-foreground mb-3">📊 Campaign Spend</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={barData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 25%, 14%)" />
            <XAxis dataKey="name" tick={{ fontSize: 8, fill: "hsl(215, 18%, 52%)" }} />
            <YAxis tick={{ fontSize: 9, fill: "hsl(215, 18%, 52%)" }} />
            <Tooltip {...tooltipStyle} />
            <Bar dataKey="spend" fill="hsl(214, 100%, 60%)" radius={[4, 4, 0, 0]} name="Spend (₹)" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Budget Distribution Pie */}
      <div className="chart-card p-4">
        <h3 className="text-xs font-semibold text-foreground mb-3">🥧 Budget Distribution</h3>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={35} strokeWidth={0}>
              {pieData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip {...tooltipStyle} formatter={(v: number) => `₹${v.toLocaleString("en-IN")}`} />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
          {pieData.map((d, i) => (
            <div key={i} className="flex items-center gap-1 text-[9px] text-muted-foreground">
              <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
              {d.name}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
