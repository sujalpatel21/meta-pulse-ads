import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// KPI card colors
const KPI_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  spend:          { bg: "#0f2167", border: "#1e3a8a", text: "#60a5fa" },
  leads:          { bg: "#052e16", border: "#14532d", text: "#34d399" },
  cpl:            { bg: "#422006", border: "#713f12", text: "#fbbf24" },
  roas:           { bg: "#2e1065", border: "#4c1d95", text: "#a78bfa" },
  impressions:    { bg: "#111827", border: "#1e293b", text: "#e2e8f0" },
  clicks:         { bg: "#111827", border: "#1e293b", text: "#e2e8f0" },
  ctr:            { bg: "#0c4a6e", border: "#0369a1", text: "#38bdf8" },
  cpc:            { bg: "#111827", border: "#1e293b", text: "#e2e8f0" },
  purchases:      { bg: "#052e16", border: "#14532d", text: "#34d399" },
  conversionRate: { bg: "#0c4a6e", border: "#0369a1", text: "#38bdf8" },
  cpm:            { bg: "#422006", border: "#713f12", text: "#fbbf24" },
};

const KPI_LABELS: Record<string, string> = {
  spend: "Spend", leads: "Leads", cpl: "CPL", roas: "ROAS",
  impressions: "Impressions", clicks: "Clicks", ctr: "CTR",
  cpc: "CPC", purchases: "Purchases", conversionRate: "Conv. Rate", cpm: "CPM",
};

function buildReportHtml(data: any): string {
  const {
    accountName, date, dateRangeLabel, kpis, metricColumns,
    campaigns, adSets, insights, totalCampaigns, activeCampaigns, levels,
  } = data;

  // ── KPI Cards ──
  const kpiEntries = Object.entries(kpis || {}) as [string, string][];
  const kpiCards = kpiEntries.map(([key, value]) => {
    const colors = KPI_COLORS[key] || KPI_COLORS.impressions;
    const label = KPI_LABELS[key] || key.toUpperCase();
    return `
      <td style="background:linear-gradient(135deg,${colors.bg},${colors.border});border-radius:12px;padding:16px 10px;text-align:center;border:1px solid ${colors.border};">
        <div style="font-size:20px;font-weight:800;color:${colors.text};font-family:'Courier New',monospace;letter-spacing:-0.5px;">${value}</div>
        <div style="font-size:9px;color:#64748b;margin-top:5px;text-transform:uppercase;letter-spacing:1px;">${label}</div>
      </td>`;
  }).join("");

  // Split KPIs into rows of 4
  const kpiRows: string[] = [];
  for (let i = 0; i < kpiEntries.length; i += 4) {
    const slice = kpiEntries.slice(i, i + 4);
    const cells = slice.map(([key, value]) => {
      const colors = KPI_COLORS[key] || KPI_COLORS.impressions;
      const label = KPI_LABELS[key] || key.toUpperCase();
      return `<td width="${100 / Math.min(slice.length, 4)}%" style="background:linear-gradient(135deg,${colors.bg},${colors.border});border-radius:12px;padding:16px 10px;text-align:center;border:1px solid ${colors.border};">
        <div style="font-size:20px;font-weight:800;color:${colors.text};font-family:'Courier New',monospace;letter-spacing:-0.5px;">${value}</div>
        <div style="font-size:9px;color:#64748b;margin-top:5px;text-transform:uppercase;letter-spacing:1px;">${label}</div>
      </td>`;
    }).join("");
    kpiRows.push(`<table width="100%" cellpadding="0" cellspacing="8" style="border-collapse:separate;${i > 0 ? 'margin-top:0;' : ''}"><tr>${cells}</tr></table>`);
  }

  // ── Campaign Table ──
  const cols = (metricColumns || []) as { key: string; label: string }[];
  const headerCells = cols.map((c: any) =>
    `<th style="padding:10px 8px;font-size:10px;text-align:center;color:#475569;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #1e3a8a;">${c.label}</th>`
  ).join("");

  const campaignRows = (campaigns || []).map((camp: any, i: number) => {
    const metricCells = cols.map((c: any) => {
      const val = camp[c.key] || "—";
      const color = c.key === "spend" ? "#60a5fa" : c.key === "leads" ? "#34d399" : c.key === "cpl" ? "#fbbf24" : c.key === "roas" ? "#a78bfa" : c.key === "ctr" ? "#38bdf8" : "#e2e8f0";
      return `<td style="padding:10px 8px;font-size:12px;text-align:center;color:${color};font-weight:600;border-bottom:1px solid #1e293b;font-family:'Courier New',monospace;">${val}</td>`;
    }).join("");
    return `<tr style="background:${i % 2 === 0 ? '#0f172a' : '#131d36'};">
      <td style="padding:10px 12px;font-size:12px;color:#e2e8f0;border-bottom:1px solid #1e293b;max-width:200px;"><div style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${camp.name}</div></td>
      ${metricCells}
    </tr>`;
  }).join("");

  // ── Ad Set Table ──
  let adSetSection = "";
  if (adSets && adSets.length > 0) {
    const adSetRowsHtml = adSets.map((as: any, i: number) => {
      const metricCells = cols.map((c: any) => {
        const val = as[c.key] || "—";
        const color = c.key === "spend" ? "#60a5fa" : c.key === "leads" ? "#34d399" : c.key === "cpl" ? "#fbbf24" : "#e2e8f0";
        return `<td style="padding:8px;font-size:11px;text-align:center;color:${color};font-weight:600;border-bottom:1px solid #1e293b;font-family:'Courier New',monospace;">${val}</td>`;
      }).join("");
      return `<tr style="background:${i % 2 === 0 ? '#0f172a' : '#131d36'};">
        <td style="padding:8px 12px;font-size:11px;color:#94a3b8;border-bottom:1px solid #1e293b;">${as.campaignName || ""}</td>
        <td style="padding:8px 12px;font-size:11px;color:#e2e8f0;border-bottom:1px solid #1e293b;max-width:180px;"><div style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${as.name}</div></td>
        ${metricCells}
      </tr>`;
    }).join("");

    const adSetHeaderCells = cols.map((c: any) =>
      `<th style="padding:8px;font-size:9px;text-align:center;color:#475569;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #14532d;">${c.label}</th>`
    ).join("");

    adSetSection = `
    <div style="padding:20px 20px 8px;">
      <div style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#64748b;margin-bottom:14px;padding-left:4px;">📋 AD SET BREAKDOWN</div>
      <div style="border-radius:12px;overflow:hidden;border:1px solid #1e293b;">
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
          <thead><tr style="background:#0f172a;">
            <th style="padding:8px 12px;font-size:9px;text-align:left;color:#475569;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #14532d;">Campaign</th>
            <th style="padding:8px 12px;font-size:9px;text-align:left;color:#475569;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #14532d;">Ad Set</th>
            ${adSetHeaderCells}
          </tr></thead>
          <tbody>${adSetRowsHtml}</tbody>
        </table>
      </div>
    </div>`;
  }

  // ── Insights ──
  const insightItems = (insights || []).map((insight: string) => `
    <tr><td style="padding:10px 14px;border-bottom:1px solid #1e293b;font-size:13px;color:#cbd5e1;line-height:1.6;">${insight}</td></tr>
  `).join("");

  // ── Level badges ──
  const levelBadges = (levels || ["campaign"]).map((l: string) =>
    `<span style="display:inline-block;font-size:10px;color:#94a3b8;background:#1e293b;border-radius:10px;padding:3px 10px;margin-right:4px;text-transform:capitalize;">${l}</span>`
  ).join("");

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#ffffff;font-family:Arial,Helvetica,sans-serif;">
<div style="max-width:700px;margin:0 auto;background:#0a0f1e;border-radius:16px;overflow:hidden;">

  <!-- HEADER -->
  <div style="background:linear-gradient(135deg,#1e3a8a 0%,#3b82f6 50%,#6366f1 100%);padding:32px 28px;">
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      <td>
        <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,0.5);margin-bottom:6px;">PERFORMANCE REPORT</div>
        <div style="font-size:24px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">📊 MetaPulse Analytics</div>
        <div style="font-size:14px;color:rgba(255,255,255,0.85);margin-top:8px;">${accountName}</div>
        <div style="font-size:12px;color:rgba(255,255,255,0.55);margin-top:4px;">${date} · ${dateRangeLabel || "Last 30 Days"}</div>
      </td>
      <td style="text-align:right;vertical-align:top;">
        <div style="display:inline-block;background:rgba(255,255,255,0.15);border-radius:20px;padding:6px 14px;">
          <span style="font-size:11px;color:rgba(255,255,255,0.9);">● ${activeCampaigns} Active</span>
          <span style="font-size:11px;color:rgba(255,255,255,0.5);margin-left:8px;">${totalCampaigns} Total</span>
        </div>
        <div style="margin-top:6px;">${levelBadges}</div>
      </td>
    </tr></table>
  </div>

  <!-- KPI CARDS -->
  <div style="padding:24px 20px 8px;">
    <div style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#64748b;margin-bottom:14px;padding-left:4px;">KEY METRICS</div>
    ${kpiRows.join("")}
  </div>

  <!-- CAMPAIGN TABLE -->
  ${campaigns && campaigns.length > 0 ? `
  <div style="padding:20px 20px 8px;">
    <div style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#64748b;margin-bottom:14px;padding-left:4px;">📈 CAMPAIGN BREAKDOWN</div>
    <div style="border-radius:12px;overflow:hidden;border:1px solid #1e293b;">
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
        <thead><tr style="background:#0f172a;">
          <th style="padding:10px 12px;font-size:10px;text-align:left;color:#475569;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #1e3a8a;">Campaign</th>
          ${headerCells}
        </tr></thead>
        <tbody>${campaignRows}</tbody>
      </table>
    </div>
  </div>` : ""}

  <!-- AD SET TABLE -->
  ${adSetSection}

  <!-- AI INSIGHTS -->
  ${insights && insights.length > 0 ? `
  <div style="padding:20px 20px 8px;">
    <div style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#64748b;margin-bottom:14px;padding-left:4px;">🤖 AI INSIGHTS</div>
    <div style="border-radius:12px;overflow:hidden;border:1px solid #1e293b;background:linear-gradient(180deg,#0f172a,#111827);">
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">${insightItems}</table>
    </div>
  </div>` : ""}

  <!-- FOOTER -->
  <div style="padding:24px 20px;text-align:center;border-top:1px solid #1e293b;margin-top:16px;">
    <div style="display:inline-block;background:linear-gradient(135deg,#3b82f6,#6366f1);border-radius:20px;padding:6px 16px;margin-bottom:12px;">
      <span style="font-size:11px;font-weight:700;color:#ffffff;letter-spacing:0.5px;">MetaPulse Analytics</span>
    </div>
    <div style="font-size:11px;color:#475569;margin-top:8px;">${date}</div>
    <div style="font-size:10px;color:#334155;margin-top:4px;">AI-Powered Meta Ads Intelligence Platform</div>
  </div>

</div>
</body></html>`;
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
      const kpis = reportData.kpis || {};
      textContent = [
        `MetaPulse Performance Report — ${reportData.accountName}`,
        `Period: ${reportData.dateRangeLabel || "Last 30 Days"}`,
        `Date: ${reportData.date}`,
        "",
        "Key Metrics:",
        ...Object.entries(kpis).map(([k, v]) => `  ${k}: ${v}`),
        "",
        "AI Insights:",
        ...(reportData.insights || []).map((i: string) => `  • ${i}`),
      ].join("\n");
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
      subject,
      content: "auto",
      html: htmlContent,
    });

    await client.close();

    console.log(`Report email sent to ${recipientEmail} for: ${reportData?.accountName || "unknown"}`);

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
