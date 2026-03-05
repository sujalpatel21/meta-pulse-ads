import { useState, useMemo } from "react";
import { ABTest } from "@/data/mockData";
import ABTestCard from "./ABTestCard";
import ABTestCompare from "./ABTestCompare";
import { Search, FlaskConical } from "lucide-react";

interface ABTestListProps {
    tests: ABTest[];
    loading: boolean;
}

const STATUS_FILTERS = ["All", "Running", "Completed", "Draft"] as const;

export default function ABTestList({ tests, loading }: ABTestListProps) {
    const [statusFilter, setStatusFilter] = useState<string>("All");
    const [search, setSearch] = useState("");
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const filtered = useMemo(() => {
        return tests.filter((t) => {
            const matchStatus = statusFilter === "All" || t.status === statusFilter;
            const matchSearch =
                search === "" ||
                t.testName.toLowerCase().includes(search.toLowerCase()) ||
                t.campaignName.toLowerCase().includes(search.toLowerCase());
            return matchStatus && matchSearch;
        });
    }, [tests, statusFilter, search]);

    const counts = useMemo(() => ({
        All: tests.length,
        Running: tests.filter((t) => t.status === "Running").length,
        Completed: tests.filter((t) => t.status === "Completed").length,
        Draft: tests.filter((t) => t.status === "Draft").length,
    }), [tests]);

    if (loading) {
        return (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="chart-card h-[260px] animate-pulse" style={{ background: "hsl(var(--muted) / 0.3)" }} />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 p-1 rounded-lg" style={{
                    background: "hsl(var(--muted) / 0.3)",
                    border: "1px solid hsl(var(--border) / 0.5)",
                }}>
                    {STATUS_FILTERS.map((s) => (
                        <button
                            key={s}
                            onClick={() => setStatusFilter(s)}
                            className="px-3 py-1.5 rounded-md text-xs font-medium transition-all"
                            style={{
                                background: statusFilter === s ? "hsl(var(--brand) / 0.15)" : "transparent",
                                color: statusFilter === s ? "hsl(var(--brand))" : "hsl(var(--muted-foreground))",
                                border: statusFilter === s ? "1px solid hsl(var(--brand) / 0.3)" : "1px solid transparent",
                            }}
                        >
                            {s}
                            <span className="ml-1.5 opacity-60">({counts[s as keyof typeof counts]})</span>
                        </button>
                    ))}
                </div>

                <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "hsl(var(--muted-foreground))" }} />
                    <input
                        type="text"
                        placeholder="Search tests..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 pr-4 py-2 rounded-lg text-xs w-64 outline-none transition-all focus:ring-1"
                        style={{
                            background: "hsl(var(--muted) / 0.3)",
                            border: "1px solid hsl(var(--border))",
                            color: "hsl(var(--foreground))",
                        }}
                    />
                </div>
            </div>

            {/* Empty State */}
            {filtered.length === 0 && (
                <div className="chart-card p-12 text-center">
                    <FlaskConical size={40} className="mx-auto mb-3" style={{ color: "hsl(var(--muted-foreground))" }} />
                    <h3 className="text-sm font-semibold mb-1" style={{ color: "hsl(var(--foreground))" }}>
                        No tests found
                    </h3>
                    <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                        {search ? "Try adjusting your search query" : "No A/B tests match the selected filter"}
                    </p>
                </div>
            )}

            {/* Test Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filtered.map((test) => (
                    <div key={test.testId}>
                        <ABTestCard
                            test={test}
                            expanded={expandedId === test.testId}
                            onToggle={() => setExpandedId(expandedId === test.testId ? null : test.testId)}
                        />
                        {expandedId === test.testId && (
                            <div className="mt-0 -translate-y-[1px]">
                                <ABTestCompare test={test} />
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
