// ================================================================
// METAFLOW ANALYTICS — Meta Ads Service Layer
// 
// Calls the meta-ads edge function which proxies Meta Graph API.
// Falls back to mock data if API call fails.
// ================================================================

import { supabase } from "@/integrations/supabase/client";
import { mockClients, Client, Campaign, AdAccount, AdSet, Ad, DailyMetric, ABTest, getABTestsForAccount, getAllABTests } from "@/data/mockData";

export interface DateRange {
  from: string; // ISO date: "YYYY-MM-DD"
  to: string;
}

// ── Live mode flag ────────────────────────────────────────────────
let _useLiveData = true;

export function setUseLiveData(live: boolean) {
  _useLiveData = live;
}

export function getUseLiveData() {
  return _useLiveData;
}

// ── Edge Function Caller ──────────────────────────────────────────

async function callMetaApi(action: string, params: Record<string, any> = {}): Promise<any> {
  const { data, error } = await supabase.functions.invoke("meta-ads", {
    body: { action, ...params },
  });

  if (error) {
    console.error(`Meta API [${action}] error:`, error);
    throw error;
  }

  if (data?.error) {
    console.error(`Meta API [${action}] returned error:`, data.error);
    throw new Error(data.error);
  }

  return data;
}

// ── Date range helper ─────────────────────────────────────────────

export function getDateRangeFromPreset(preset: string): DateRange {
  const today = new Date();
  const fmt = (d: Date) => d.toISOString().split("T")[0];

  switch (preset) {
    case "today":
      return { from: fmt(today), to: fmt(today) };
    case "yesterday": {
      const y = new Date(today);
      y.setDate(y.getDate() - 1);
      return { from: fmt(y), to: fmt(y) };
    }
    case "last7": {
      const d = new Date(today);
      d.setDate(d.getDate() - 6);
      return { from: fmt(d), to: fmt(today) };
    }
    case "last14": {
      const d = new Date(today);
      d.setDate(d.getDate() - 13);
      return { from: fmt(d), to: fmt(today) };
    }
    case "last30": {
      const d = new Date(today);
      d.setDate(d.getDate() - 29);
      return { from: fmt(d), to: fmt(today) };
    }
    case "thisWeek": {
      const day = today.getDay(); // 0=Sun
      const diff = day === 0 ? 6 : day - 1; // Monday as start
      const monday = new Date(today);
      monday.setDate(today.getDate() - diff);
      return { from: fmt(monday), to: fmt(today) };
    }
    case "thisMonth": {
      const first = new Date(today.getFullYear(), today.getMonth(), 1);
      return { from: fmt(first), to: fmt(today) };
    }
    case "lastMonth": {
      const first = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const last = new Date(today.getFullYear(), today.getMonth(), 0);
      return { from: fmt(first), to: fmt(last) };
    }
    default:
      return { from: fmt(new Date(today.getTime() - 6 * 86400000)), to: fmt(today) };
  }
}

// ── Ad Account Operations ─────────────────────────────────────────

export async function fetchAdAccounts(): Promise<any[]> {
  if (!_useLiveData) {
    return mockClients.flatMap((c) => c.adAccounts);
  }

  const accounts = await callMetaApi("get_ad_accounts");
  return accounts.map((a: any) => ({
    accountId: a.accountId,
    accountName: a.accountName,
    currency: a.currency,
    accountStatus: a.accountStatus,
    campaigns: [],
  }));
}

// ── Campaign Operations ───────────────────────────────────────────

export async function fetchCampaigns(
  accountId: string,
  dateRange?: DateRange
): Promise<Campaign[]> {
  if (!_useLiveData) {
    for (const client of mockClients) {
      for (const account of client.adAccounts) {
        if (account.accountId === accountId) return account.campaigns;
      }
    }
    return [];
  }

  return await callMetaApi("get_campaigns", { accountId, dateRange });
}

// ── Ad Set Operations ─────────────────────────────────────────────

export async function fetchAdSets(
  campaignId: string,
  dateRange?: DateRange
): Promise<AdSet[]> {
  if (!_useLiveData) {
    for (const client of mockClients) {
      for (const account of client.adAccounts) {
        const campaign = account.campaigns.find((c) => c.campaignId === campaignId);
        if (campaign) return campaign.adSets;
      }
    }
    return [];
  }

  try {
    return await callMetaApi("get_adsets", { campaignId, dateRange });
  } catch (e) {
    console.warn("Falling back to mock ad sets:", e);
    for (const client of mockClients) {
      for (const account of client.adAccounts) {
        const campaign = account.campaigns.find((c) => c.campaignId === campaignId);
        if (campaign) return campaign.adSets;
      }
    }
    return [];
  }
}

// ── Ad Operations ─────────────────────────────────────────────────

export async function fetchAds(
  adSetId: string,
  dateRange?: DateRange
): Promise<Ad[]> {
  if (!_useLiveData) {
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

  try {
    return await callMetaApi("get_ads", { adSetId, dateRange });
  } catch (e) {
    console.warn("Falling back to mock ads:", e);
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
}

// ── Insights / Daily Metrics ──────────────────────────────────────

export async function fetchDailyInsights(
  accountId: string,
  dateRange?: DateRange
): Promise<DailyMetric[]> {
  if (!_useLiveData) return [];

  try {
    return await callMetaApi("get_insights", { accountId, dateRange });
  } catch (e) {
    console.warn("Falling back to empty insights:", e);
    return [];
  }
}

export async function fetchCampaignDailyInsights(
  campaignId: string,
  dateRange?: DateRange
): Promise<DailyMetric[]> {
  if (!_useLiveData) return [];

  try {
    return await callMetaApi("get_campaign_insights", { campaignId, dateRange });
  } catch (e) {
    console.warn("Falling back to empty campaign insights:", e);
    return [];
  }
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
  const alerts: Alert[] = [];

  campaigns.forEach((c) => {
    const cpl = c.leads > 0 ? c.spend / c.leads : 0;

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

    if (c.spend > c.budget && c.budget > 0) {
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
  const insights: string[] = [];
  const active = campaigns.filter((c) => c.status === "Active");
  const totalSpend = active.reduce((s, c) => s + c.spend, 0);
  const totalLeads = active.reduce((s, c) => s + c.leads, 0);

  if (active.length === 0) return ["No active campaigns found for analysis."];

  const topByLeads = [...active].sort((a, b) => b.leads - a.leads)[0];
  if (topByLeads && totalLeads > 0) {
    const pct = Math.round((topByLeads.leads / totalLeads) * 100);
    insights.push(
      `🏆 Campaign <strong>"${topByLeads.name}"</strong> is your top performer, generating ${pct}% of total leads (${topByLeads.leads} leads). Consider increasing its budget by 15–20%.`
    );
  }

  const bestCPL = [...active.filter((c) => c.leads > 0)].sort(
    (a, b) => a.spend / a.leads - b.spend / b.leads
  )[0];
  if (bestCPL) {
    const cpl = (bestCPL.spend / bestCPL.leads).toFixed(0);
    insights.push(
      `💡 "<strong>${bestCPL.name}</strong>" has the lowest CPL at ₹${cpl}. This campaign's audience and creative combination is working well — replicate this approach in other campaigns.`
    );
  }

  let fatigueCount = 0;
  campaigns.forEach((c) => {
    c.adSets?.forEach((as) => {
      as.ads?.forEach((ad) => {
        if (ad.fatigue) fatigueCount++;
      });
    });
  });

  if (fatigueCount > 0) {
    insights.push(
      `⚠️ <strong>${fatigueCount} ads</strong> show creative fatigue signs (CTR drop or high frequency). Refresh these creatives to prevent performance decline.`
    );
  }

  const avgRoas = active.filter((c) => c.roas > 0).reduce((s, c) => s + c.roas, 0) / (active.filter((c) => c.roas > 0).length || 1);
  insights.push(
    `📊 Total active spend is <strong>₹${totalSpend.toLocaleString("en-IN")}</strong> generating ${totalLeads} leads at an average ROAS of <strong>${avgRoas.toFixed(1)}x</strong>. Overall account health is ${avgRoas > 2.5 ? "strong 🟢" : avgRoas > 1.5 ? "moderate 🟡" : "needs attention 🔴"}.`
  );

  return insights;
}

// ── A/B Tests ─────────────────────────────────────────────────────

export async function fetchABTests(
  accountId?: string,
  dateRange?: DateRange
): Promise<ABTest[]> {
  if (!_useLiveData) {
    return accountId ? getABTestsForAccount(accountId) : getAllABTests();
  }

  try {
    const data = await callMetaApi("get_ab_tests", { accountId, dateRange });
    return data;
  } catch (e) {
    console.warn("Falling back to mock A/B tests:", e);
    // In live mode, real account IDs won't match mock data — return all mock tests as demo
    return getAllABTests();
  }
}

// ── Helpers ───────────────────────────────────────────────────────

export function formatINR(amount: number): string {
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return `₹${amount.toFixed(0)}`;
}

export function formatNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toFixed(0);
}
