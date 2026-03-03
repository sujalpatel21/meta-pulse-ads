// ================================================================
// METAPULSE — Decision Intelligence Engine
// Client-side logic that computes actionable signals from campaign data
// No AI needed — pure rule-based pattern detection
// ================================================================

import { Campaign, AdSet, Ad, DailyMetric } from "@/data/mockData";

// ── Signal Types ──────────────────────────────────────────────────

export type SignalType = "scale" | "kill" | "monitor" | "fatigue" | "leakage";
export type SignalSeverity = "critical" | "warning" | "info" | "positive";

export interface Signal {
  type: SignalType;
  severity: SignalSeverity;
  title: string;
  detail: string;
  metric?: string;
  value?: number;
  confidence?: number; // 0-100
}

export interface CampaignIntel {
  campaign: Campaign;
  healthScore: number; // 0-100
  signals: Signal[];
  primaryAction: SignalType;
  cpl: number;
  projectedLeadsAt20: number;
  wastedSpend: number;
  fatiguePercent: number;
  budgetPacing: number; // % of budget used
}

export interface AccountIntel {
  healthScore: number;
  totalBudgetLeak: number;
  scaleOpportunities: number;
  killRecommendations: number;
  monitorCount: number;
  totalProfit: number;
  campaignIntels: CampaignIntel[];
  avgCPL: number;
  avgCPC: number;
  avgCTR: number;
}

// ── Thresholds ────────────────────────────────────────────────────

const THRESHOLDS = {
  CTR_GOOD: 2.0,
  CTR_BAD: 0.8,
  FREQUENCY_HIGH: 2.5,
  FREQUENCY_DANGER: 3.5,
  ROAS_GOOD: 2.0,
  ROAS_DANGER: 1.0,
  CPC_OVERSHOOT: 1.3, // 30% above average
  ZERO_CONVERSION_DAYS: 3,
  FATIGUE_CTR_DROP: 0.20, // 20% decline
  BUDGET_OVERSPEND: 1.1, // 10% over
};

// ── Main Analysis ─────────────────────────────────────────────────

export function analyzeAccount(campaigns: Campaign[]): AccountIntel {
  if (!campaigns.length) {
    return {
      healthScore: 0,
      totalBudgetLeak: 0,
      scaleOpportunities: 0,
      killRecommendations: 0,
      monitorCount: 0,
      totalProfit: 0,
      campaignIntels: [],
      avgCPL: 0,
      avgCPC: 0,
      avgCTR: 0,
    };
  }

  const totalSpend = campaigns.reduce((s, c) => s + c.spend, 0);
  const totalLeads = campaigns.reduce((s, c) => s + c.leads, 0);
  const totalClicks = campaigns.reduce((s, c) => s + c.clicks, 0);
  const totalImpressions = campaigns.reduce((s, c) => s + c.impressions, 0);

  const avgCPL = totalLeads > 0 ? totalSpend / totalLeads : 0;
  const avgCPC = totalClicks > 0 ? totalSpend / totalClicks : 0;
  const avgCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

  const campaignIntels = campaigns.map((c) =>
    analyzeCampaign(c, { avgCPL, avgCPC, avgCTR })
  );

  const scaleOpportunities = campaignIntels.filter(
    (ci) => ci.primaryAction === "scale"
  ).length;
  const killRecommendations = campaignIntels.filter(
    (ci) => ci.primaryAction === "kill"
  ).length;
  const monitorCount = campaignIntels.filter(
    (ci) => ci.primaryAction === "monitor"
  ).length;

  const totalBudgetLeak = campaignIntels.reduce(
    (s, ci) => s + ci.wastedSpend, 0
  );

  const healthScores = campaignIntels.map((ci) => ci.healthScore);
  const healthScore = Math.round(
    healthScores.reduce((s, h) => s + h, 0) / healthScores.length
  );

  return {
    healthScore,
    totalBudgetLeak,
    scaleOpportunities,
    killRecommendations,
    monitorCount,
    totalProfit: 0, // requires revenue input
    campaignIntels,
    avgCPL,
    avgCPC,
    avgCTR,
  };
}

// ── Campaign-Level Analysis ───────────────────────────────────────

function analyzeCampaign(
  campaign: Campaign,
  benchmarks: { avgCPL: number; avgCPC: number; avgCTR: number }
): CampaignIntel {
  const signals: Signal[] = [];
  const cpl = campaign.leads > 0 ? campaign.spend / campaign.leads : 0;
  const budgetPacing = campaign.budget > 0 ? (campaign.spend / campaign.budget) * 100 : 0;

  // Count fatigued ads
  let totalAds = 0;
  let fatiguedAds = 0;
  let totalFrequency = 0;
  let adSetCount = 0;

  campaign.adSets?.forEach((as) => {
    totalFrequency += as.frequency || 0;
    adSetCount++;
    as.ads?.forEach((ad) => {
      totalAds++;
      if (ad.fatigue) fatiguedAds++;
    });
  });

  const avgFrequency = adSetCount > 0 ? totalFrequency / adSetCount : 0;
  const fatiguePercent = totalAds > 0 ? Math.round((fatiguedAds / totalAds) * 100) : 0;

  // Wasted spend estimation
  let wastedSpend = 0;

  // ── 1. SCALING DETECTION ──
  const isScaleCandidate =
    (cpl > 0 && cpl < benchmarks.avgCPL) &&
    campaign.ctr > THRESHOLDS.CTR_GOOD &&
    avgFrequency < THRESHOLDS.FREQUENCY_HIGH;

  if (isScaleCandidate) {
    const confidence = Math.min(95, Math.round(
      (campaign.ctr / benchmarks.avgCTR) * 30 +
      (benchmarks.avgCPL / Math.max(cpl, 1)) * 30 +
      (campaign.leads > 50 ? 20 : campaign.leads > 20 ? 10 : 5) +
      (campaign.roas >= THRESHOLDS.ROAS_GOOD ? 15 : 5)
    ));
    signals.push({
      type: "scale",
      severity: "positive",
      title: "Scale Candidate",
      detail: `CPL ₹${cpl.toFixed(0)} is ${Math.round(((benchmarks.avgCPL - cpl) / benchmarks.avgCPL) * 100)}% below account avg. CTR ${campaign.ctr.toFixed(2)}% strong. Freq ${avgFrequency.toFixed(1)} healthy.`,
      confidence,
    });
  }

  // ── 2. KILL / PAUSE DETECTION ──
  const isKillCandidate =
    (campaign.leads === 0 && campaign.purchases === 0 && campaign.spend > 3000) ||
    (campaign.ctr < THRESHOLDS.CTR_BAD && campaign.spend > 2000) ||
    (campaign.cpc > benchmarks.avgCPC * THRESHOLDS.CPC_OVERSHOOT && campaign.spend > 2000);

  if (isKillCandidate) {
    let reason = "";
    if (campaign.leads === 0 && campaign.purchases === 0) {
      reason = `₹${campaign.spend.toLocaleString("en-IN")} spent with zero conversions.`;
      wastedSpend = campaign.spend;
    } else if (campaign.ctr < THRESHOLDS.CTR_BAD) {
      reason = `CTR ${campaign.ctr.toFixed(2)}% critically low (< ${THRESHOLDS.CTR_BAD}%).`;
      wastedSpend = campaign.spend * 0.4;
    } else {
      reason = `CPC ₹${campaign.cpc.toFixed(2)} is ${Math.round(((campaign.cpc - benchmarks.avgCPC) / benchmarks.avgCPC) * 100)}% above account avg.`;
      wastedSpend = (campaign.cpc - benchmarks.avgCPC) * (campaign.clicks || 0);
    }

    signals.push({
      type: "kill",
      severity: "critical",
      title: "Pause Recommended",
      detail: reason,
      value: wastedSpend,
    });
  }

  // ── 3. BUDGET LEAKAGE ──
  if (budgetPacing > THRESHOLDS.BUDGET_OVERSPEND * 100) {
    const leakPerDay = campaign.budget > 0
      ? (campaign.spend - campaign.budget) / 14 // assuming 14-day window
      : 0;
    signals.push({
      type: "leakage",
      severity: "warning",
      title: "Budget Leakage",
      detail: `Overspent by ₹${(campaign.spend - campaign.budget).toLocaleString("en-IN")} (${(budgetPacing - 100).toFixed(0)}% over). ~₹${leakPerDay.toFixed(0)}/day leaking.`,
      value: campaign.spend - campaign.budget,
    });
    wastedSpend += Math.max(0, campaign.spend - campaign.budget);
  }

  if (campaign.ctr < 1.5 && campaign.impressions > 10000) {
    const leakEstimate = campaign.spend * 0.3;
    signals.push({
      type: "leakage",
      severity: "warning",
      title: "Low CTR Leakage",
      detail: `High impressions (${(campaign.impressions / 1000).toFixed(0)}K) with ${campaign.ctr.toFixed(2)}% CTR → traffic quality issue. Est. ₹${leakEstimate.toLocaleString("en-IN")} wasted.`,
      value: leakEstimate,
    });
    if (!isKillCandidate) wastedSpend += leakEstimate;
  }

  // ── 4. CREATIVE FATIGUE ──
  if (fatiguePercent > 0) {
    signals.push({
      type: "fatigue",
      severity: fatiguePercent > 50 ? "critical" : "warning",
      title: "Creative Fatigue Detected",
      detail: `${fatiguedAds}/${totalAds} ads showing fatigue (${fatiguePercent}%). ${avgFrequency > 3 ? `Frequency ${avgFrequency.toFixed(1)} accelerating decay.` : "Rotate creatives soon."}`,
      value: fatiguePercent,
    });
  }

  if (avgFrequency > THRESHOLDS.FREQUENCY_DANGER && campaign.ctr < benchmarks.avgCTR) {
    signals.push({
      type: "fatigue",
      severity: "critical",
      title: "Audience Saturation",
      detail: `Frequency ${avgFrequency.toFixed(1)} with declining CTR → audience exhausted. Expand or refresh targeting.`,
    });
  }

  // ── 5. ROAS RISK ──
  if (campaign.roas > 0 && campaign.roas < THRESHOLDS.ROAS_DANGER) {
    signals.push({
      type: "kill",
      severity: "critical",
      title: "Negative ROI",
      detail: `ROAS ${campaign.roas.toFixed(1)}x is below 1.0x — losing money on every rupee spent.`,
    });
  } else if (campaign.roas > 0 && campaign.roas < THRESHOLDS.ROAS_GOOD) {
    signals.push({
      type: "monitor",
      severity: "warning",
      title: "ROAS Below Target",
      detail: `ROAS ${campaign.roas.toFixed(1)}x is below ${THRESHOLDS.ROAS_GOOD}x target. Monitor closely.`,
    });
  }

  // ── Determine primary action ──
  let primaryAction: SignalType = "monitor";
  if (signals.some((s) => s.type === "kill")) primaryAction = "kill";
  else if (signals.some((s) => s.type === "scale")) primaryAction = "scale";
  else if (signals.some((s) => s.type === "fatigue" && s.severity === "critical")) primaryAction = "fatigue";
  else if (signals.some((s) => s.type === "leakage")) primaryAction = "leakage";

  // ── Health Score ──
  let healthScore = 70; // baseline
  // Positive factors
  if (campaign.ctr > THRESHOLDS.CTR_GOOD) healthScore += 10;
  if (campaign.roas >= THRESHOLDS.ROAS_GOOD) healthScore += 10;
  if (cpl > 0 && cpl < benchmarks.avgCPL) healthScore += 5;
  if (avgFrequency < THRESHOLDS.FREQUENCY_HIGH) healthScore += 5;
  // Negative factors
  if (campaign.ctr < THRESHOLDS.CTR_BAD) healthScore -= 25;
  if (campaign.roas > 0 && campaign.roas < THRESHOLDS.ROAS_DANGER) healthScore -= 30;
  if (budgetPacing > 120) healthScore -= 15;
  if (fatiguePercent > 50) healthScore -= 15;
  if (avgFrequency > THRESHOLDS.FREQUENCY_DANGER) healthScore -= 10;
  if (isKillCandidate) healthScore -= 20;
  healthScore = Math.max(0, Math.min(100, healthScore));

  // Projected leads if budget increased 20%
  const projectedLeadsAt20 = campaign.leads > 0
    ? Math.round(campaign.leads * 1.18) // slightly less than linear
    : 0;

  return {
    campaign,
    healthScore,
    signals,
    primaryAction,
    cpl,
    projectedLeadsAt20,
    wastedSpend,
    fatiguePercent,
    budgetPacing,
  };
}

// ── Signal badge colors ───────────────────────────────────────────

export function getSignalColor(type: SignalType): string {
  switch (type) {
    case "scale": return "hsl(142 71% 45%)";
    case "kill": return "hsl(0 84% 60%)";
    case "monitor": return "hsl(38 92% 50%)";
    case "fatigue": return "hsl(25 95% 53%)";
    case "leakage": return "hsl(0 84% 60%)";
  }
}

export function getSignalBg(type: SignalType): string {
  switch (type) {
    case "scale": return "hsl(142 71% 45% / 0.12)";
    case "kill": return "hsl(0 84% 60% / 0.12)";
    case "monitor": return "hsl(38 92% 50% / 0.12)";
    case "fatigue": return "hsl(25 95% 53% / 0.12)";
    case "leakage": return "hsl(0 84% 60% / 0.12)";
  }
}

export function getSignalLabel(type: SignalType): string {
  switch (type) {
    case "scale": return "🟢 Scale";
    case "kill": return "🔴 Kill";
    case "monitor": return "🟡 Monitor";
    case "fatigue": return "🟠 Fatigue";
    case "leakage": return "⚠️ Leaking";
  }
}

export function getHealthColor(score: number): string {
  if (score >= 70) return "hsl(142 71% 45%)";
  if (score >= 40) return "hsl(38 92% 50%)";
  return "hsl(0 84% 60%)";
}
