import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ================================================================
// MetaPulse — Send Report Email
//
// KEY FIX: The "from" address MUST match the SMTP_EMAIL (Gmail)
// used for authentication. Gmail rejects sender mismatches.
//
// Required Supabase secrets:
//   SMTP_EMAIL    — your Gmail address (e.g. user@gmail.com)
//   SMTP_PASSWORD — Gmail App Password (16-char)
// ================================================================

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ── Auth check ────────────────────────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Parse body ────────────────────────────────────────────────
    const { recipientEmail, subject, messageBody } = await req.json();

    if (!recipientEmail || !subject) {
      return new Response(JSON.stringify({ error: "recipientEmail and subject are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── SMTP credentials ─────────────────────────────────────────
    const smtpEmail = Deno.env.get("SMTP_EMAIL");
    const smtpPassword = Deno.env.get("SMTP_PASSWORD");

    if (!smtpEmail || !smtpPassword) {
      return new Response(
        JSON.stringify({ error: "SMTP credentials not configured. Set SMTP_EMAIL and SMTP_PASSWORD." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Email content ─────────────────────────────────────────────
    const emailBody = messageBody || `Hello,

Please find the latest Meta Ads performance report generated from MetaPulse Analytics.

This report includes:
• Campaign performance
• Spend analysis
• ROAS metrics
• AI insights
• Optimization recommendations

Regards,
MetaPulse Analytics`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 24px; border-radius: 12px; margin-bottom: 20px;">
          <h1 style="color: white; margin: 0; font-size: 22px;">📊 MetaPulse Performance Report</h1>
          <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 14px;">AI-Powered Meta Ads Intelligence</p>
        </div>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; white-space: pre-line; font-size: 14px; line-height: 1.6; color: #333;">
          ${emailBody.replace(/\n/g, "<br>")}
        </div>
        <div style="text-align: center; padding: 16px; color: #999; font-size: 12px;">
          Sent via MetaPulse Analytics
        </div>
      </div>
    `;

    // ── Send email via Resend HTTP API ────────────────────────────
    // Supabase Edge Functions (Deno Deploy) block outbound SMTP/TCP.
    // We use Resend API if RESEND_API_KEY is set, otherwise try SMTP.
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (resendApiKey) {
      // ── Resend API (recommended) ─────────────────────────────
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: Deno.env.get("RESEND_FROM_EMAIL") || `MetaPulse Analytics <onboarding@resend.dev>`,
          to: [recipientEmail],
          subject,
          text: emailBody,
          html: htmlContent,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Resend error (${res.status}): ${errText}`);
      }

      console.log("Email sent via Resend API");
    } else {
      // ── SMTP fallback via denomailer ─────────────────────────
      // FIX: from address MUST match smtpEmail (Gmail rejects mismatches)
      // FIX: Use port 465 (direct SSL) — port 587 is blocked on Deno Deploy
      const { SMTPClient } = await import("https://deno.land/x/denomailer@1.6.0/mod.ts");

      const client = new SMTPClient({
        connection: {
          hostname: "smtp.gmail.com",
          port: 465,
          tls: true,
          auth: {
            username: smtpEmail,
            password: smtpPassword,
          },
        },
      });

      await client.send({
        from: smtpEmail,
        to: recipientEmail,
        subject: subject,
        content: emailBody,
        html: htmlContent,
      });

      await client.close();
      console.log(`Email sent via SMTP from ${smtpEmail} to ${recipientEmail}`);
    }

    // ── Log success ──────────────────────────────────────────────
    try {
      await supabase.from("email_logs").insert({
        user_id: user.id,
        recipient_email: recipientEmail,
        subject: subject,
        status: "sent",
      });
    } catch (_) { }

    return new Response(JSON.stringify({ success: true, message: "Report sent successfully!" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Email send error:", error);

    try {
      const authHeader = req.headers.get("Authorization");
      if (authHeader) {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseKey, {
          global: { headers: { Authorization: authHeader } },
        });
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from("email_logs").insert({
            user_id: user.id,
            recipient_email: "unknown",
            subject: "unknown",
            status: "failed",
            error_message: error.message,
          });
        }
      }
    } catch (_) { }

    return new Response(
      JSON.stringify({ error: `Email failed: ${error.message}` }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
