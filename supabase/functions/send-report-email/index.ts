import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function buildReportHtml(data: any): string {
  const { accountName, date, kpis, campaigns, insights, totalCampaigns, activeCampaigns } = data;

  const campaignRows = (campaigns || []).map((c: any, i: number) => `
    <tr style="background:${i % 2 === 0 ? '#0f172a' : '#131d36'};">
      <td style="padding:12px 14px;font-size:13px;color:#e2e8f0;border-bottom:1px solid #1e293b;max-width:220px;">
        <div style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${c.name}</div>
      </td>
      <td style="padding:12px 10px;font-size:13px;text-align:center;color:#60a5fa;font-weight:600;border-bottom:1px solid #1e293b;font-family:'Courier New',monospace;">${c.spend}</td>
      <td style="padding:12px 10px;font-size:13px;text-align:center;color:#34d399;font-weight:600;border-bottom:1px solid #1e293b;font-family:'Courier New',monospace;">${c.leads}</td>
      <td style="padding:12px 10px;font-size:13px;text-align:center;color:#fbbf24;font-weight:600;border-bottom:1px solid #1e293b;font-family:'Courier New',monospace;">${c.cpl}</td>
      <td style="padding:12px 10px;font-size:13px;text-align:center;color:#e2e8f0;border-bottom:1px solid #1e293b;font-family:'Courier New',monospace;">${c.ctr}</td>
      <td style="padding:12px 10px;font-size:13px;text-align:center;color:#a78bfa;font-weight:600;border-bottom:1px solid #1e293b;font-family:'Courier New',monospace;">${c.roas}</td>
    </tr>
  `).join("");

  const insightItems = (insights || []).map((insight: string) => `
    <tr>
      <td style="padding:10px 14px;border-bottom:1px solid #1e293b;font-size:13px;color:#cbd5e1;line-height:1.6;">
        ${insight}
      </td>
    </tr>
  `).join("");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>MetaPulse Report</title>
</head>
<body style="margin:0;padding:0;background-color:#ffffff;font-family:Arial,Helvetica,sans-serif;">

<!-- Dark wrapper for email clients that support it -->
<div style="max-width:680px;margin:0 auto;background:#0a0f1e;border-radius:16px;overflow:hidden;">

  <!-- ═══════════ HEADER ═══════════ -->
  <div style="background:linear-gradient(135deg,#1e3a8a 0%,#3b82f6 50%,#6366f1 100%);padding:32px 28px;position:relative;">
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      <td>
        <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,0.5);margin-bottom:6px;">PERFORMANCE REPORT</div>
        <div style="font-size:24px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">📊 MetaPulse Analytics</div>
        <div style="font-size:14px;color:rgba(255,255,255,0.85);margin-top:8px;">${accountName}</div>
        <div style="font-size:12px;color:rgba(255,255,255,0.55);margin-top:4px;">${date}</div>
      </td>
      <td style="text-align:right;vertical-align:top;">
        <div style="display:inline-block;background:rgba(255,255,255,0.15);border-radius:20px;padding:6px 14px;">
          <span style="font-size:11px;color:rgba(255,255,255,0.9);">● ${activeCampaigns} Active</span>
          <span style="font-size:11px;color:rgba(255,255,255,0.5);margin-left:8px;">${totalCampaigns} Total</span>
        </div>
      </td>
    </tr></table>
  </div>

  <!-- ═══════════ KPI CARDS ═══════════ -->
  <div style="padding:24px 20px 8px;">
    <div style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#64748b;margin-bottom:14px;padding-left:4px;">KEY METRICS</div>
    
    <!-- Row 1: Primary KPIs -->
    <table width="100%" cellpadding="0" cellspacing="8" style="border-collapse:separate;">
      <tr>
        <td width="25%" style="background:linear-gradient(135deg,#0f2167,#1e3a8a);border-radius:12px;padding:18px 14px;text-align:center;border:1px solid #1e3a8a;">
          <div style="font-size:22px;font-weight:800;color:#60a5fa;font-family:'Courier New',monospace;letter-spacing:-0.5px;">${kpis.spend}</div>
          <div style="font-size:10px;color:#64748b;margin-top:6px;text-transform:uppercase;letter-spacing:1px;">Spend</div>
        </td>
        <td width="25%" style="background:linear-gradient(135deg,#052e16,#14532d);border-radius:12px;padding:18px 14px;text-align:center;border:1px solid #14532d;">
          <div style="font-size:22px;font-weight:800;color:#34d399;font-family:'Courier New',monospace;letter-spacing:-0.5px;">${kpis.leads}</div>
          <div style="font-size:10px;color:#64748b;margin-top:6px;text-transform:uppercase;letter-spacing:1px;">Leads</div>
        </td>
        <td width="25%" style="background:linear-gradient(135deg,#422006,#713f12);border-radius:12px;padding:18px 14px;text-align:center;border:1px solid #713f12;">
          <div style="font-size:22px;font-weight:800;color:#fbbf24;font-family:'Courier New',monospace;letter-spacing:-0.5px;">${kpis.cpl}</div>
          <div style="font-size:10px;color:#64748b;margin-top:6px;text-transform:uppercase;letter-spacing:1px;">CPL</div>
        </td>
        <td width="25%" style="background:linear-gradient(135deg,#2e1065,#4c1d95);border-radius:12px;padding:18px 14px;text-align:center;border:1px solid #4c1d95;">
          <div style="font-size:22px;font-weight:800;color:#a78bfa;font-family:'Courier New',monospace;letter-spacing:-0.5px;">${kpis.roas}</div>
          <div style="font-size:10px;color:#64748b;margin-top:6px;text-transform:uppercase;letter-spacing:1px;">ROAS</div>
        </td>
      </tr>
    </table>

    <!-- Row 2: Secondary KPIs -->
    <table width="100%" cellpadding="0" cellspacing="8" style="border-collapse:separate;margin-top:0;">
      <tr>
        <td width="25%" style="background:#111827;border-radius:10px;padding:14px 10px;text-align:center;border:1px solid #1e293b;">
          <div style="font-size:16px;font-weight:700;color:#e2e8f0;font-family:'Courier New',monospace;">${kpis.impressions}</div>
          <div style="font-size:9px;color:#64748b;margin-top:4px;text-transform:uppercase;letter-spacing:1px;">Impressions</div>
        </td>
        <td width="25%" style="background:#111827;border-radius:10px;padding:14px 10px;text-align:center;border:1px solid #1e293b;">
          <div style="font-size:16px;font-weight:700;color:#e2e8f0;font-family:'Courier New',monospace;">${kpis.clicks}</div>
          <div style="font-size:9px;color:#64748b;margin-top:4px;text-transform:uppercase;letter-spacing:1px;">Clicks</div>
        </td>
        <td width="25%" style="background:#111827;border-radius:10px;padding:14px 10px;text-align:center;border:1px solid #1e293b;">
          <div style="font-size:16px;font-weight:700;color:#38bdf8;font-family:'Courier New',monospace;">${kpis.ctr}</div>
          <div style="font-size:9px;color:#64748b;margin-top:4px;text-transform:uppercase;letter-spacing:1px;">CTR</div>
        </td>
        <td width="25%" style="background:#111827;border-radius:10px;padding:14px 10px;text-align:center;border:1px solid #1e293b;">
          <div style="font-size:16px;font-weight:700;color:#e2e8f0;font-family:'Courier New',monospace;">${kpis.cpc}</div>
          <div style="font-size:9px;color:#64748b;margin-top:4px;text-transform:uppercase;letter-spacing:1px;">CPC</div>
        </td>
      </tr>
    </table>
  </div>

  <!-- ═══════════ CAMPAIGN TABLE ═══════════ -->
  ${campaigns && campaigns.length > 0 ? `
  <div style="padding:20px 20px 8px;">
    <div style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#64748b;margin-bottom:14px;padding-left:4px;">CAMPAIGN BREAKDOWN</div>
    <div style="border-radius:12px;overflow:hidden;border:1px solid #1e293b;">
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
        <thead>
          <tr style="background:#0f172a;">
            <th style="padding:12px 14px;font-size:10px;text-align:left;color:#475569;text-transform:uppercase;letter-spacing:1px;border-bottom:2px solid #1e3a8a;">Campaign</th>
            <th style="padding:12px 10px;font-size:10px;text-align:center;color:#475569;text-transform:uppercase;letter-spacing:1px;border-bottom:2px solid #1e3a8a;">Spend</th>
            <th style="padding:12px 10px;font-size:10px;text-align:center;color:#475569;text-transform:uppercase;letter-spacing:1px;border-bottom:2px solid #1e3a8a;">Leads</th>
            <th style="padding:12px 10px;font-size:10px;text-align:center;color:#475569;text-transform:uppercase;letter-spacing:1px;border-bottom:2px solid #1e3a8a;">CPL</th>
            <th style="padding:12px 10px;font-size:10px;text-align:center;color:#475569;text-transform:uppercase;letter-spacing:1px;border-bottom:2px solid #1e3a8a;">CTR</th>
            <th style="padding:12px 10px;font-size:10px;text-align:center;color:#475569;text-transform:uppercase;letter-spacing:1px;border-bottom:2px solid #1e3a8a;">ROAS</th>
          </tr>
        </thead>
        <tbody>
          ${campaignRows}
        </tbody>
      </table>
    </div>
  </div>
  ` : ""}

  <!-- ═══════════ AI INSIGHTS ═══════════ -->
  ${insights && insights.length > 0 ? `
  <div style="padding:20px 20px 8px;">
    <div style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#64748b;margin-bottom:14px;padding-left:4px;">🤖 AI INSIGHTS</div>
    <div style="border-radius:12px;overflow:hidden;border:1px solid #1e293b;background:linear-gradient(180deg,#0f172a,#111827);">
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
        ${insightItems}
      </table>
    </div>
  </div>
  ` : ""}

  <!-- ═══════════ FOOTER ═══════════ -->
  <div style="padding:24px 20px;text-align:center;border-top:1px solid #1e293b;margin-top:16px;">
    <div style="display:inline-block;background:linear-gradient(135deg,#3b82f6,#6366f1);border-radius:20px;padding:6px 16px;margin-bottom:12px;">
      <span style="font-size:11px;font-weight:700;color:#ffffff;letter-spacing:0.5px;">MetaPulse Analytics</span>
    </div>
    <div style="font-size:11px;color:#475569;margin-top:8px;">${date}</div>
    <div style="font-size:10px;color:#334155;margin-top:4px;">AI-Powered Meta Ads Intelligence Platform</div>
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
