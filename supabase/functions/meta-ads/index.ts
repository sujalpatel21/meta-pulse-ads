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
        const insightsTimeRange = dateRange?.from && dateRange?.to
          ? `.time_range(${JSON.stringify({ since: dateRange.from, until: dateRange.to })})`
          : "";
        const fields =
          `name,objective,status,daily_budget,lifetime_budget,insights${insightsTimeRange}{spend,impressions,clicks,reach,actions,cost_per_action_type,purchase_roas,ctr,cpc}`;
        const data = await metaFetchAll(
          `${META_BASE}/${acctId}/campaigns?fields=${encodeURIComponent(fields)}&limit=100`
        );
        result = data.map((c: any) => transformCampaign(c));
        break;
      }

      case "get_adsets": {
        if (!campaignId) throw new Error("campaignId required");
        const adsetInsightsTR = dateRange?.from && dateRange?.to
          ? `.time_range(${JSON.stringify({ since: dateRange.from, until: dateRange.to })})`
          : "";
        const adsetFields =
          `name,status,daily_budget,lifetime_budget,targeting,insights${adsetInsightsTR}{spend,impressions,clicks,reach,frequency,actions,ctr,cpc}`;
        const data = await metaFetchAll(
          `${META_BASE}/${campaignId}/adsets?fields=${encodeURIComponent(adsetFields)}&limit=100`
        );
        result = data.map((as: any) => transformAdSet(as));
        break;
      }

      case "get_ads": {
        if (!adSetId) throw new Error("adSetId required");
        const adInsightsTR = dateRange?.from && dateRange?.to
          ? `.time_range(${JSON.stringify({ since: dateRange.from, until: dateRange.to })})`
          : "";
        const adFields =
          `name,status,creative{thumbnail_url},insights${adInsightsTR}{spend,impressions,clicks,actions,purchase_roas,ctr,cpc}`;
        const data = await metaFetchAll(
          `${META_BASE}/${adSetId}/ads?fields=${encodeURIComponent(adFields)}&limit=100`
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

      case "get_ab_tests": {
        if (!accountId) throw new Error("accountId required");
        const abAcctId = accountId.startsWith("act_") ? accountId : `act_${accountId}`;

        // Step 1: Fetch all campaigns
        const campaignFields = "name,status";
        const allCampaigns = await metaFetchAll(
          `${META_BASE}/${abAcctId}/campaigns?fields=${encodeURIComponent(campaignFields)}&limit=100`
        );

        const abTests: any[] = [];

        // Step 2: For each campaign, fetch ad sets
        for (const camp of allCampaigns.slice(0, 20)) { // limit to 20 campaigns
          const adsetInsightsTR = dateRange?.from && dateRange?.to
            ? `.time_range(${JSON.stringify({ since: dateRange.from, until: dateRange.to })})`
            : "";
          const adsetFields = `name,status,ads${adsetInsightsTR ? "" : ""}{name,status,creative{thumbnail_url},insights${adsetInsightsTR}{spend,impressions,clicks,reach,actions,purchase_roas,ctr,cpc}}`;

          let adSets: any[];
          try {
            adSets = await metaFetchAll(
              `${META_BASE}/${camp.id}/adsets?fields=${encodeURIComponent(`name,status`)}&limit=50`
            );
          } catch { continue; }

          // Step 3: For each ad set with 2+ ads, create an A/B test
          for (const adset of adSets) {
            let ads: any[];
            try {
              const adFields = `name,status,creative{thumbnail_url},insights${adsetInsightsTR}{spend,impressions,clicks,reach,actions,purchase_roas,ctr,cpc}`;
              ads = await metaFetchAll(
                `${META_BASE}/${adset.id}/ads?fields=${encodeURIComponent(adFields)}&limit=20`
              );
            } catch { continue; }

            if (ads.length < 2) continue;

            const labels = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
            const variants = ads.slice(0, 6).map((ad: any, idx: number) => {
              const ins = ad.insights?.data?.[0] || {};
              const spend = parseFloat(ins.spend || "0");
              const impressions = parseInt(ins.impressions || "0");
              const clicks = parseInt(ins.clicks || "0");
              const leads = extractAction(ins.actions, "lead");
              const purchases = extractAction(ins.actions, "purchase") + extractAction(ins.actions, "offsite_conversion.fb_pixel_purchase");
              const ctr = parseFloat(ins.ctr || "0");
              const cpc = parseFloat(ins.cpc || "0");
              const roas = ins.purchase_roas?.[0]?.value ? parseFloat(ins.purchase_roas[0].value) : 0;
              const conversionRate = impressions > 0 ? (leads / impressions) * 100 : 0;

              return {
                variantId: ad.id,
                variantLabel: labels[idx],
                adName: ad.name || `Ad ${idx + 1}`,
                thumbnail: ad.creative?.thumbnail_url || "https://placehold.co/120x90/1a1a2e/666?text=Ad",
                spend, impressions, clicks, leads, purchases,
                ctr, cpc, roas, conversionRate,
                dailyMetrics: [],
              };
            });

            // Determine winner by CTR (highest CTR wins)
            const activeVariants = variants.filter((v: any) => v.impressions > 0);
            let winnerId: string | undefined;
            let confidence = 0;
            let testStatus: "Running" | "Completed" | "Draft" = "Running";

            if (activeVariants.length >= 2) {
              const sorted = [...activeVariants].sort((a: any, b: any) => b.ctr - a.ctr);
              const best = sorted[0];
              const secondBest = sorted[1];

              // Simple confidence: based on CTR difference & sample size
              if (best.impressions > 100 && secondBest.impressions > 100) {
                const diff = best.ctr - secondBest.ctr;
                const avgCtr = (best.ctr + secondBest.ctr) / 2;
                const relDiff = avgCtr > 0 ? (diff / avgCtr) * 100 : 0;
                const sampleBonus = Math.min(30, Math.log10(best.impressions + secondBest.impressions) * 10);
                confidence = Math.min(99, Math.round(Math.abs(relDiff) * 3 + sampleBonus));

                if (confidence >= 90) {
                  winnerId = best.variantId;
                  testStatus = "Completed";
                }
              }
            } else if (activeVariants.length === 0) {
              testStatus = "Draft";
            }

            // Determine campaign status
            const campStatus = camp.status === "ACTIVE" ? "Running" : testStatus;

            abTests.push({
              testId: `ab_${adset.id}`,
              testName: `${adset.name}`,
              campaignName: camp.name,
              campaignId: camp.id,
              accountId: abAcctId,
              status: camp.status === "ACTIVE" ? "Running" : (confidence >= 90 ? "Completed" : "Draft"),
              startDate: dateRange?.from || new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10),
              endDate: camp.status !== "ACTIVE" ? (dateRange?.to || new Date().toISOString().slice(0, 10)) : undefined,
              variants,
              winnerId,
              confidence,
              metric: "CTR",
            });
          }
        }

        result = abTests;
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
