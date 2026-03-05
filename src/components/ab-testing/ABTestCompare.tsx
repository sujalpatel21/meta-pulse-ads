import { ABTest, ABTestVariant } from "@/data/mockData";
import { formatINR } from "@/services/metaService";
import {
    ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { Trophy, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface ABTestCompareProps {
    test: ABTest;
}

const VARIANT_COLORS = {
    A: { main: "hsl(214 100% 60%)", bg: "hsl(214 100% 60% / 0.15)", fill: "hsl(214 100% 60% / 0.08)" },
    B: { main: "hsl(280 100% 65%)", bg: "hsl(280 100% 65% / 0.15)", fill: "hsl(280 100% 65% / 0.08)" },
};

function MetricRow({ label, variants, format, metric, winnerId }: {
    label: string;
    variants: ABTestVariant[];
    format: "number" | "percent" | "currency" | "multiplier";
    metric: keyof ABTestVariant;
    winnerId?: string;
}) {
    const values = variants.map((v) => v[metric] as number);
    const maxVal = Math.max(...values);
    const minVal = Math.min(...values);

    const fmt = (val: number) => {
        if (format === "currency") return formatINR(val);
        if (format === "percent") return `${val.toFixed(2)}%`;
        if (format === "multiplier") return `${val.toFixed(1)}x`;
        return val >= 1000 ? `${(val / 1000).toFixed(1)}K` : val.toFixed(0);
    };

    const diff = values.length >= 2 && values[0] > 0
        ? ((values[1] - values[0]) / values[0]) * 100
        : 0;

    // For CPC, lower is better
    const lowerIsBetter = metric === "cpc";

    return (
        <div className="py-3 border-b" style={{ borderColor: "hsl(var(--border) / 0.5)" }}>
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium" style={{ color: "hsl(var(--muted-foreground))" }}>
                    {label}
                </span>
                {Math.abs(diff) > 0.5 && (
                    <span className="flex items-center gap-1 text-[10px] font-semibold"
                        style={{
                            color: (lowerIsBetter ? diff < 0 : diff > 0)
                                ? "hsl(142 71% 55%)"
                                : "hsl(0 84% 60%)",
                        }}
                    >
                        {diff > 0 ? <TrendingUp size={10} /> : diff < 0 ? <TrendingDown size={10} /> : <Minus size={10} />}
                        {Math.abs(diff).toFixed(1)}% {diff > 0 ? "higher" : "lower"} (B vs A)
                    </span>
                )}
            </div>
            <div className="space-y-2">
                {variants.map((v) => {
                    const val = v[metric] as number;
                    const pct = maxVal > 0 ? (val / maxVal) * 100 : 0;
                    const isWinner = winnerId === v.variantId;
                    const colors = VARIANT_COLORS[v.variantLabel as "A" | "B"];

                    return (
                        <div key={v.variantId} className="flex items-center gap-3">
                            <span
                                className="text-[10px] font-bold w-4 text-center shrink-0"
                                style={{ color: colors.main }}
                            >
                                {v.variantLabel}
                            </span>
                            <div className="flex-1 h-6 rounded-md overflow-hidden relative" style={{ background: "hsl(var(--muted) / 0.3)" }}>
                                <div
                                    className="h-full rounded-md transition-all duration-700 flex items-center px-2"
                                    style={{ width: `${Math.max(pct, 8)}%`, background: colors.bg, borderRight: `2px solid ${colors.main}` }}
                                >
                                    <span className="text-[11px] font-semibold whitespace-nowrap" style={{ color: colors.main }}>
                                        {fmt(val)}
                                    </span>
                                </div>
                            </div>
                            {isWinner && (
                                <Trophy size={12} className="text-emerald-400 shrink-0" />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function TrendChart({ test }: { test: ABTest }) {
    // Merge daily metrics for both variants
    const dateMap = new Map<string, any>();
    test.variants.forEach((v) => {
        v.dailyMetrics.forEach((d) => {
            const existing = dateMap.get(d.date) || { date: d.date };
            existing[`ctr_${v.variantLabel}`] = (d.clicks / (d.impressions || 1)) * 100;
            existing[`spend_${v.variantLabel}`] = d.spend;
            dateMap.set(d.date, existing);
        });
    });

    const chartData = Array.from(dateMap.values())
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((d) => ({ ...d, date: d.date.slice(5) })); // MM-DD format

    return (
        <div className="mt-4">
            <h4 className="text-xs font-semibold mb-3" style={{ color: "hsl(var(--foreground))" }}>
                Daily Spend Trend
            </h4>
            <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={chartData}>
                    <defs>
                        <linearGradient id="gradA" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="hsl(214 100% 60%)" stopOpacity={0.3} />
                            <stop offset="100%" stopColor="hsl(214 100% 60%)" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gradB" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="hsl(280 100% 65%)" stopOpacity={0.3} />
                            <stop offset="100%" stopColor="hsl(280 100% 65%)" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} width={45} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} />
                    <Tooltip
                        contentStyle={{
                            background: "hsl(var(--background-card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                            fontSize: "11px",
                        }}
                        labelStyle={{ color: "hsl(var(--foreground))" }}
                    />
                    <Area type="monotone" dataKey="spend_A" stroke="hsl(214 100% 60%)" fill="url(#gradA)" strokeWidth={2} name="Variant A" dot={false} />
                    <Area type="monotone" dataKey="spend_B" stroke="hsl(280 100% 65%)" fill="url(#gradB)" strokeWidth={2} name="Variant B" dot={false} />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}

export default function ABTestCompare({ test }: ABTestCompareProps) {
    const [a, b] = test.variants;

    return (
        <div className="px-5 pb-5 animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="rounded-xl p-4" style={{
                background: "hsl(var(--background) / 0.5)",
                border: "1px solid hsl(var(--border) / 0.5)",
            }}>
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>
                        Detailed Comparison
                    </h4>
                    <div className="flex items-center gap-4">
                        {test.variants.map((v) => {
                            const colors = VARIANT_COLORS[v.variantLabel as "A" | "B"];
                            return (
                                <div key={v.variantId} className="flex items-center gap-1.5">
                                    <div className="w-2.5 h-2.5 rounded-sm" style={{ background: colors.main }} />
                                    <span className="text-[10px] font-medium" style={{ color: "hsl(var(--muted-foreground))" }}>
                                        Variant {v.variantLabel}: {v.adName}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Metric Rows */}
                <MetricRow label="Spend" variants={test.variants} format="currency" metric="spend" winnerId={test.winnerId} />
                <MetricRow label="Impressions" variants={test.variants} format="number" metric="impressions" winnerId={test.winnerId} />
                <MetricRow label="Clicks" variants={test.variants} format="number" metric="clicks" winnerId={test.winnerId} />
                <MetricRow label="CTR" variants={test.variants} format="percent" metric="ctr" winnerId={test.winnerId} />
                <MetricRow label="CPC" variants={test.variants} format="currency" metric="cpc" winnerId={test.winnerId} />
                <MetricRow label="Leads" variants={test.variants} format="number" metric="leads" winnerId={test.winnerId} />
                <MetricRow label="Purchases" variants={test.variants} format="number" metric="purchases" winnerId={test.winnerId} />
                <MetricRow label="ROAS" variants={test.variants} format="multiplier" metric="roas" winnerId={test.winnerId} />
                <MetricRow label="Conversion Rate" variants={test.variants} format="percent" metric="conversionRate" winnerId={test.winnerId} />

                {/* Trend Chart */}
                {test.status !== "Draft" && <TrendChart test={test} />}

                {/* Date Info */}
                <div className="mt-4 flex items-center gap-4 text-[10px]" style={{ color: "hsl(var(--muted-foreground))" }}>
                    <span>Started: {test.startDate}</span>
                    {test.endDate && <span>Ended: {test.endDate}</span>}
                    <span>Primary Metric: {test.metric}</span>
                </div>
            </div>
        </div>
    );
}
