// ================================================================
// METAPULSE — A/B Test Auto-Detection & Decision Engine
// Automatically detects tests at Campaign, Ad Set, and Ad levels
// ================================================================

import { Campaign, AdSet, Ad } from "@/data/mockData";

// ── Types ─────────────────────────────────────────────────────────

export type TestLevel = "campaign" | "adset" | "ad";
export type TestVerdict = "winner" | "loser" | "inconclusive" | "collecting";
export type RecommendationAction = "scale" | "pause" | "duplicate" | "increase_budget" | "refresh_creative" | "monitor";

export interface TestVariant {
  id: string;
  name: string;
  thumbnail?: string;
  spend: number;
  impressions: number;
  clicks: number;
  leads: number;
  purchases: number;
  ctr: number;
  cpc: number;
  cpm: number;
  cpl: number;
  roas: number;
  frequency?: number;
  engagementScore?: number;
  conversionRate: number;
  costPerResult: number;
  status: string;
}

export interface AutoDetectedTest {
  testId: string;
  level: TestLevel;
  groupName: string;      // Campaign name (for adset/ad) or Account name (for campaign)
  groupId: string;
  objective?: string;
  variants: TestVariant[];
  winnerId: string | null;
  winnerVerdict: TestVerdict;
  confidence: number;
  primaryMetric: string;
  hasEnoughData: boolean;
  dataMessage?: string;
}

export interface Recommendation {
  id: string;
  testId: string;
  action: RecommendationAction;
  targetName: string;
  targetId: string;
  title: string;
  reasoning: string;
  impact: string;
  priority: "high" | "medium" | "low";
  metrics: { label: string; value: string; delta?: string }[];
}

// ── Thresholds ────────────────────────────────────────────────────

const MIN_SPEND = 1000;
const MIN_IMPRESSIONS = 5000;
const MIN_CONVERSIONS = 10;
const CONFIDENCE_THRESHOLD = 75;

// ── Helpers ───────────────────────────────────────────────────────

function safeDiv(a: number, b: number, fallback = 0): number {
  return b > 0 ? a / b : fallback;
}

function toVariant(item: Campaign | AdSet | Ad, level: TestLevel): TestVariant {
  const spend = item.spend || 0;
  const impressions = item.impressions || 0;
  const clicks = item.clicks || 0;
  const leads = item.leads || 0;
  const purchases = item.purchases || 0;
  const conversions = leads > 0 ? leads : purchases;

  return {
    id: "campaignId" in item ? item.campaignId : "adSetId" in item ? item.adSetId : (item as Ad).adId,
    name: "campaignId" in item ? item.name : "adSetId" in item ? item.name : (item as Ad).name,
    thumbnail: "thumbnail" in item ? (item as Ad).thumbnail : undefined,
    spend,
    impressions,
    clicks,
    leads,
    purchases,
    ctr: item.ctr || safeDiv(clicks, impressions, 0) * 100,
    cpc: item.cpc || safeDiv(spend, clicks),
    cpm: safeDiv(spend, impressions, 0) * 1000,
    cpl: safeDiv(spend, leads),
    roas: "roas" in item ? (item as any).roas || 0 : 0,
    frequency: "frequency" in item ? (item as AdSet).frequency : undefined,
    engagementScore: "engagementScore" in item ? (item as Ad).engagementScore : undefined,
    conversionRate: safeDiv(conversions, clicks, 0) * 100,
    costPerResult: safeDiv(spend, Math.max(conversions, 1)),
    status: item.status,
  };
}

function checkDataSufficiency(variants: TestVariant[]): { enough: boolean; message?: string } {
  const totalSpend = variants.reduce((s, v) => s + v.spend, 0);
  const totalImpressions = variants.reduce((s, v) => s + v.impressions, 0);
  const totalConversions = variants.reduce((s, v) => s + v.leads + v.purchases, 0);

  if (totalSpend < MIN_SPEND) {
    return { enough: false, message: `Minimum ₹${MIN_SPEND.toLocaleString("en-IN")} spend required. Currently at ₹${totalSpend.toLocaleString("en-IN")}.` };
  }
  if (totalImpressions < MIN_IMPRESSIONS) {
    return { enough: false, message: `Need ${MIN_IMPRESSIONS.toLocaleString()} impressions minimum. Currently at ${totalImpressions.toLocaleString()}.` };
  }
  if (totalConversions < MIN_CONVERSIONS) {
    return { enough: false, message: `Need at least ${MIN_CONVERSIONS} conversions for reliable results. Currently at ${totalConversions}.` };
  }
  return { enough: true };
}

function calculateConfidence(variants: TestVariant[]): { confidence: number; winnerId: string | null; primaryMetric: string } {
  if (variants.length < 2) return { confidence: 0, winnerId: null, primaryMetric: "CTR" };

  // Score each variant across multiple metrics (excluding ROAS and purchases)
  const scores = variants.map((v) => {
    let score = 0;
    const maxCTR = Math.max(...variants.map((x) => x.ctr));
    const minCPC = Math.min(...variants.filter((x) => x.cpc > 0).map((x) => x.cpc));
    const maxConvRate = Math.max(...variants.map((x) => x.conversionRate));
    const minCPL = Math.min(...variants.filter((x) => x.cpl > 0).map((x) => x.cpl));
    const minCostPerResult = Math.min(...variants.filter((x) => x.costPerResult > 0).map((x) => x.costPerResult));

    if (maxCTR > 0 && v.ctr === maxCTR) score += 25;
    if (minCPC > 0 && v.cpc > 0 && v.cpc === minCPC) score += 25;
    if (maxConvRate > 0 && v.conversionRate === maxConvRate) score += 25;
    if (minCPL > 0 && v.cpl > 0 && v.cpl === minCPL) score += 15;
    if (minCostPerResult > 0 && v.costPerResult > 0 && v.costPerResult === minCostPerResult) score += 10;

    return { id: v.id, score };
  });

  scores.sort((a, b) => b.score - a.score);
  const top = scores[0];
  const second = scores[1];
  const gap = top.score - second.score;

  // Determine primary metric based on what differs most (no ROAS)
  let primaryMetric = "CTR";
  const winner = variants.find((v) => v.id === top.id)!;
  const loser = variants.find((v) => v.id === second.id)!;

  if (winner.cpc > 0 && loser.cpc > 0) {
    const cpcDiff = Math.abs(winner.cpc - loser.cpc) / Math.max(winner.cpc, loser.cpc);
    if (cpcDiff > 0.2) primaryMetric = "CPC";
  }
  if (winner.leads > 0 && loser.leads > 0) {
    const cplDiff = Math.abs(winner.cpl - loser.cpl) / Math.max(winner.cpl, loser.cpl);
    if (cplDiff > 0.15) primaryMetric = "CPL";
  }

  const confidence = Math.min(98, Math.round(50 + gap * 1.5 + (top.score > 60 ? 15 : 0)));

  return {
    confidence: gap < 5 ? Math.min(confidence, 55) : confidence,
    winnerId: gap >= 5 ? top.id : null,
    primaryMetric,
  };
}

// ── Campaign-Level Auto-Detection ─────────────────────────────────

export function detectCampaignTests(campaigns: Campaign[]): AutoDetectedTest[] {
  // Group campaigns by objective for strategy comparison
  const byObjective = new Map<string, Campaign[]>();
  campaigns.forEach((c) => {
    const key = c.objective || "Unknown";
    const arr = byObjective.get(key) || [];
    arr.push(c);
    byObjective.set(key, arr);
  });

  const tests: AutoDetectedTest[] = [];

  byObjective.forEach((group, objective) => {
    if (group.length < 2) return;

    const variants = group.map((c) => toVariant(c, "campaign"));
    const { enough, message } = checkDataSufficiency(variants);
    const { confidence, winnerId, primaryMetric } = calculateConfidence(variants);

    tests.push({
      testId: `ctest_${objective.replace(/\s/g, "_").toLowerCase()}`,
      level: "campaign",
      groupName: `${objective} Campaigns`,
      groupId: objective,
      objective,
      variants,
      winnerId: enough && confidence >= CONFIDENCE_THRESHOLD ? winnerId : null,
      winnerVerdict: !enough ? "collecting" : confidence >= CONFIDENCE_THRESHOLD && winnerId ? "winner" : confidence >= 50 ? "inconclusive" : "collecting",
      confidence: enough ? confidence : 0,
      primaryMetric,
      hasEnoughData: enough,
      dataMessage: message,
    });
  });

  // Also add a full comparison if 2+ campaigns exist
  if (campaigns.length >= 2 && tests.length === 0) {
    const variants = campaigns.map((c) => toVariant(c, "campaign"));
    const { enough, message } = checkDataSufficiency(variants);
    const { confidence, winnerId, primaryMetric } = calculateConfidence(variants);

    tests.push({
      testId: "ctest_all",
      level: "campaign",
      groupName: "All Campaigns Strategy Comparison",
      groupId: "all",
      variants,
      winnerId: enough && confidence >= CONFIDENCE_THRESHOLD ? winnerId : null,
      winnerVerdict: !enough ? "collecting" : confidence >= CONFIDENCE_THRESHOLD && winnerId ? "winner" : "inconclusive",
      confidence: enough ? confidence : 0,
      primaryMetric,
      hasEnoughData: enough,
      dataMessage: message,
    });
  }

  return tests;
}

// ── Ad Set-Level Auto-Detection ───────────────────────────────────

export function detectAdSetTests(campaigns: Campaign[]): AutoDetectedTest[] {
  const tests: AutoDetectedTest[] = [];

  campaigns.forEach((campaign) => {
    if (!campaign.adSets || campaign.adSets.length < 2) return;

    const variants = campaign.adSets.map((as) => toVariant(as, "adset"));
    const { enough, message } = checkDataSufficiency(variants);
    const { confidence, winnerId, primaryMetric } = calculateConfidence(variants);

    tests.push({
      testId: `astest_${campaign.campaignId}`,
      level: "adset",
      groupName: campaign.name,
      groupId: campaign.campaignId,
      objective: campaign.objective,
      variants,
      winnerId: enough && confidence >= CONFIDENCE_THRESHOLD ? winnerId : null,
      winnerVerdict: !enough ? "collecting" : confidence >= CONFIDENCE_THRESHOLD && winnerId ? "winner" : "inconclusive",
      confidence: enough ? confidence : 0,
      primaryMetric,
      hasEnoughData: enough,
      dataMessage: message,
    });
  });

  return tests;
}

// ── Ad-Level Auto-Detection ───────────────────────────────────────

export function detectAdTests(campaigns: Campaign[]): AutoDetectedTest[] {
  const tests: AutoDetectedTest[] = [];

  campaigns.forEach((campaign) => {
    campaign.adSets?.forEach((adSet) => {
      if (!adSet.ads || adSet.ads.length < 2) return;

      const variants = adSet.ads.map((ad) => toVariant(ad, "ad"));
      const { enough, message } = checkDataSufficiency(variants);
      const { confidence, winnerId, primaryMetric } = calculateConfidence(variants);

      tests.push({
        testId: `adtest_${adSet.adSetId}`,
        level: "ad",
        groupName: `${campaign.name} › ${adSet.name}`,
        groupId: adSet.adSetId,
        objective: campaign.objective,
        variants,
        winnerId: enough && confidence >= CONFIDENCE_THRESHOLD ? winnerId : null,
        winnerVerdict: !enough ? "collecting" : confidence >= CONFIDENCE_THRESHOLD && winnerId ? "winner" : "inconclusive",
        confidence: enough ? confidence : 0,
        primaryMetric,
        hasEnoughData: enough,
        dataMessage: message,
      });
    });
  });

  return tests;
}

// ── AI Decision Engine ────────────────────────────────────────────

export function generateRecommendations(tests: AutoDetectedTest[]): Recommendation[] {
  const recs: Recommendation[] = [];

  tests.forEach((test) => {
    if (!test.hasEnoughData || test.variants.length < 2) return;

    const winner = test.winnerId ? test.variants.find((v) => v.id === test.winnerId) : null;
    const losers = test.variants.filter((v) => v.id !== test.winnerId);
    const sorted = [...test.variants].sort((a, b) => b.conversionRate - a.conversionRate);

    // Scale the winner
    if (winner && test.confidence >= CONFIDENCE_THRESHOLD) {
      const avgCPL = safeDiv(
        test.variants.reduce((s, v) => s + v.cpl, 0),
        test.variants.filter((v) => v.cpl > 0).length
      );
      const savings = avgCPL > 0 && winner.cpl > 0 ? ((avgCPL - winner.cpl) / avgCPL * 100).toFixed(0) : "0";

      recs.push({
        id: `rec_scale_${test.testId}`,
        testId: test.testId,
        action: "scale",
        targetName: winner.name,
        targetId: winner.id,
        title: `Scale "${winner.name}"`,
        reasoning: `This ${test.level === "campaign" ? "campaign" : test.level === "adset" ? "audience" : "creative"} outperforms others with ${winner.ctr.toFixed(2)}% CTR and ${winner.cpc.toFixed(2)} CPC. Confidence: ${test.confidence}%.`,
        impact: winner.cpl > 0 ? `${savings}% lower CPL than average` : `${winner.ctr.toFixed(2)}% CTR (highest)`,
        priority: test.confidence >= 90 ? "high" : "medium",
        metrics: [
          { label: "CTR", value: `${winner.ctr.toFixed(2)}%` },
          { label: "CPC", value: `₹${winner.cpc.toFixed(2)}` },
          ...(winner.cpl > 0 ? [{ label: "CPL", value: `₹${winner.cpl.toFixed(0)}` }] : []),
          { label: "Conv Rate", value: `${winner.conversionRate.toFixed(2)}%` },
        ],
      });
    }

    // Pause losers
    losers.forEach((loser) => {
      if (!winner) return;
      const ctrDrop = winner.ctr > 0 ? ((winner.ctr - loser.ctr) / winner.ctr * 100).toFixed(0) : "0";
      const cpcIncrease = loser.cpc > 0 && winner.cpc > 0 ? ((loser.cpc - winner.cpc) / winner.cpc * 100).toFixed(0) : "0";

      if (test.confidence >= CONFIDENCE_THRESHOLD && (parseFloat(ctrDrop) > 10 || parseFloat(cpcIncrease) > 15)) {
        recs.push({
          id: `rec_pause_${loser.id}`,
          testId: test.testId,
          action: "pause",
          targetName: loser.name,
          targetId: loser.id,
          title: `Pause "${loser.name}"`,
          reasoning: `Underperforming vs winner "${winner.name}": ${ctrDrop}% lower CTR, ${cpcIncrease}% higher CPC. Spending budget on a weaker variant.`,
          impact: `Save ₹${loser.spend.toLocaleString("en-IN")} from underperforming variant`,
          priority: parseFloat(ctrDrop) > 25 ? "high" : "medium",
          metrics: [
            { label: "CTR", value: `${loser.ctr.toFixed(2)}%`, delta: `-${ctrDrop}%` },
            { label: "CPC", value: `₹${loser.cpc.toFixed(2)}`, delta: `+${cpcIncrease}%` },
          ],
        });
      }
    });

    // Duplicate winner creative (ad-level only)
    if (test.level === "ad" && winner && test.confidence >= 85) {
      recs.push({
        id: `rec_dup_${test.testId}`,
        testId: test.testId,
        action: "duplicate",
        targetName: winner.name,
        targetId: winner.id,
        title: `Duplicate "${winner.name}" to other ad sets`,
        reasoning: `High confidence (${test.confidence}%) winner. Replicating this creative across other audiences could multiply performance gains.`,
        impact: `Potential ${(winner.conversionRate * 1.1).toFixed(1)}% conversion rate in new audiences`,
        priority: "medium",
        metrics: [
          { label: "Conv Rate", value: `${winner.conversionRate.toFixed(2)}%` },
          { label: "Engagement", value: `${winner.engagementScore || 0}/100` },
        ],
      });
    }

    // Increase budget for winning ad set
    if (test.level === "adset" && winner && test.confidence >= 80) {
      recs.push({
        id: `rec_budget_${test.testId}`,
        testId: test.testId,
        action: "increase_budget",
        targetName: winner.name,
        targetId: winner.id,
        title: `Increase budget for "${winner.name}"`,
        reasoning: `Best performing audience with ${winner.conversionRate.toFixed(2)}% conversion rate. Budget increase of 20-30% could yield proportional lead growth with stable efficiency.`,
        impact: `Projected ~${Math.round(winner.leads * 0.25)} additional leads with 25% budget increase`,
        priority: "high",
        metrics: [
          { label: "Current Spend", value: `₹${winner.spend.toLocaleString("en-IN")}` },
          { label: "Cost/Result", value: `₹${winner.costPerResult.toFixed(0)}` },
        ],
      });
    }
  });

  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  recs.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return recs;
}
