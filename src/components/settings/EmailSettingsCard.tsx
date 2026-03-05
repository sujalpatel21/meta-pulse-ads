import { useState, useEffect } from "react";
import { Mail, Save, Eye, EyeOff, CheckCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function EmailSettingsCard() {
  const [smtpEmail, setSmtpEmail] = useState("");
  const [smtpPassword, setSmtpPassword] = useState("");
  const [smtpHost, setSmtpHost] = useState("smtp.gmail.com");
  const [smtpPort, setSmtpPort] = useState("587");
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasExisting, setHasExisting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("email_settings")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    if (data) {
      setSmtpEmail(data.smtp_email);
      setSmtpPassword(data.smtp_password);
      setSmtpHost(data.smtp_host);
      setSmtpPort(String(data.smtp_port));
      setHasExisting(true);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!smtpEmail || !smtpPassword) {
      toast.error("Email and App Password are required");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(smtpEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const payload = {
        user_id: user.id,
        smtp_email: smtpEmail,
        smtp_password: smtpPassword,
        smtp_host: smtpHost,
        smtp_port: parseInt(smtpPort),
        updated_at: new Date().toISOString(),
      };

      if (hasExisting) {
        const { error } = await supabase
          .from("email_settings")
          .update(payload)
          .eq("user_id", user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("email_settings")
          .insert(payload);
        if (error) throw error;
        setHasExisting(true);
      }

      toast.success("Email settings saved successfully!");
    } catch (err: any) {
      toast.error("Failed to save settings", { description: err.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="chart-card p-5">
        <div className="flex items-center justify-center py-8">
          <Loader2 size={20} className="animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="chart-card p-5">
      <div className="flex items-center gap-2 mb-1">
        <Mail size={16} className="text-primary" />
        <h3 className="text-sm font-semibold text-foreground">📧 Email Configuration (Gmail SMTP)</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        Configure Gmail App Password to send reports via email. Your credentials are stored securely.
      </p>

      {hasExisting && (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 mb-4">
          <CheckCircle size={14} className="text-emerald-400" />
          <span className="text-xs text-emerald-400 font-medium">SMTP Configured</span>
        </div>
      )}

      <div className="space-y-3">
        <div>
          <label className="text-xs font-medium text-foreground block mb-1">Sender Email (Gmail)</label>
          <input
            type="email"
            value={smtpEmail}
            onChange={(e) => setSmtpEmail(e.target.value)}
            placeholder="your.email@gmail.com"
            className="w-full text-xs px-3 py-2 rounded-lg border outline-none focus:border-primary/60 transition-colors bg-muted border-border text-foreground placeholder:text-muted-foreground"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-foreground block mb-1">App Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={smtpPassword}
              onChange={(e) => setSmtpPassword(e.target.value)}
              placeholder="16-character App Password"
              className="w-full text-xs px-3 py-2 pr-9 rounded-lg border outline-none focus:border-primary/60 transition-colors bg-muted border-border text-foreground placeholder:text-muted-foreground font-mono"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">
            Generate at: Google Account → Security → App Passwords
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-foreground block mb-1">SMTP Host</label>
            <input
              type="text"
              value={smtpHost}
              onChange={(e) => setSmtpHost(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-lg border outline-none focus:border-primary/60 transition-colors bg-muted border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-foreground block mb-1">Port</label>
            <input
              type="text"
              value={smtpPort}
              onChange={(e) => setSmtpPort(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-lg border outline-none focus:border-primary/60 transition-colors bg-muted border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-mono">TLS</span>
          <span>Encryption enabled by default</span>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold transition-all hover:opacity-90 disabled:opacity-50 bg-primary text-primary-foreground"
        >
          {saving ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save size={14} />
              Save Email Settings
            </>
          )}
        </button>
      </div>
    </div>
  );
}
