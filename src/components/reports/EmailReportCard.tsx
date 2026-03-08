import { useState } from "react";
import { Mail, Send, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useDashboard } from "@/components/layout/Layout";
import { computeKPIs } from "@/data/mockData";
import { generateAIInsights } from "@/services/metaService";
import { getCurrencySymbol, formatCurrencyShort, formatCurrencyFixed } from "@/lib/currency";
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
}

export default function EmailReportCard({ open, onOpenChange }: EmailReportCardProps) {
  const { selectedAccount, campaigns, dateRange } = useDashboard();
  const [recipientEmail, setRecipientEmail] = useState("");
  const [sending, setSending] = useState(false);

  const currency = selectedAccount?.currency || "INR";
  const accountName = selectedAccount?.accountName || "Ad Account";

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

      // Build campaign summary rows
      const activeCampaigns = campaigns.filter(c => c.status === "Active" && c.spend > 0);
      const campaignRows = activeCampaigns.slice(0, 10).map(c => ({
        name: c.name.length > 50 ? c.name.substring(0, 47) + "..." : c.name,
        spend: formatCurrencyShort(c.spend, currency),
        leads: c.leads,
        ctr: c.ctr.toFixed(2) + "%",
        cpc: formatCurrencyFixed(c.cpc, currency, 2),
        roas: c.roas > 0 ? c.roas.toFixed(1) + "x" : "—",
        cpl: c.leads > 0 ? formatCurrencyFixed(c.spend / c.leads, currency, 0) : "—",
      }));

      const today = new Date().toLocaleDateString("en-US", {
        weekday: "long", year: "numeric", month: "long", day: "numeric",
      });

      const reportData = {
        accountName,
        currency,
        currencySymbol: getCurrencySymbol(currency),
        date: today,
        dateRange,
        kpis: {
          spend: formatCurrencyShort(kpis.spend, currency),
          impressions: kpis.impressions.toLocaleString(),
          clicks: kpis.clicks.toLocaleString(),
          leads: kpis.leads.toLocaleString(),
          purchases: kpis.purchases.toLocaleString(),
          ctr: kpis.ctr.toFixed(2) + "%",
          cpc: formatCurrencyFixed(kpis.cpc, currency, 2),
          cpl: formatCurrencyFixed(cpl, currency, 0),
          roas: kpis.roas > 0 ? kpis.roas.toFixed(1) + "x" : "—",
        },
        campaigns: campaignRows,
        insights: insights.map(i => i.replace(/<[^>]*>/g, "")), // strip HTML tags for email
        totalCampaigns: campaigns.length,
        activeCampaigns: activeCampaigns.length,
      };

      const subject = `📊 ${accountName} — Performance Report (${today})`;

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
            Send today's live metrics for <strong>{accountName}</strong> — includes spend, leads, CTR, campaign breakdown & AI insights.
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

          {/* Preview of what will be sent */}
          <div className="rounded-lg p-3 text-[11px] space-y-1" style={{ background: "hsl(var(--muted) / 0.5)" }}>
            <p className="font-medium text-foreground">Report will include:</p>
            <ul className="text-muted-foreground space-y-0.5 list-disc pl-4">
              <li>Account: {accountName}</li>
              <li>KPIs: Spend, Impressions, Clicks, Leads, CTR, CPC, CPL, ROAS</li>
              <li>Top {Math.min(campaigns.filter(c => c.spend > 0).length, 10)} active campaigns with metrics</li>
              <li>AI-generated insights & recommendations</li>
            </ul>
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
                Send Live Report
              </>
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
