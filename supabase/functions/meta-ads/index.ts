import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const META_API_VERSION = "v19.0";
const META_BASE = `https://graph.facebook.com/${META_API_VERSION}`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const accessToken = Deno.env.get("META_ACCESS_TOKEN");
    if (!accessToken) {
      return new Response(
        JSON.stringify({ error: "META_ACCESS_TOKEN not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { action, accountId, campaignId, adSetId, dateRange } = await req.json();

    let timeRange = "";
    if (dateRange?.from && dateRange?.to) {
      const trJson = JSON.stringify({ since: dateRange.from, until: dateRange.to });
      timeRange = `&time_range=${encodeURIComponent(trJson)}`;
    }

    const metaFetch = async (url: string) => {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (data.error) {
        throw new Error(data.error.message || JSON.stringify(data.error));
      }
      return data;
    };

    // Paginate through all results
    const metaFetchAll = async (url: string) => {
      let allData: any[] = [];
      let nextUrl: string | null = url;
      while (nextUrl) {
        const res: Response = await fetch(nextUrl, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const json: any = await res.json();
        if (json.error) throw new Error(json.error.message || JSON.stringify(json.error));
        allData = allData.concat(json.data || []);
        nextUrl = json.paging?.next || null;
        // Safety: max 5 pages
        if (allData.length > 500) break;
      }
      return allData;
    };

    let result: any;

    switch (action) {
      case "get_ad_accounts": {
        const data = await metaFetchAll(
          `${META_BASE}/me/adaccounts?fields=account_id,name,currency,account_status&limit=100`
        );
        result = data.map((a: any) => ({
          accountId: a.account_id.startsWith("act_") ? a.account_id : `act_${a.account_id}`,
          accountName: a.name || `Account ${a.account_id}`,
          currency: a.currency || "INR",
          accountStatus: a.account_status,
        }));
        break;
      }

      case "get_campaigns": {
        if (!accountId) throw new Error("accountId required");
        const acctId = accountId.startsWith("act_") ? accountId : `act_${accountId}`;
        const fields =
          "name,objective,status,daily_budget,lifetime_budget,insights{spend,impressions,clicks,reach,actions,cost_per_action_type,purchase_roas,ctr,cpc}";
        const data = await metaFetchAll(
          `${META_BASE}/${acctId}/campaigns?fields=${fields}&limit=100${timeRange}`
        );
        result = data.map((c: any) => transformCampaign(c));
        break;
      }

      case "get_adsets": {
        if (!campaignId) throw new Error("campaignId required");
        const fields =
          "name,status,daily_budget,lifetime_budget,targeting,insights{spend,impressions,clicks,reach,frequency,actions,ctr,cpc}";
        const data = await metaFetchAll(
          `${META_BASE}/${campaignId}/adsets?fields=${fields}&limit=100${timeRange}`
        );
        result = data.map((as: any) => transformAdSet(as));
        break;
      }

      case "get_ads": {
        if (!adSetId) throw new Error("adSetId required");
        const fields =
          "name,status,creative{thumbnail_url},insights{spend,impressions,clicks,actions,purchase_roas,ctr,cpc}";
        const data = await metaFetchAll(
          `${META_BASE}/${adSetId}/ads?fields=${fields}&limit=100${timeRange}`
        );
        result = data.map((ad: any) => transformAd(ad));
        break;
      }

      case "get_insights": {
        if (!accountId) throw new Error("accountId required");
        const acctId = accountId.startsWith("act_") ? accountId : `act_${accountId}`;
        const fields = "spend,impressions,clicks,reach,actions";
        const data = await metaFetchAll(
          `${META_BASE}/${acctId}/insights?fields=${fields}&time_increment=1&limit=100${timeRange}`
        );
        result = data.map((d: any) => ({
          date: d.date_start,
          spend: parseFloat(d.spend || "0"),
          impressions: parseInt(d.impressions || "0"),
          clicks: parseInt(d.clicks || "0"),
          leads: extractAction(d.actions, "lead"),
          purchases: extractAction(d.actions, "purchase") + extractAction(d.actions, "offsite_conversion.fb_pixel_purchase"),
          reach: parseInt(d.reach || "0"),
        }));
        break;
      }

      case "get_campaign_insights": {
        if (!campaignId) throw new Error("campaignId required");
        const fields = "spend,impressions,clicks,reach,actions";
        const data = await metaFetchAll(
          `${META_BASE}/${campaignId}/insights?fields=${fields}&time_increment=1&limit=100${timeRange}`
        );
        result = data.map((d: any) => ({
          date: d.date_start,
          spend: parseFloat(d.spend || "0"),
          impressions: parseInt(d.impressions || "0"),
          clicks: parseInt(d.clicks || "0"),
          leads: extractAction(d.actions, "lead"),
          purchases: extractAction(d.actions, "purchase") + extractAction(d.actions, "offsite_conversion.fb_pixel_purchase"),
          reach: parseInt(d.reach || "0"),
        }));
        break;
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Meta API Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Unknown error" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// ── Helpers ──────────────────────────────────────────────

function extractAction(actions: any[] | undefined, type: string): number {
  if (!actions) return 0;
  const found = actions.find(
    (a: any) => a.action_type === type || a.action_type === `offsite_conversion.fb_pixel_${type}`
  );
  return found ? parseInt(found.value || "0") : 0;
}

function transformCampaign(c: any) {
  const insights = c.insights?.data?.[0] || {};
  const spend = parseFloat(insights.spend || "0");
  const impressions = parseInt(insights.impressions || "0");
  const clicks = parseInt(insights.clicks || "0");
  const leads = extractAction(insights.actions, "lead");
  const purchases =
    extractAction(insights.actions, "purchase") +
    extractAction(insights.actions, "offsite_conversion.fb_pixel_purchase");
  const roas = insights.purchase_roas?.[0]?.value
    ? parseFloat(insights.purchase_roas[0].value)
    : 0;
  const budget = c.daily_budget
    ? parseFloat(c.daily_budget) / 100
    : c.lifetime_budget
    ? parseFloat(c.lifetime_budget) / 100
    : 0;

  return {
    campaignId: c.id,
    name: c.name,
    objective: c.objective || "Unknown",
    budget,
    spend,
    impressions,
    clicks,
    leads,
    purchases,
    ctr: parseFloat(insights.ctr || "0"),
    cpc: parseFloat(insights.cpc || "0"),
    roas,
    status: c.status === "ACTIVE" ? "Active" : "Paused",
    adSets: [],
    dailyMetrics: [],
  };
}

function transformAdSet(as: any) {
  const insights = as.insights?.data?.[0] || {};
  const spend = parseFloat(insights.spend || "0");
  const impressions = parseInt(insights.impressions || "0");
  const clicks = parseInt(insights.clicks || "0");
  const leads = extractAction(insights.actions, "lead");
  const purchases =
    extractAction(insights.actions, "purchase") +
    extractAction(insights.actions, "offsite_conversion.fb_pixel_purchase");
  const budget = as.daily_budget
    ? parseFloat(as.daily_budget) / 100
    : as.lifetime_budget
    ? parseFloat(as.lifetime_budget) / 100
    : 0;

  const targeting = as.targeting || {};
  let audienceType = "Custom";
  if (targeting.custom_audiences?.length) audienceType = "Custom Audience";
  else if (targeting.interests?.length) audienceType = `Interest – ${targeting.interests[0]?.name || ""}`;
  else if (targeting.behaviors?.length) audienceType = `Behavioural – ${targeting.behaviors[0]?.name || ""}`;

  return {
    adSetId: as.id,
    name: as.name,
    budget,
    spend,
    impressions,
    clicks,
    leads,
    purchases,
    ctr: parseFloat(insights.ctr || "0"),
    cpc: parseFloat(insights.cpc || "0"),
    frequency: parseFloat(insights.frequency || "0"),
    audienceType,
    status: as.status === "ACTIVE" ? "Active" : "Paused",
    ads: [],
    dailyMetrics: [],
  };
}

function transformAd(ad: any) {
  const insights = ad.insights?.data?.[0] || {};
  const spend = parseFloat(insights.spend || "0");
  const impressions = parseInt(insights.impressions || "0");
  const clicks = parseInt(insights.clicks || "0");
  const leads = extractAction(insights.actions, "lead");
  const purchases =
    extractAction(insights.actions, "purchase") +
    extractAction(insights.actions, "offsite_conversion.fb_pixel_purchase");
  const roas = insights.purchase_roas?.[0]?.value
    ? parseFloat(insights.purchase_roas[0].value)
    : 0;
  const ctr = parseFloat(insights.ctr || "0");

  return {
    adId: ad.id,
    name: ad.name,
    thumbnail: ad.creative?.thumbnail_url || "https://placehold.co/120x90/1a1a2e/666?text=Ad",
    spend,
    impressions,
    clicks,
    leads,
    purchases,
    ctr,
    cpc: parseFloat(insights.cpc || "0"),
    roas,
    engagementScore: Math.min(100, Math.round(ctr * 20 + (roas > 0 ? roas * 10 : 0))),
    fatigue: false,
    fatigueReason: undefined,
    status: ad.status === "ACTIVE" ? "Active" : "Paused",
    dailyMetrics: [],
  };
}
