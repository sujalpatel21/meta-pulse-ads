import { useState, useMemo } from "react";
import { useDashboard } from "@/components/layout/Layout";
import { computeKPIs, aggregateDailyMetrics } from "@/data/mockData";
import { generateReportAnalysis, METRIC_OPTIONS, MetricKey } from "@/lib/reportEngine";
import ReportGenerator from "@/components/reports/ReportGenerator";
import ReportKPICards from "@/components/reports/ReportKPICards";
import ReportCharts from "@/components/reports/ReportCharts";
import ReportBottlenecks from "@/components/reports/ReportBottlenecks";
import ReportLeakage from "@/components/reports/ReportLeakage";
import ReportRecommendations from "@/components/reports/ReportRecommendations";
import ReportCampaignTable from "@/components/reports/ReportCampaignTable";
import ReportPreview from "@/components/reports/ReportPreview";
import EmailReportCard from "@/components/reports/EmailReportCard";
import { FileText, Download, Mail, Eye, Brain, AlertTriangle, Zap } from "lucide-react";

export default function Reports() {
  const { selectedAccount, campaigns, dateRange } = useDashboard();
  const activeCampaigns = campaigns.length > 0 ? campaigns : (selectedAccount?.campaigns || []);
  const kpis = computeKPIs(activeCampaigns);
  const dailyMetrics = aggregateDailyMetrics(activeCampaigns);

  const [reportDateRange, setReportDateRange] = useState<string>("last30");
  const [reportLevels, setReportLevels] = useState<string[]>(["campaign"]);
  const [selectedMetrics, setSelectedMetrics] = useState<MetricKey[]>(["spend", "leads", "ctr", "cpl", "roas"]);
  const [reportGenerated, setReportGenerated] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);

  const analysis = useMemo(() => generateReportAnalysis(activeCampaigns), [activeCampaigns]);

  const handleGenerateReport = () => {
    setReportGenerated(true);
  };

  const handleExportCSV = () => {
    const headers = ["Campaign", ...selectedMetrics];
    const rows = activeCampaigns.map(c => {
      const row: string[] = [c.name];
      selectedMetrics.forEach(m => {
        const val = m === "cpl" ? (c.leads > 0 ? c.spend / c.leads : 0) :
                    m === "conversionRate" ? (c.clicks > 0 ? (c.leads / c.clicks) * 100 : 0) :
                    m === "cpm" ? (c.impressions > 0 ? (c.spend / c.impressions) * 1000 : 0) :
                    (c as any)[m] ?? 0;
        row.push(String(typeof val === "number" ? val.toFixed(2) : val));
      });
      return row.join(",");
    });
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `metapulse-report-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">📊 AI Performance Reports</h1>
          <p className="text-sm mt-0.5 text-muted-foreground">AI-powered performance analysis & actionable intelligence</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExportCSV} className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border border-border bg-card text-foreground hover:bg-muted transition-colors">
            <Download size={14} /> CSV
          </button>
          <button onClick={() => setShowEmailModal(true)} className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border border-border bg-card text-foreground hover:bg-muted transition-colors">
            <Mail size={14} /> Send Report Email
          </button>
          <button onClick={() => setShowPreview(true)} className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity">
            <Eye size={14} /> Preview Report
          </button>
        </div>
      </div>

      <ReportGenerator
        dateRange={reportDateRange}
        setDateRange={setReportDateRange}
        levels={reportLevels}
        setLevels={setReportLevels}
        selectedMetrics={selectedMetrics}
        setSelectedMetrics={setSelectedMetrics}
        onGenerate={handleGenerateReport}
        reportGenerated={reportGenerated}
      />

      <ReportKPICards kpis={kpis} campaigns={activeCampaigns} />
      <ReportCharts dailyMetrics={dailyMetrics} campaigns={activeCampaigns} />

      <div className="ai-insight-box p-5">
        <div className="flex items-center gap-2 mb-4">
          <Brain size={18} className="text-primary" />
          <h2 className="text-sm font-semibold text-foreground">AI Performance Analysis Engine</h2>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary font-mono">AUTO</span>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-3 rounded-lg bg-card">
            <div className="text-lg font-bold font-mono text-metric-positive">{analysis.scalingOpportunities}</div>
            <div className="text-[10px] text-muted-foreground mt-1">Scale Opportunities</div>
          </div>
          <div className="p-3 rounded-lg bg-card">
            <div className="text-lg font-bold font-mono text-metric-negative">{analysis.underperformers}</div>
            <div className="text-[10px] text-muted-foreground mt-1">Underperformers</div>
          </div>
          <div className="p-3 rounded-lg bg-card">
            <div className="text-lg font-bold font-mono text-metric-warning">₹{analysis.totalLeakage.toLocaleString("en-IN")}</div>
            <div className="text-[10px] text-muted-foreground mt-1">Budget Leakage</div>
          </div>
        </div>
      </div>

      <ReportBottlenecks bottlenecks={analysis.bottlenecks} />
      <ReportLeakage leakage={analysis.leakage} totalLeakage={analysis.totalLeakage} />
      <ReportRecommendations recommendations={analysis.recommendations} />
      <ReportCampaignTable performance={analysis.campaignPerformance} selectedMetrics={selectedMetrics} />

      {/* Email Modal */}
      <EmailReportCard open={showEmailModal} onOpenChange={setShowEmailModal} />

      {/* Report Preview Modal */}
      {showPreview && (
        <ReportPreview
          kpis={kpis}
          campaigns={activeCampaigns}
          analysis={analysis}
          dateRange={dateRange}
          accountName={selectedAccount?.accountName || ""}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
}
