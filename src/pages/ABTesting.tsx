import { useState, useEffect } from "react";
import { useDashboard } from "@/components/layout/Layout";
import { fetchABTests, getDateRangeFromPreset } from "@/services/metaService";
import { ABTest } from "@/data/mockData";
import ABTestList from "@/components/ab-testing/ABTestList";
import WinnerCreatives from "@/components/ab-testing/WinnerCreatives";
import { FlaskConical, TrendingUp, Trophy, Clock } from "lucide-react";

export default function ABTesting() {
    const { selectedAccount, campaignsLoading, apiError, dateRange } = useDashboard();
    const [tests, setTests] = useState<ABTest[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!selectedAccount) return;
        setLoading(true);
        const dr = getDateRangeFromPreset(dateRange);
        fetchABTests(selectedAccount.accountId, dr)
            .then(setTests)
            .catch(() => setTests([]))
            .finally(() => setLoading(false));
    }, [selectedAccount?.accountId, dateRange]);

    const runningCount = tests.filter((t) => t.status === "Running").length;
    const completedCount = tests.filter((t) => t.status === "Completed").length;
    const avgConfidence =
        tests.filter((t) => t.status !== "Draft").length > 0
            ? Math.round(
                tests
                    .filter((t) => t.status !== "Draft")
                    .reduce((s, t) => s + t.confidence, 0) /
                tests.filter((t) => t.status !== "Draft").length
            )
            : 0;

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Page Header */}
            <div className="flex items-end justify-between">
                <div>
                    <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
                        <FlaskConical size={22} style={{ color: "hsl(var(--brand))" }} />
                        A/B Testing
                    </h1>
                    <p className="text-sm mt-0.5 text-muted-foreground">
                        Compare creative variants and find winning ads using Meta API insights
                    </p>
                </div>
                {!loading && tests.length > 0 && (
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-[hsl(var(--metric-positive))] animate-pulse" />
                        <span className="text-xs text-muted-foreground">
                            {tests.length} tests tracked
                        </span>
                    </div>
                )}
            </div>

            {/* API Error */}
            {apiError && (
                <div
                    className="p-3 rounded-lg text-sm"
                    style={{
                        background: "hsl(0 84% 50% / 0.1)",
                        color: "hsl(0 84% 60%)",
                        border: "1px solid hsl(0 84% 50% / 0.2)",
                    }}
                >
                    ⚠️ API Error: {apiError} — Showing fallback data
                </div>
            )}

            {/* Summary KPI Strip */}
            {!loading && tests.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="chart-card p-4 flex items-center gap-3">
                        <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                            style={{ background: "hsl(214 100% 60% / 0.15)" }}
                        >
                            <Clock size={18} style={{ color: "hsl(214 100% 70%)" }} />
                        </div>
                        <div>
                            <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: "hsl(var(--muted-foreground))" }}>
                                Running Tests
                            </p>
                            <p className="text-xl font-bold" style={{ color: "hsl(var(--foreground))" }}>
                                {runningCount}
                            </p>
                        </div>
                    </div>

                    <div className="chart-card p-4 flex items-center gap-3">
                        <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                            style={{ background: "hsl(142 71% 45% / 0.15)" }}
                        >
                            <Trophy size={18} style={{ color: "hsl(142 71% 55%)" }} />
                        </div>
                        <div>
                            <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: "hsl(var(--muted-foreground))" }}>
                                Completed Tests
                            </p>
                            <p className="text-xl font-bold" style={{ color: "hsl(var(--foreground))" }}>
                                {completedCount}
                            </p>
                        </div>
                    </div>

                    <div className="chart-card p-4 flex items-center gap-3">
                        <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                            style={{ background: "hsl(45 93% 50% / 0.15)" }}
                        >
                            <TrendingUp size={18} style={{ color: "hsl(45 93% 58%)" }} />
                        </div>
                        <div>
                            <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: "hsl(var(--muted-foreground))" }}>
                                Avg Confidence
                            </p>
                            <p className="text-xl font-bold" style={{ color: "hsl(var(--foreground))" }}>
                                {avgConfidence}%
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Winner Creatives */}
            <WinnerCreatives tests={tests} loading={loading || campaignsLoading} />

            {/* Test List */}
            <ABTestList tests={tests} loading={loading || campaignsLoading} />
        </div>
    );
}
