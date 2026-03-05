import { useState, useEffect } from "react";
import { Mail, Send, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface EmailReportCardProps {
  reportData?: any;
}

export default function EmailReportCard({ reportData }: EmailReportCardProps) {
  const [recipientEmail, setRecipientEmail] = useState("");
  const [subject, setSubject] = useState("Meta Ads Performance Report");
  const [messageBody, setMessageBody] = useState(
    "Hello,\n\nPlease find the latest Meta Ads performance report generated from MetaPulse Analytics.\n\nReport includes:\n- Spend & Budget Analysis\n- Leads & Conversion Metrics\n- ROAS Performance\n- AI Performance Insights\n- Campaign Analysis\n- Actionable Recommendations\n\nRegards,\nMetaPulse Analytics"
  );
  const [sending, setSending] = useState(false);
  const [hasSmtpSettings, setHasSmtpSettings] = useState<boolean | null>(null);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);

  useEffect(() => {
    checkSmtpSettings();
    loadRecentLogs();
  }, []);

  const checkSmtpSettings = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setHasSmtpSettings(false);
      return;
    }
    const { data } = await supabase
      .from("email_settings")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    setHasSmtpSettings(!!data);
  };

  const loadRecentLogs = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("email_logs")
      .select("*")
      .eq("user_id", user.id)
      .order("sent_at", { ascending: false })
      .limit(5);
    if (data) setRecentLogs(data);
  };

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
      const { data, error } = await supabase.functions.invoke("send-report-email", {
        body: { recipientEmail, subject, messageBody },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success("Report sent successfully!", {
        description: `Email delivered to ${recipientEmail}`,
      });
      setRecipientEmail("");
      loadRecentLogs();
    } catch (err: any) {
      toast.error("Failed to send email", {
        description: err.message || "Please verify your Gmail App Password in Settings.",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="chart-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Mail size={18} className="text-primary" />
        <h2 className="text-sm font-semibold text-foreground">📧 Send Email Report</h2>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary font-mono">SMTP</span>
      </div>

      {hasSmtpSettings === false && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 mb-4">
          <AlertCircle size={16} className="text-amber-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-medium text-amber-400">SMTP Not Configured</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Go to Settings → Email Configuration to set up your Gmail SMTP credentials first.
            </p>
          </div>
        </div>
      )}

      <div className="space-y-3">
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

        <div>
          <label className="text-xs font-medium text-foreground block mb-1">Subject</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full text-xs px-3 py-2 rounded-lg border outline-none focus:border-primary/60 transition-colors bg-muted border-border text-foreground placeholder:text-muted-foreground"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-foreground block mb-1">Message Body</label>
          <textarea
            value={messageBody}
            onChange={(e) => setMessageBody(e.target.value)}
            rows={5}
            className="w-full text-xs px-3 py-2 rounded-lg border outline-none focus:border-primary/60 transition-colors bg-muted border-border text-foreground placeholder:text-muted-foreground resize-none"
          />
        </div>

        <button
          onClick={handleSendEmail}
          disabled={sending || hasSmtpSettings === false}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed bg-primary text-primary-foreground"
        >
          {sending ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Sending Report...
            </>
          ) : (
            <>
              <Send size={14} />
              Send Report
            </>
          )}
        </button>
      </div>

      {/* Recent Email Logs */}
      {recentLogs.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border">
          <h3 className="text-xs font-semibold text-foreground mb-2">Recent Sends</h3>
          <div className="space-y-2">
            {recentLogs.map((log) => (
              <div key={log.id} className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-2">
                  {log.status === "sent" ? (
                    <CheckCircle size={12} className="text-emerald-400" />
                  ) : (
                    <AlertCircle size={12} className="text-red-400" />
                  )}
                  <span className="text-muted-foreground truncate max-w-[160px]">{log.recipient_email}</span>
                </div>
                <span className="text-muted-foreground">
                  {new Date(log.sent_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
