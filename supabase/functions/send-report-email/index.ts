import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function buildReportHtml(data: any): string {
  const { accountName, date, kpis, campaigns, insights, totalCampaigns, activeCampaigns, currencySymbol } = data;

  const campaignRows = (campaigns || []).map((c: any) => `
    <tr>
      <td style="padding:8px 10px;border-bottom:1px solid #eee;font-size:13px;color:#333;max-width:200px;word-break:break-word;">${c.name}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #eee;font-size:13px;text-align:center;color:#333;">${c.spend}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #eee;font-size:13px;text-align:center;color:#333;">${c.leads}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #eee;font-size:13px;text-align:center;color:#333;">${c.cpl}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #eee;font-size:13px;text-align:center;color:#333;">${c.ctr}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #eee;font-size:13px;text-align:center;color:#333;">${c.roas}</td>
    </tr>
  `).join("");

  const insightItems = (insights || []).map((i: string) => `
    <li style="padding:6px 0;border-bottom:1px solid #f0f0f0;font-size:13px;color:#444;line-height:1.5;">${i}</li>
  `).join("");

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#ffffff;font-family:Arial,Helvetica,sans-serif;">
<div style="max-width:640px;margin:0 auto;padding:20px;">

  <!-- Header -->
  <div style="background:linear-gradient(135deg,#3b82f6,#6366f1);padding:28px 24px;border-radius:12px;margin-bottom:24px;">
    <h1 style="color:#fff;margin:0;font-size:22px;">📊 MetaPulse Performance Report</h1>
    <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">${accountName}</p>
    <p style="color:rgba(255,255,255,0.65);margin:4px 0 0;font-size:12px;">${date} · ${totalCampaigns} campaigns (${activeCampaigns} active)</p>
  </div>

  <!-- KPI Grid -->
  <div style="margin-bottom:24px;">
    <h2 style="font-size:16px;color:#333;margin:0 0 12px;">Key Metrics</h2>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
      <tr>
        <td style="padding:12px;text-align:center;background:#f0f7ff;border-radius:8px 0 0 0;">
          <div style="font-size:20px;font-weight:bold;color:#3b82f6;">${kpis.spend}</div>
          <div style="font-size:11px;color:#888;margin-top:4px;">Total Spend</div>
        </td>
        <td style="padding:12px;text-align:center;background:#f0fdf4;">
          <div style="font-size:20px;font-weight:bold;color:#22c55e;">${kpis.leads}</div>
          <div style="font-size:11px;color:#888;margin-top:4px;">Leads</div>
        </td>
        <td style="padding:12px;text-align:center;background:#fffbeb;">
          <div style="font-size:20px;font-weight:bold;color:#f59e0b;">${kpis.cpl}</div>
          <div style="font-size:11px;color:#888;margin-top:4px;">CPL</div>
        </td>
        <td style="padding:12px;text-align:center;background:#fef2f2;border-radius:0 8px 0 0;">
          <div style="font-size:20px;font-weight:bold;color:#ef4444;">${kpis.ctr}</div>
          <div style="font-size:11px;color:#888;margin-top:4px;">CTR</div>
        </td>
      </tr>
      <tr>
        <td style="padding:12px;text-align:center;background:#f8f9fa;border-radius:0 0 0 8px;">
          <div style="font-size:18px;font-weight:bold;color:#555;">${kpis.impressions}</div>
          <div style="font-size:11px;color:#888;margin-top:4px;">Impressions</div>
        </td>
        <td style="padding:12px;text-align:center;background:#f8f9fa;">
          <div style="font-size:18px;font-weight:bold;color:#555;">${kpis.clicks}</div>
          <div style="font-size:11px;color:#888;margin-top:4px;">Clicks</div>
        </td>
        <td style="padding:12px;text-align:center;background:#f8f9fa;">
          <div style="font-size:18px;font-weight:bold;color:#555;">${kpis.cpc}</div>
          <div style="font-size:11px;color:#888;margin-top:4px;">CPC</div>
        </td>
        <td style="padding:12px;text-align:center;background:#f8f9fa;border-radius:0 0 8px 0;">
          <div style="font-size:18px;font-weight:bold;color:#555;">${kpis.roas}</div>
          <div style="font-size:11px;color:#888;margin-top:4px;">ROAS</div>
        </td>
      </tr>
    </table>
  </div>

  <!-- Campaign Table -->
  ${campaigns && campaigns.length > 0 ? `
  <div style="margin-bottom:24px;">
    <h2 style="font-size:16px;color:#333;margin:0 0 12px;">Campaign Breakdown</h2>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border:1px solid #eee;border-radius:8px;overflow:hidden;">
      <thead>
        <tr style="background:#f8f9fa;">
          <th style="padding:10px;font-size:11px;text-align:left;color:#888;text-transform:uppercase;letter-spacing:0.5px;">Campaign</th>
          <th style="padding:10px;font-size:11px;text-align:center;color:#888;text-transform:uppercase;">Spend</th>
          <th style="padding:10px;font-size:11px;text-align:center;color:#888;text-transform:uppercase;">Leads</th>
          <th style="padding:10px;font-size:11px;text-align:center;color:#888;text-transform:uppercase;">CPL</th>
          <th style="padding:10px;font-size:11px;text-align:center;color:#888;text-transform:uppercase;">CTR</th>
          <th style="padding:10px;font-size:11px;text-align:center;color:#888;text-transform:uppercase;">ROAS</th>
        </tr>
      </thead>
      <tbody>
        ${campaignRows}
      </tbody>
    </table>
  </div>
  ` : ""}

  <!-- AI Insights -->
  ${insights && insights.length > 0 ? `
  <div style="margin-bottom:24px;">
    <h2 style="font-size:16px;color:#333;margin:0 0 12px;">🤖 AI Insights</h2>
    <div style="background:#f8f9fa;border-radius:8px;padding:16px;">
      <ul style="list-style:none;margin:0;padding:0;">
        ${insightItems}
      </ul>
    </div>
  </div>
  ` : ""}

  <!-- Footer -->
  <div style="text-align:center;padding:20px 0 10px;border-top:1px solid #eee;">
    <p style="font-size:11px;color:#aaa;margin:0;">Generated by MetaPulse Analytics · ${date}</p>
  </div>

</div>
</body>
</html>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { recipientEmail, subject, reportData, messageBody } = await req.json();

    if (!recipientEmail || !subject) {
      return new Response(
        JSON.stringify({ error: "recipientEmail and subject are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const smtpEmail = Deno.env.get("SMTP_EMAIL");
    const smtpPassword = Deno.env.get("SMTP_PASSWORD");

    if (!smtpEmail || !smtpPassword) {
      return new Response(
        JSON.stringify({ error: "SMTP credentials not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build HTML: use reportData if provided, else fall back to messageBody
    let htmlContent: string;
    let textContent: string;

    if (reportData) {
      htmlContent = buildReportHtml(reportData);
      textContent = `MetaPulse Performance Report for ${reportData.accountName}\n\nSpend: ${reportData.kpis?.spend}\nLeads: ${reportData.kpis?.leads}\nCPL: ${reportData.kpis?.cpl}\nCTR: ${reportData.kpis?.ctr}\nROAS: ${reportData.kpis?.roas}\n\n${(reportData.insights || []).join("\n")}`;
    } else {
      const body = messageBody || "Please find the latest performance report.";
      textContent = body;
      htmlContent = `<div style="font-family:Arial,sans-serif;padding:20px;">${body.replace(/\n/g, "<br>")}</div>`;
    }

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
      content: textContent,
      html: htmlContent,
    });

    await client.close();

    console.log(`Report email sent to ${recipientEmail} for account: ${reportData?.accountName || "unknown"}`);

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
