import { MetricKey, METRIC_OPTIONS } from "@/lib/reportEngine";
import { FileText, Calendar, Layers, BarChart3 } from "lucide-react";

interface Props {
  dateRange: string;
  setDateRange: (v: string) => void;
  levels: string[];
  setLevels: (v: string[]) => void;
  selectedMetrics: MetricKey[];
  setSelectedMetrics: (v: MetricKey[]) => void;
  onGenerate: () => void;
  reportGenerated: boolean;
}

const DATE_RANGES = [
  { value: "last7", label: "Last 7 Days" },
  { value: "last14", label: "Last 14 Days" },
  { value: "last30", label: "Last 30 Days" },
  { value: "custom", label: "Custom Range" },
];

const LEVELS = [
  { value: "campaign", label: "Campaign Level" },
  { value: "adset", label: "Ad Set Level" },
  { value: "ad", label: "Ad Level" },
];

export default function ReportGenerator({ dateRange, setDateRange, levels, setLevels, selectedMetrics, setSelectedMetrics, onGenerate, reportGenerated }: Props) {
  const toggleLevel = (v: string) => {
    setLevels(levels.includes(v) ? levels.filter(l => l !== v) : [...levels, v]);
  };

  const toggleMetric = (k: MetricKey) => {
    setSelectedMetrics(
      selectedMetrics.includes(k) ? selectedMetrics.filter(m => m !== k) : [...selectedMetrics, k]
    );
  };

  return (
    <div className="chart-card p-5 space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <FileText size={16} className="text-primary" />
        <h2 className="text-sm font-semibold text-foreground">Report Generator</h2>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Date Range */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Calendar size={12} /> Date Range
          </div>
          <div className="space-y-1">
            {DATE_RANGES.map(d => (
              <button
                key={d.value}
                onClick={() => setDateRange(d.value)}
                className={`w-full text-left text-xs px-3 py-2 rounded-lg transition-all ${
                  dateRange === d.value
                    ? "bg-primary/15 text-primary border border-primary/30"
                    : "bg-card text-muted-foreground hover:bg-muted border border-transparent"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Report Levels */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Layers size={12} /> Report Level
          </div>
          <div className="space-y-1">
            {LEVELS.map(l => (
              <button
                key={l.value}
                onClick={() => toggleLevel(l.value)}
                className={`w-full text-left text-xs px-3 py-2 rounded-lg transition-all flex items-center gap-2 ${
                  levels.includes(l.value)
                    ? "bg-primary/15 text-primary border border-primary/30"
                    : "bg-card text-muted-foreground hover:bg-muted border border-transparent"
                }`}
              >
                <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                  levels.includes(l.value) ? "bg-primary border-primary" : "border-muted-foreground/30"
                }`}>
                  {levels.includes(l.value) && <span className="text-[8px] text-primary-foreground">✓</span>}
                </div>
                {l.label}
              </button>
            ))}
          </div>
        </div>

        {/* Metrics */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <BarChart3 size={12} /> Metrics
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-[140px] overflow-y-auto pr-1">
            {METRIC_OPTIONS.map(m => (
              <button
                key={m.key}
                onClick={() => toggleMetric(m.key)}
                className={`text-[10px] px-2 py-1 rounded-md transition-all ${
                  selectedMetrics.includes(m.key)
                    ? "bg-primary/15 text-primary border border-primary/30"
                    : "bg-card text-muted-foreground hover:bg-muted border border-transparent"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={onGenerate}
        className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
      >
        <FileText size={14} />
        {reportGenerated ? "Regenerate Report" : "Generate Report"}
      </button>
    </div>
  );
}
