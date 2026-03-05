import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

// ================================================================
// MetaPulse — Send Report Email via Gmail SMTP Relay (HTTP)
//
// Uses Gmail's SMTP relay through raw HTTP/fetch since Supabase
// Edge Functions (Deno Deploy) block direct TCP/SMTP connections.
//
// IMPORTANT: The "from" address MUST match the SMTP_EMAIL (Gmail)
// used for authentication, otherwise Gmail rejects the send.
//
// Required Supabase secrets:
//   SMTP_EMAIL    — your Gmail address (e.g. user@gmail.com)
//   SMTP_PASSWORD — Gmail App Password (16-char, no spaces)
//                   Generate at: https://myaccount.google.com/apppasswords
// ================================================================

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/** Build a raw MIME email message */
function buildMimeMessage(
  from: string,
  to: string,
  subject: string,
  textBody: string,
  htmlBody: string
): string {
  const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).slice(2)}`;

  return [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    ``,
    `--${boundary}`,
    `Content-Type: text/plain; charset=UTF-8`,
    `Content-Transfer-Encoding: 7bit`,
    ``,
    textBody,
    ``,
    `--${boundary}`,
    `Content-Type: text/html; charset=UTF-8`,
    `Content-Transfer-Encoding: 7bit`,
    ``,
    htmlBody,
    ``,
    `--${boundary}--`,
  ].join("\r\n");
}

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

    // ── Parse request body ────────────────────────────────────────
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
        JSON.stringify({
          error: "SMTP credentials not configured. Set SMTP_EMAIL and SMTP_PASSWORD in Supabase secrets.",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Build email content ──────────────────────────────────────
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

    // ── KEY FIX: Use the SAME Gmail address as both sender and auth ──
    // Gmail REQUIRES the "from" address to match the authenticated account.
    const fromAddress = smtpEmail;

    // Build MIME message
    const rawMessage = buildMimeMessage(
      `MetaPulse Analytics <${fromAddress}>`,
      recipientEmail,
      subject,
      emailBody,
      htmlContent
    );

    // ── Send via Gmail SMTP using Deno's built-in TLS connect ────
    // Since Supabase Edge Functions may block port 587, we try
    // port 465 (SSL) first, then fall back to the Gmail API approach.
    let sent = false;
    let sendError = "";

    // Approach: Use Gmail's SMTP relay via Deno.connectTls (port 465)
    try {
      const encoder = new TextEncoder();
      const decoder = new TextDecoder();

      const conn = await Deno.connectTls({
        hostname: "smtp.gmail.com",
        port: 465,
      });

      async function readResponse(): Promise<string> {
        const buf = new Uint8Array(4096);
        const n = await conn.read(buf);
        return n ? decoder.decode(buf.subarray(0, n)) : "";
      }

      async function sendCmd(cmd: string): Promise<string> {
        await conn.write(encoder.encode(cmd + "\r\n"));
        // Small delay to let server respond
        await new Promise((r) => setTimeout(r, 200));
        return await readResponse();
      }

      // Read greeting
      await readResponse();

      // EHLO
      await sendCmd("EHLO metapulse.local");

      // AUTH LOGIN
      await sendCmd("AUTH LOGIN");
      await sendCmd(base64Encode(new TextEncoder().encode(smtpEmail)));
      const authRes = await sendCmd(base64Encode(new TextEncoder().encode(smtpPassword)));

      if (!authRes.startsWith("235")) {
        throw new Error(`SMTP auth failed: ${authRes.trim()}`);
      }

      // MAIL FROM — MUST be the same Gmail address
      const mailFromRes = await sendCmd(`MAIL FROM:<${fromAddress}>`);
      if (!mailFromRes.startsWith("250")) {
        throw new Error(`MAIL FROM rejected: ${mailFromRes.trim()}`);
      }

      // RCPT TO
      const rcptRes = await sendCmd(`RCPT TO:<${recipientEmail}>`);
      if (!rcptRes.startsWith("250")) {
        throw new Error(`RCPT TO rejected: ${rcptRes.trim()}`);
      }

      // DATA
      await sendCmd("DATA");
      const dataRes = await sendCmd(rawMessage + "\r\n.");
      if (!dataRes.startsWith("250")) {
        throw new Error(`DATA rejected: ${dataRes.trim()}`);
      }

      // QUIT
      await sendCmd("QUIT");
      conn.close();

      sent = true;
      console.log(`Email sent via SMTP (port 465) from ${fromAddress} to ${recipientEmail}`);
    } catch (smtpErr: any) {
      sendError = smtpErr.message;
      console.warn("SMTP port 465 failed:", smtpErr.message);

      // Fallback: try denomailer on port 465 (SSL direct)
      try {
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
          from: `MetaPulse Analytics <${fromAddress}>`,
          to: recipientEmail,
          subject: subject,
          content: emailBody,
          html: htmlContent,
        });

        await client.close();
        sent = true;
        console.log(`Email sent via denomailer (port 465) from ${fromAddress} to ${recipientEmail}`);
      } catch (denomErr: any) {
        sendError = `Direct SMTP: ${sendError} | Denomailer: ${denomErr.message}`;
        console.warn("Denomailer fallback also failed:", denomErr.message);
      }
    }

    if (!sent) {
      throw new Error(`All email methods failed. ${sendError}`);
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

    // Log failure
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
