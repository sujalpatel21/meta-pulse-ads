import { ABTest } from "@/data/mockData";
import { formatINR } from "@/services/metaService";
import { Trophy, Clock, FileEdit, ChevronDown, ChevronUp } from "lucide-react";

interface ABTestCardProps {
    test: ABTest;
    expanded: boolean;
    onToggle: () => void;
}

function StatusBadge({ status }: { status: ABTest["status"] }) {
    const config = {
        Running: {
            bg: "hsl(214 100% 60% / 0.15)",
            color: "hsl(214 100% 70%)",
            border: "hsl(214 100% 60% / 0.3)",
            icon: <Clock size={12} />,
        },
        Completed: {
            bg: "hsl(142 71% 45% / 0.15)",
            color: "hsl(142 71% 55%)",
            border: "hsl(142 71% 45% / 0.3)",
            icon: <Trophy size={12} />,
        },
        Draft: {
            bg: "hsl(var(--muted) / 0.5)",
            color: "hsl(var(--muted-foreground))",
            border: "hsl(var(--border))",
            icon: <FileEdit size={12} />,
        },
    };
    const c = config[status];

    return (
        <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
            style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}` }}
        >
            {c.icon}
            {status}
        </span>
    );
}

function MetricPill({ label, valueA, valueB, format = "number", winner }: {
    label: string;
    valueA: number;
    valueB: number;
    format?: "number" | "percent" | "currency";
    winner?: "A" | "B" | null;
}) {
    const fmt = (v: number) => {
        if (format === "currency") return formatINR(v);
        if (format === "percent") return `${v.toFixed(2)}%`;
        return v >= 1000 ? `${(v / 1000).toFixed(1)}K` : v.toFixed(v < 10 ? 2 : 0);
    };

    return (
        <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-medium uppercase tracking-wider" style={{ color: "hsl(var(--muted-foreground))" }}>
                {label}
            </span>
            <div className="flex items-center gap-3">
                <span className={`text-sm font-semibold ${winner === "A" ? "text-emerald-400" : ""}`} style={winner !== "A" ? { color: "hsl(var(--foreground))" } : {}}>
                    {fmt(valueA)}
                </span>
                <span className="text-[10px]" style={{ color: "hsl(var(--muted-foreground))" }}>vs</span>
                <span className={`text-sm font-semibold ${winner === "B" ? "text-emerald-400" : ""}`} style={winner !== "B" ? { color: "hsl(var(--foreground))" } : {}}>
                    {fmt(valueB)}
                </span>
            </div>
        </div>
    );
}

export default function ABTestCard({ test, expanded, onToggle }: ABTestCardProps) {
    const [a, b] = test.variants;
    const winnerLabel = test.winnerId
        ? test.variants.find((v) => v.variantId === test.winnerId)?.variantLabel || null
        : null;

    return (
        <div
            className="chart-card transition-all duration-300 hover:shadow-lg cursor-pointer"
            style={{ borderColor: expanded ? "hsl(214 100% 60% / 0.4)" : undefined }}
            onClick={onToggle}
        >
            {/* Header */}
            <div className="p-5 pb-3">
                <div className="flex items-start justify-between mb-3">
                    <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-semibold text-foreground truncate">{test.testName}</h3>
                        <p className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
                            {test.campaignName} · {test.metric} test
                        </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-3">
                        <StatusBadge status={test.status} />
                        {expanded ? (
                            <ChevronUp size={16} style={{ color: "hsl(var(--muted-foreground))" }} />
                        ) : (
                            <ChevronDown size={16} style={{ color: "hsl(var(--muted-foreground))" }} />
                        )}
                    </div>
                </div>

                {/* Variant Thumbnails */}
                <div className="flex items-center gap-4 mb-4">
                    {test.variants.map((v) => (
                        <div key={v.variantId} className="flex items-center gap-2">
                            <div className="relative">
                                <img
                                    src={v.thumbnail}
                                    alt={v.adName}
                                    className="w-12 h-9 rounded-md object-cover"
                                    style={{ border: "1px solid hsl(var(--border))" }}
                                />
                                {test.winnerId === v.variantId && (
                                    <div
                                        className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center"
                                        style={{ background: "hsl(142 71% 45%)" }}
                                    >
                                        <Trophy size={8} className="text-white" />
                                    </div>
                                )}
                            </div>
                            <div>
                                <span
                                    className="text-xs font-bold px-1.5 py-0.5 rounded"
                                    style={{
                                        background: v.variantLabel === "A" ? "hsl(214 100% 60% / 0.15)" : "hsl(280 100% 60% / 0.15)",
                                        color: v.variantLabel === "A" ? "hsl(214 100% 70%)" : "hsl(280 100% 70%)",
                                    }}
                                >
                                    {v.variantLabel}
                                </span>
                                <p className="text-[11px] mt-0.5 truncate max-w-[120px]" style={{ color: "hsl(var(--muted-foreground))" }}>
                                    {v.adName}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Quick Metrics */}
                <div className="grid grid-cols-4 gap-3">
                    <MetricPill label="CTR" valueA={a.ctr} valueB={b.ctr} format="percent" winner={winnerLabel as "A" | "B" | null} />
                    <MetricPill label="CPC" valueA={a.cpc} valueB={b.cpc} format="currency" winner={winnerLabel as "A" | "B" | null} />
                    <MetricPill label="ROAS" valueA={a.roas} valueB={b.roas} winner={winnerLabel as "A" | "B" | null} />
                    <MetricPill label="Leads" valueA={a.leads} valueB={b.leads} winner={winnerLabel as "A" | "B" | null} />
                </div>
            </div>

            {/* Confidence bar */}
            {test.status !== "Draft" && (
                <div className="px-5 pb-4 pt-1">
                    <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-medium" style={{ color: "hsl(var(--muted-foreground))" }}>
                            Statistical Confidence
                        </span>
                        <span
                            className="text-xs font-bold"
                            style={{
                                color: test.confidence >= 90
                                    ? "hsl(142 71% 55%)"
                                    : test.confidence >= 70
                                        ? "hsl(45 93% 58%)"
                                        : "hsl(var(--muted-foreground))",
                            }}
                        >
                            {test.confidence}%
                        </span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "hsl(var(--muted))" }}>
                        <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                                width: `${test.confidence}%`,
                                background: test.confidence >= 90
                                    ? "hsl(142 71% 45%)"
                                    : test.confidence >= 70
                                        ? "hsl(45 93% 50%)"
                                        : "hsl(214 100% 60%)",
                            }}
                        />
                    </div>
                </div>
            )}

            {/* Winner Banner */}
            {test.winnerId && test.status === "Completed" && (
                <div
                    className="mx-5 mb-4 px-3 py-2 rounded-lg flex items-center gap-2 text-xs"
                    style={{
                        background: "hsl(142 71% 45% / 0.1)",
                        border: "1px solid hsl(142 71% 45% / 0.25)",
                    }}
                >
                    <Trophy size={13} className="text-emerald-400 shrink-0" />
                    <span style={{ color: "hsl(142 71% 65%)" }}>
                        <strong>Variant {winnerLabel}</strong> wins with {test.confidence}% confidence on {test.metric}
                    </span>
                </div>
            )}
        </div>
    );
}
