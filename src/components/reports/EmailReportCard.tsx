import { useState } from "react";
import { Mail, Send, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useDashboard } from "@/components/layout/Layout";
import { computeKPIs } from "@/data/mockData";
import { generateAIInsights, fetchAdSets } from "@/services/metaService";
import { getCurrencySymbol, formatCurrencyShort, formatCurrencyFixed } from "@/lib/currency";
import { MetricKey, METRIC_OPTIONS } from "@/lib/reportEngine";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface EmailReportCardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportDateRange: string;
  reportLevels: string[];
  selectedMetrics: MetricKey[];
}

const DATE_RANGE_LABELS: Record<string, string> = {
  today: "Today",
  yesterday: "Yesterday",
  last7: "Last 7 Days",
  last14: "Last 14 Days",
  last30: "Last 30 Days",
  thisWeek: "This Week",
  thisMonth: "This Month",
  lastMonth: "Last Month",
  last90: "Last 90 Days",
  last6months: "Last 6 Months",
  lastYear: "Last Year",
  thisYear: "This Year",
};

function getMetricValue(campaign: any, metric: MetricKey, currency: string): string {
  switch (metric) {
    case "spend": return formatCurrencyShort(campaign.spend, currency);
    case "impressions": return campaign.impressions.toLocaleString();
    case "clicks": return campaign.clicks.toLocaleString();
    case "leads": return String(campaign.leads);
    case "purchases": return String(campaign.purchases);
    case "ctr": return campaign.ctr.toFixed(2) + "%";
    case "cpc": return formatCurrencyFixed(campaign.cpc, currency, 2);
    case "cpl": return campaign.leads > 0 ? formatCurrencyFixed(campaign.spend / campaign.leads, currency, 0) : "—";
    case "roas": return campaign.roas > 0 ? campaign.roas.toFixed(1) + "x" : "—";
    case "conversionRate": return campaign.clicks > 0 ? ((campaign.leads / campaign.clicks) * 100).toFixed(2) + "%" : "—";
    case "cpm": return campaign.impressions > 0 ? formatCurrencyFixed((campaign.spend / campaign.impressions) * 1000, currency, 2) : "—";
    default: return "—";
  }
}

export default function EmailReportCard({ open, onOpenChange, reportDateRange, reportLevels, selectedMetrics }: EmailReportCardProps) {
  const { selectedAccount, campaigns, dateRange } = useDashboard();
  const [recipientEmail, setRecipientEmail] = useState("");
  const [sending, setSending] = useState(false);

  const currency = selectedAccount?.currency || "INR";
  const accountName = selectedAccount?.accountName || "Ad Account";
  const dateRangeLabel = DATE_RANGE_LABELS[reportDateRange] || reportDateRange;

  // Build metric labels for display
  const selectedMetricLabels = selectedMetrics.map(
    k => METRIC_OPTIONS.find(m => m.key === k)?.label || k
  );

  const handleSendEmail = async () => {
    if (!recipientEmail) {
      toast.error("Please enter a recipient email");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setSending(true);
    try {
      const kpis = computeKPIs(campaigns);
      const cpl = kpis.leads > 0 ? kpis.spend / kpis.leads : 0;
      const insights = await generateAIInsights(campaigns);

      const activeCampaigns = campaigns.filter(c => c.spend > 0);

      // Build campaign rows with only selected metrics
      const campaignRows = activeCampaigns.slice(0, 15).map(c => {
        const row: Record<string, string> = {
          name: c.name.length > 50 ? c.name.substring(0, 47) + "..." : c.name,
        };
        selectedMetrics.forEach(m => {
          row[m] = getMetricValue(c, m, currency);
        });
        return row;
      });

      // Fetch ad set data if level includes adset
      let adSetRows: any[] = [];
      if (reportLevels.includes("adset") && activeCampaigns.length > 0) {
        try {
          // Fetch adsets for top 3 spending campaigns
          const topCampaigns = [...activeCampaigns].sort((a, b) => b.spend - a.spend).slice(0, 3);
          for (const camp of topCampaigns) {
            const adSets = await fetchAdSets(camp.campaignId);
            adSets.filter(as => as.spend > 0).forEach(as => {
              const row: Record<string, string> = {
                name: as.name.length > 50 ? as.name.substring(0, 47) + "..." : as.name,
                campaignName: camp.name.length > 30 ? camp.name.substring(0, 27) + "..." : camp.name,
              };
              selectedMetrics.forEach(m => {
                row[m] = getMetricValue(as as any, m, currency);
              });
              adSetRows.push(row);
            });
          }
        } catch (e) {
          console.warn("Could not fetch ad sets for email:", e);
        }
      }

      const today = new Date().toLocaleDateString("en-US", {
        weekday: "long", year: "numeric", month: "long", day: "numeric",
      });

      // Build KPI values based on selected metrics
      const kpiValues: Record<string, string> = {};
      if (selectedMetrics.includes("spend")) kpiValues.spend = formatCurrencyShort(kpis.spend, currency);
      if (selectedMetrics.includes("impressions")) kpiValues.impressions = kpis.impressions.toLocaleString();
      if (selectedMetrics.includes("clicks")) kpiValues.clicks = kpis.clicks.toLocaleString();
      if (selectedMetrics.includes("leads")) kpiValues.leads = kpis.leads.toLocaleString();
      if (selectedMetrics.includes("purchases")) kpiValues.purchases = kpis.purchases.toLocaleString();
      if (selectedMetrics.includes("ctr")) kpiValues.ctr = kpis.ctr.toFixed(2) + "%";
      if (selectedMetrics.includes("cpc")) kpiValues.cpc = formatCurrencyFixed(kpis.cpc, currency, 2);
      if (selectedMetrics.includes("cpl")) kpiValues.cpl = formatCurrencyFixed(cpl, currency, 0);
      if (selectedMetrics.includes("roas")) kpiValues.roas = kpis.roas > 0 ? kpis.roas.toFixed(1) + "x" : "—";
      if (selectedMetrics.includes("conversionRate")) {
        const cr = kpis.clicks > 0 ? ((kpis.leads / kpis.clicks) * 100) : 0;
        kpiValues.conversionRate = cr.toFixed(2) + "%";
      }
      if (selectedMetrics.includes("cpm")) {
        const cpm = kpis.impressions > 0 ? (kpis.spend / kpis.impressions) * 1000 : 0;
        kpiValues.cpm = formatCurrencyFixed(cpm, currency, 2);
      }

      const metricColumns = selectedMetrics.map(k => ({
        key: k,
        label: METRIC_OPTIONS.find(m => m.key === k)?.label || k,
      }));

      const reportData = {
        accountName,
        currency,
        currencySymbol: getCurrencySymbol(currency),
        date: today,
        dateRangeLabel,
        kpis: kpiValues,
        metricColumns,
        campaigns: campaignRows,
        adSets: adSetRows.length > 0 ? adSetRows : undefined,
        insights: insights.map(i => i.replace(/<[^>]*>/g, "")),
        totalCampaigns: campaigns.length,
        activeCampaigns: activeCampaigns.length,
        levels: reportLevels,
      };

      const subject = `📊 ${accountName} — ${dateRangeLabel} Performance Report`;

      const { data, error } = await supabase.functions.invoke("send-report-email", {
        body: { recipientEmail, subject, reportData },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success("Report sent successfully!", {
        description: `Email delivered to ${recipientEmail}`,
      });
      setRecipientEmail("");
      onOpenChange(false);
    } catch (err: any) {
      toast.error("Email failed to send.", { description: err.message });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Mail size={18} className="text-primary" />
            Send Performance Report
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Send live metrics for <strong>{accountName}</strong> based on your configured report filters.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-2">
          <div>
            <label className="text-xs font-medium text-foreground block mb-1">Recipient Email</label>
            <input
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="recipient@example.com"
              className="w-full text-xs px-3 py-2 rounded-lg border outline-none focus:border-primary/60 transition-colors bg-muted border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>

          {/* Report config preview */}
          <div className="rounded-lg p-3 text-[11px] space-y-2" style={{ background: "hsl(var(--muted) / 0.5)" }}>
            <p className="font-medium text-foreground">Report Configuration:</p>
            <div className="grid grid-cols-2 gap-2 text-muted-foreground">
              <div>
                <span className="text-foreground font-medium">Period:</span> {dateRangeLabel}
              </div>
              <div>
                <span className="text-foreground font-medium">Levels:</span> {reportLevels.join(", ")}
              </div>
            </div>
            <div>
              <span className="text-foreground font-medium">Metrics:</span>{" "}
              <span className="text-muted-foreground">{selectedMetricLabels.join(", ")}</span>
            </div>
            <div className="text-muted-foreground mt-1">
              • {Math.min(campaigns.filter(c => c.spend > 0).length, 15)} campaigns with data
              {reportLevels.includes("adset") && " • Ad set breakdown for top 3 campaigns"}
              {" • AI insights & recommendations"}
            </div>
          </div>

          <button
            onClick={handleSendEmail}
            disabled={sending}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed bg-primary text-primary-foreground"
          >
            {sending ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Generating & Sending...
              </>
            ) : (
              <>
                <Send size={14} />
                Send Report
              </>
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
