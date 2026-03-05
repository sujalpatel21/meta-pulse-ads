import { useState } from "react";
import { Mail, Send, Loader2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
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
  const [recipientEmail, setRecipientEmail] = useState("");
  const [subject, setSubject] = useState("Meta Ads Performance Report");
  const [messageBody, setMessageBody] = useState(
    "Hello,\n\nPlease find the latest Meta Ads performance report generated from MetaPulse Analytics.\n\nThis report includes:\n• Campaign performance\n• Spend analysis\n• ROAS metrics\n• AI insights\n• Optimization recommendations\n\nRegards,\nMetaPulse Analytics"
  );
  const [sending, setSending] = useState(false);

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
      onOpenChange(false);
    } catch (err: any) {
      toast.error("Email failed to send. Please try again later.", {
        description: err.message,
      });
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
            Send Report Email
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Send the performance report directly to any email address.
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
            <label className="text-xs font-medium text-foreground block mb-1">Message Body (Optional)</label>
            <textarea
              value={messageBody}
              onChange={(e) => setMessageBody(e.target.value)}
              rows={6}
              className="w-full text-xs px-3 py-2 rounded-lg border outline-none focus:border-primary/60 transition-colors bg-muted border-border text-foreground placeholder:text-muted-foreground resize-none"
            />
          </div>

          <button
            onClick={handleSendEmail}
            disabled={sending}
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
      </DialogContent>
    </Dialog>
  );
}
