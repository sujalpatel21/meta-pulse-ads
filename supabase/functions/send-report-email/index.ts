import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const { recipientEmail, subject, messageBody } = await req.json();

    if (!recipientEmail || !subject) {
      return new Response(
        JSON.stringify({ error: "recipientEmail and subject are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const smtpEmail = Deno.env.get("SMTP_EMAIL") || "sujalpatel6172@gmail.com";
    const smtpPassword = Deno.env.get("SMTP_PASSWORD");

    if (!smtpPassword) {
      return new Response(
        JSON.stringify({ error: "SMTP_PASSWORD not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const emailBody = messageBody || "Please find the latest Meta Ads performance report.";

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

    // Use Gmail SMTP via denomailer
    const { SMTPClient } = await import("https://deno.land/x/denomailer@1.6.0/mod.ts");

    const client = new SMTPClient({
      connection: {
        hostname: Deno.env.get("SMTP_HOST") || "smtp.gmail.com",
        port: Number(Deno.env.get("SMTP_PORT") || 465),
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
    console.log(`Email sent from ${smtpEmail} to ${recipientEmail}`);

    return new Response(
      JSON.stringify({ success: true, message: "Report sent successfully!" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Email send error:", error);
    return new Response(
      JSON.stringify({ error: `Email failed: ${error.message}` }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
