// ================================================================
// METAFLOW ANALYTICS — Meta Ads Service Layer
// 
// This service abstracts all data fetching.
// Currently returns mock data — replace implementations with
// Meta Marketing API calls when ready.
//
// Meta API Docs: https://developers.facebook.com/docs/marketing-apis/
// ================================================================

import { mockClients, Client, Campaign, AdAccount, AdSet, Ad } from "@/data/mockData";

export interface DateRange {
  from: string; // ISO date: "YYYY-MM-DD"
  to: string;
}

// ── IMPORTANT: Meta API Integration Points ────────────────────────
//
// When integrating the real Meta Marketing API:
// 1. Move all API calls to Supabase Edge Functions (server-side only)
// 2. Store Meta Access Token as a Supabase secret (never expose to frontend)
// 3. Use the following Edge Function pattern:
//
//    supabase/functions/meta-ads/index.ts:
//    const response = await fetch(
//      `https://graph.facebook.com/v19.0/${accountId}/campaigns`,
//      {
//        headers: {
//          Authorization: `Bearer ${Deno.env.get("META_ACCESS_TOKEN")}`
//        }
//      }
//    );
//
// 4. Frontend calls: supabase.functions.invoke("meta-ads", { body: { accountId, dateRange } })
// ─────────────────────────────────────────────────────────────────

// ── Client Operations ─────────────────────────────────────────────

export async function fetchClients(): Promise<Client[]> {
  // TODO: Replace with: supabase.functions.invoke("meta-ads/clients")
  await simulateDelay(300);
  return mockClients;
}

export async function fetchClientById(clientId: string): Promise<Client | null> {
  // TODO: Replace with: supabase.functions.invoke("meta-ads/clients", { body: { clientId } })
  await simulateDelay(200);
  return mockClients.find((c) => c.clientId === clientId) || null;
}

// ── Ad Account Operations ─────────────────────────────────────────

export async function fetchAdAccounts(clientId: string): Promise<AdAccount[]> {
  // TODO: Replace with Meta Graph API: GET /{business-id}/owned_ad_accounts
  await simulateDelay(200);
  const client = mockClients.find((c) => c.clientId === clientId);
  return client?.adAccounts || [];
}

// ── Campaign Operations ───────────────────────────────────────────

export async function fetchCampaigns(
  accountId: string,
  _dateRange?: DateRange
): Promise<Campaign[]> {
  // TODO: Replace with Meta Graph API: GET /act_{accountId}/campaigns
  // Fields: name,objective,status,daily_budget,lifetime_budget,insights{spend,impressions,clicks}
  // Date range: time_range={"since":"2024-01-01","until":"2024-01-31"}
  await simulateDelay(400);

  for (const client of mockClients) {
    for (const account of client.adAccounts) {
      if (account.accountId === accountId) {
        return account.campaigns;
      }
    }
  }
  return [];
}

export async function fetchCampaignById(
  campaignId: string,
  _dateRange?: DateRange
): Promise<Campaign | null> {
  // TODO: Replace with Meta Graph API: GET /{campaign-id}
  await simulateDelay(250);

  for (const client of mockClients) {
    for (const account of client.adAccounts) {
      const campaign = account.campaigns.find((c) => c.campaignId === campaignId);
      if (campaign) return campaign;
    }
  }
  return null;
}

// ── Ad Set Operations ─────────────────────────────────────────────

export async function fetchAdSets(
  campaignId: string,
  _dateRange?: DateRange
): Promise<AdSet[]> {
  // TODO: Replace with Meta Graph API: GET /{campaign-id}/adsets
  // Fields: name,status,daily_budget,targeting,insights{spend,impressions,clicks,reach,frequency}
  await simulateDelay(300);

  for (const client of mockClients) {
    for (const account of client.adAccounts) {
      const campaign = account.campaigns.find((c) => c.campaignId === campaignId);
      if (campaign) return campaign.adSets;
    }
  }
  return [];
}

// ── Ad Operations ─────────────────────────────────────────────────

export async function fetchAds(
  adSetId: string,
  _dateRange?: DateRange
): Promise<Ad[]> {
  // TODO: Replace with Meta Graph API: GET /{adset-id}/ads
  // Fields: name,status,creative{thumbnail_url},insights{spend,clicks,impressions,actions}
  await simulateDelay(300);

  for (const client of mockClients) {
    for (const account of client.adAccounts) {
      for (const campaign of account.campaigns) {
        const adSet = campaign.adSets.find((as) => as.adSetId === adSetId);
        if (adSet) return adSet.ads;
      }
    }
  }
  return [];
}

// ── Insights / Analytics ──────────────────────────────────────────

export async function fetchAccountInsights(
  accountId: string,
  _dateRange?: DateRange
) {
  // TODO: Replace with Meta Graph API: GET /act_{accountId}/insights
  // Fields: spend,impressions,clicks,reach,actions,cost_per_action_type,purchase_roas
  await simulateDelay(350);

  for (const client of mockClients) {
    for (const account of client.adAccounts) {
      if (account.accountId === accountId) {
        return account.campaigns;
      }
    }
  }
  return [];
}

// ── Alerts Engine ─────────────────────────────────────────────────

export interface Alert {
  id: string;
  type: "critical" | "warning" | "healthy";
  title: string;
  message: string;
  metric: string;
  value: number;
  threshold: number;
  campaign?: string;
  timestamp: Date;
}

export async function generateAlerts(campaigns: Campaign[]): Promise<Alert[]> {
  // TODO: In production, run this logic server-side on a schedule
  await simulateDelay(200);

  const alerts: Alert[] = [];

  campaigns.forEach((c) => {
    const cpl = c.leads > 0 ? c.spend / c.leads : 0;

    // CPL too high (> ₹500)
    if (cpl > 500 && c.leads > 0) {
      alerts.push({
        id: `cpl-high-${c.campaignId}`,
        type: "critical",
        title: "High Cost Per Lead",
        message: `Campaign "${c.name}" has CPL of ₹${cpl.toFixed(0)}, exceeding ₹500 threshold.`,
        metric: "CPL",
        value: cpl,
        threshold: 500,
        campaign: c.name,
        timestamp: new Date(),
      });
    }

    // ROAS dropped below 2
    if (c.roas > 0 && c.roas < 2) {
      alerts.push({
        id: `roas-low-${c.campaignId}`,
        type: c.roas < 1.5 ? "critical" : "warning",
        title: "Low ROAS",
        message: `Campaign "${c.name}" ROAS is ${c.roas.toFixed(1)}x, below the 2x target.`,
        metric: "ROAS",
        value: c.roas,
        threshold: 2,
        campaign: c.name,
        timestamp: new Date(),
      });
    }

    // Overspend (spend > budget)
    if (c.spend > c.budget) {
      const pct = ((c.spend - c.budget) / c.budget) * 100;
      alerts.push({
        id: `overspend-${c.campaignId}`,
        type: pct > 20 ? "critical" : "warning",
        title: "Budget Overspend",
        message: `Campaign "${c.name}" spent ₹${c.spend.toLocaleString("en-IN")} against ₹${c.budget.toLocaleString("en-IN")} budget (${pct.toFixed(1)}% over).`,
        metric: "Spend",
        value: c.spend,
        threshold: c.budget,
        campaign: c.name,
        timestamp: new Date(),
      });
    }

    // Good CTR (> 3.5%) - healthy alert
    if (c.ctr > 3.5 && c.leads > 0) {
      alerts.push({
        id: `ctr-good-${c.campaignId}`,
        type: "healthy",
        title: "Strong CTR Performance",
        message: `Campaign "${c.name}" achieving ${c.ctr.toFixed(2)}% CTR — well above industry average of 2%.`,
        metric: "CTR",
        value: c.ctr,
        threshold: 2,
        campaign: c.name,
        timestamp: new Date(),
      });
    }
  });

  return alerts;
}

// ── AI Insights Engine ────────────────────────────────────────────

export async function generateAIInsights(campaigns: Campaign[]): Promise<string[]> {
  // TODO: Replace with OpenAI / Gemini API call via Edge Function:
  // supabase.functions.invoke("ai-insights", { body: { campaigns, dateRange } })
  await simulateDelay(500);

  const insights: string[] = [];
  const active = campaigns.filter((c) => c.status === "Active");
  const totalSpend = active.reduce((s, c) => s + c.spend, 0);
  const totalLeads = active.reduce((s, c) => s + c.leads, 0);

  if (active.length === 0) return ["No active campaigns found for analysis."];

  // Top performing campaign
  const topByLeads = [...active].sort((a, b) => b.leads - a.leads)[0];
  if (topByLeads && totalLeads > 0) {
    const pct = Math.round((topByLeads.leads / totalLeads) * 100);
    insights.push(
      `🏆 Campaign <strong>"${topByLeads.name}"</strong> is your top performer, generating ${pct}% of total leads (${topByLeads.leads} leads). Consider increasing its budget by 15–20%.`
    );
  }

  // Efficiency insight
  const bestCPL = [...active.filter((c) => c.leads > 0)].sort(
    (a, b) => a.spend / a.leads - b.spend / b.leads
  )[0];
  if (bestCPL) {
    const cpl = (bestCPL.spend / bestCPL.leads).toFixed(0);
    insights.push(
      `💡 "<strong>${bestCPL.name}</strong>" has the lowest CPL at ₹${cpl}. This campaign's audience and creative combination is working well — replicate this approach in other campaigns.`
    );
  }

  // Fatigue detection across all adsets
  let fatigueCount = 0;
  campaigns.forEach((c) => {
    c.adSets.forEach((as) => {
      as.ads.forEach((ad) => {
        if (ad.fatigue) fatigueCount++;
      });
    });
  });

  if (fatigueCount > 0) {
    insights.push(
      `⚠️ <strong>${fatigueCount} ads</strong> show creative fatigue signs (CTR drop or high frequency). Refresh these creatives to prevent performance decline.`
    );
  }

  // Overall spend insight
  const avgRoas = active.filter((c) => c.roas > 0).reduce((s, c) => s + c.roas, 0) / (active.filter((c) => c.roas > 0).length || 1);
  insights.push(
    `📊 Total active spend is <strong>₹${totalSpend.toLocaleString("en-IN")}</strong> generating ${totalLeads} leads at an average ROAS of <strong>${avgRoas.toFixed(1)}x</strong>. Overall account health is ${avgRoas > 2.5 ? "strong 🟢" : avgRoas > 1.5 ? "moderate 🟡" : "needs attention 🔴"}.`
  );

  return insights;
}

// ── Helpers ───────────────────────────────────────────────────────

function simulateDelay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function formatINR(amount: number): string {
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)}L`;
  }
  if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(1)}K`;
  }
  return `₹${amount.toFixed(0)}`;
}

export function formatNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toFixed(0);
}
