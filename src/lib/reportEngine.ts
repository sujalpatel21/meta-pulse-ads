// ================================================================
// METAPULSE — Report Intelligence Engine
// Bottleneck detection, leakage analysis, AI recommendations
// ================================================================

import { Campaign, AdSet, Ad } from "@/data/mockData";

// ── Types ─────────────────────────────────────────────────────────

export type BottleneckType = "landing_page" | "creative" | "audience" | "offer" | "targeting";
export type LeakageSeverity = "critical" | "high" | "medium";
export type RecommendationPriority = "urgent" | "high" | "medium" | "low";

export interface Bottleneck {
  type: BottleneckType;
  title: string;
  detail: string;
  icon: string;
  metric: string;
  value: string;
}

export interface LeakageItem {
  source: string;
  level: "campaign" | "adset" | "ad";
  amount: number;
  reason: string;
  severity: LeakageSeverity;
}

export interface Recommendation {
  action: string;
  target: string;
  priority: RecommendationPriority;
  impact: number; // 1-10
  detail: string;
  icon: string;
}

export interface CampaignPerformance {
  campaign: Campaign;
  status: "scaling" | "underperforming" | "waste" | "stable";
  statusLabel: string;
  cpl: number;
  conversionRate: number;
  cpm: number;
}

export interface ReportData {
  bottlenecks: Bottleneck[];
  leakage: LeakageItem[];
  recommendations: Recommendation[];
  campaignPerformance: CampaignPerformance[];
  totalLeakage: number;
  scalingOpportunities: number;
  underperformers: number;
}

// ── Main Analysis ─────────────────────────────────────────────────

export function generateReportAnalysis(campaigns: Campaign[]): ReportData {
  const totalSpend = campaigns.reduce((s, c) => s + c.spend, 0);
  const totalLeads = campaigns.reduce((s, c) => s + c.leads, 0);
  const totalClicks = campaigns.reduce((s, c) => s + c.clicks, 0);
  const totalImpressions = campaigns.reduce((s, c) => s + c.impressions, 0);
  const avgCPL = totalLeads > 0 ? totalSpend / totalLeads : 0;
  const avgCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
  const avgCPC = totalClicks > 0 ? totalSpend / totalClicks : 0;

  const bottlenecks = detectBottlenecks(campaigns, { avgCPL, avgCTR, avgCPC });
  const leakage = detectLeakage(campaigns, { avgCPL, avgCTR });
  const campaignPerformance = analyzeCampaignPerformance(campaigns, { avgCPL, avgCTR });
  const recommendations = generateRecommendations(campaigns, campaignPerformance, leakage);
  const totalLeakage = leakage.reduce((s, l) => s + l.amount, 0);

  return {
    bottlenecks,
    leakage,
    recommendations,
    campaignPerformance,
    totalLeakage,
    scalingOpportunities: campaignPerformance.filter(c => c.status === "scaling").length,
    underperformers: campaignPerformance.filter(c => c.status === "underperforming" || c.status === "waste").length,
  };
}

// ── Bottleneck Detection ──────────────────────────────────────────

function detectBottlenecks(
  campaigns: Campaign[],
  benchmarks: { avgCPL: number; avgCTR: number; avgCPC: number }
): Bottleneck[] {
  const bottlenecks: Bottleneck[] = [];
  const totalImpressions = campaigns.reduce((s, c) => s + c.impressions, 0);
  const totalClicks = campaigns.reduce((s, c) => s + c.clicks, 0);
  const totalLeads = campaigns.reduce((s, c) => s + c.leads, 0);
  const totalPurchases = campaigns.reduce((s, c) => s + c.purchases, 0);
  const overallCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
  const convRate = totalClicks > 0 ? (totalLeads / totalClicks) * 100 : 0;

  // High CTR but low conversions → Landing page issue
  if (overallCTR > 2 && convRate < 3) {
    bottlenecks.push({
      type: "landing_page",
      title: "Landing Page Bottleneck",
      detail: `CTR is healthy at ${overallCTR.toFixed(1)}% but conversion rate is only ${convRate.toFixed(1)}%. Traffic quality is good — landing page is likely the issue.`,
      icon: "🔗",
      metric: "Conversion Rate",
      value: `${convRate.toFixed(1)}%`,
    });
  }

  // High CPC → Creative problem
  const highCPCCampaigns = campaigns.filter(c => c.cpc > benchmarks.avgCPC * 1.3);
  if (highCPCCampaigns.length > 0) {
    bottlenecks.push({
      type: "creative",
      title: "High CPC — Creative Issue",
      detail: `${highCPCCampaigns.length} campaign(s) have CPC 30%+ above average (₹${benchmarks.avgCPC.toFixed(0)}). Weak creative hooks causing poor click quality.`,
      icon: "🎨",
      metric: "Avg CPC",
      value: `₹${(highCPCCampaigns.reduce((s, c) => s + c.cpc, 0) / highCPCCampaigns.length).toFixed(0)}`,
    });
  }

  // High CPM → Audience competition
  campaigns.forEach(c => {
    const cpm = c.impressions > 0 ? (c.spend / c.impressions) * 1000 : 0;
    if (cpm > 300) {
      bottlenecks.push({
        type: "audience",
        title: "High CPM — Audience Competition",
        detail: `"${c.name}" CPM is ₹${cpm.toFixed(0)}, indicating highly competitive audience.`,
        icon: "👥",
        metric: "CPM",
        value: `₹${cpm.toFixed(0)}`,
      });
    }
  });

  // Low CTR → Weak creative
  const lowCTRCampaigns = campaigns.filter(c => c.ctr < 1.0 && c.impressions > 5000);
  if (lowCTRCampaigns.length > 0) {
    bottlenecks.push({
      type: "creative",
      title: "Low CTR — Weak Creatives",
      detail: `${lowCTRCampaigns.length} campaign(s) with CTR below 1%. Creatives not engaging the target audience.`,
      icon: "📉",
      metric: "CTR",
      value: `${(lowCTRCampaigns.reduce((s, c) => s + c.ctr, 0) / lowCTRCampaigns.length).toFixed(2)}%`,
    });
  }

  // Low conversion + purchases → Offer problem
  if (totalLeads > 0 && totalPurchases > 0) {
    const purchaseRate = (totalPurchases / totalLeads) * 100;
    if (purchaseRate < 10) {
      bottlenecks.push({
        type: "offer",
        title: "Low Lead-to-Purchase Rate",
        detail: `Only ${purchaseRate.toFixed(1)}% of leads convert to purchases. Offer or funnel optimization needed.`,
        icon: "💰",
        metric: "Purchase Rate",
        value: `${purchaseRate.toFixed(1)}%`,
      });
    }
  }

  return bottlenecks;
}

// ── Leakage Detection ─────────────────────────────────────────────

function detectLeakage(
  campaigns: Campaign[],
  benchmarks: { avgCPL: number; avgCTR: number }
): LeakageItem[] {
  const leakage: LeakageItem[] = [];

  campaigns.forEach(c => {
    // Campaign level: zero conversions with spend
    if (c.leads === 0 && c.purchases === 0 && c.spend > 2000) {
      leakage.push({
        source: c.name,
        level: "campaign",
        amount: c.spend,
        reason: "Zero conversions",
        severity: "critical",
      });
    }

    // Campaign level: CPL above target
    const cpl = c.leads > 0 ? c.spend / c.leads : 0;
    if (cpl > 0 && cpl > benchmarks.avgCPL * 1.5) {
      leakage.push({
        source: c.name,
        level: "campaign",
        amount: Math.round((cpl - benchmarks.avgCPL) * c.leads),
        reason: `CPL ₹${cpl.toFixed(0)} is ${Math.round(((cpl - benchmarks.avgCPL) / benchmarks.avgCPL) * 100)}% above target`,
        severity: "high",
      });
    }

    // Adset level
    c.adSets?.forEach(as => {
      if (as.leads === 0 && as.purchases === 0 && as.spend > 1000) {
        leakage.push({
          source: `${c.name} → ${as.name}`,
          level: "adset",
          amount: as.spend,
          reason: "Zero conversions",
          severity: "critical",
        });
      }

      // Ad level: high spend low engagement
      as.ads?.forEach(ad => {
        if (ad.ctr < 0.8 && ad.spend > 500) {
          leakage.push({
            source: `${ad.name}`,
            level: "ad",
            amount: Math.round(ad.spend * 0.6),
            reason: `CTR ${ad.ctr.toFixed(2)}% with ₹${ad.spend.toLocaleString("en-IN")} spent`,
            severity: "medium",
          });
        }
      });
    });
  });

  return leakage.sort((a, b) => b.amount - a.amount).slice(0, 10);
}

// ── Campaign Performance Classification ───────────────────────────

function analyzeCampaignPerformance(
  campaigns: Campaign[],
  benchmarks: { avgCPL: number; avgCTR: number }
): CampaignPerformance[] {
  return campaigns.map(c => {
    const cpl = c.leads > 0 ? c.spend / c.leads : 0;
    const conversionRate = c.clicks > 0 ? (c.leads / c.clicks) * 100 : 0;
    const cpm = c.impressions > 0 ? (c.spend / c.impressions) * 1000 : 0;

    let status: CampaignPerformance["status"] = "stable";
    let statusLabel = "Stable";

    if (c.roas > 2.5 && c.ctr > 2) {
      status = "scaling";
      statusLabel = "🚀 Scale";
    } else if (c.leads === 0 && c.purchases === 0 && c.spend > 2000) {
      status = "waste";
      statusLabel = "🔴 Waste";
    } else if (cpl > benchmarks.avgCPL * 1.3 || c.ctr < 1) {
      status = "underperforming";
      statusLabel = "⚠️ Underperforming";
    }

    return { campaign: c, status, statusLabel, cpl, conversionRate, cpm };
  });
}

// ── Recommendation Generation ─────────────────────────────────────

function generateRecommendations(
  campaigns: Campaign[],
  performance: CampaignPerformance[],
  leakage: LeakageItem[]
): Recommendation[] {
  const recs: Recommendation[] = [];

  // Scale recommendations
  performance.filter(p => p.status === "scaling").forEach(p => {
    recs.push({
      action: "Increase Budget",
      target: p.campaign.name,
      priority: "high",
      impact: 8,
      detail: `ROAS ${p.campaign.roas.toFixed(1)}x with CTR ${p.campaign.ctr.toFixed(1)}%. Increase budget by 30% to capture more conversions.`,
      icon: "🚀",
    });
  });

  // Kill recommendations
  performance.filter(p => p.status === "waste").forEach(p => {
    recs.push({
      action: "Pause Campaign",
      target: p.campaign.name,
      priority: "urgent",
      impact: 9,
      detail: `₹${p.campaign.spend.toLocaleString("en-IN")} spent with zero conversions. Immediate pause recommended.`,
      icon: "⛔",
    });
  });

  // Fatigue recommendations
  campaigns.forEach(c => {
    c.adSets?.forEach(as => {
      if (as.frequency > 3.5) {
        recs.push({
          action: "Reduce Frequency",
          target: `${c.name} → ${as.name}`,
          priority: "high",
          impact: 7,
          detail: `Frequency ${as.frequency.toFixed(1)} causing audience fatigue. Expand audience or pause and duplicate.`,
          icon: "🔄",
        });
      }
      as.ads?.forEach(ad => {
        if (ad.fatigue) {
          recs.push({
            action: "Replace Creative",
            target: ad.name,
            priority: "medium",
            impact: 6,
            detail: ad.fatigueReason || "Creative showing fatigue signals. Duplicate with fresh creative.",
            icon: "🎨",
          });
        }
      });
    });
  });

  // CPC optimization
  const totalSpend = campaigns.reduce((s, c) => s + c.spend, 0);
  const totalClicks = campaigns.reduce((s, c) => s + c.clicks, 0);
  const avgCPC = totalClicks > 0 ? totalSpend / totalClicks : 0;

  campaigns.filter(c => c.cpc > avgCPC * 1.3).forEach(c => {
    recs.push({
      action: "Optimize CPC",
      target: c.name,
      priority: "medium",
      impact: 5,
      detail: `CPC ₹${c.cpc.toFixed(0)} is ${Math.round(((c.cpc - avgCPC) / avgCPC) * 100)}% above average. Review ad copy and targeting.`,
      icon: "💸",
    });
  });

  return recs.sort((a, b) => {
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

// ── Metrics for selected campaigns ────────────────────────────────

export type MetricKey = "spend" | "impressions" | "reach" | "clicks" | "ctr" | "cpc" | "cpm" | "leads" | "purchases" | "conversionRate" | "cpl" | "roas" | "frequency";

export const METRIC_OPTIONS: { key: MetricKey; label: string }[] = [
  { key: "spend", label: "Spend" },
  { key: "impressions", label: "Impressions" },
  { key: "reach", label: "Reach" },
  { key: "clicks", label: "Clicks" },
  { key: "ctr", label: "CTR" },
  { key: "cpc", label: "CPC" },
  { key: "cpm", label: "CPM" },
  { key: "leads", label: "Leads" },
  { key: "purchases", label: "Purchases" },
  { key: "conversionRate", label: "Conversion Rate" },
  { key: "cpl", label: "Cost Per Lead" },
  { key: "roas", label: "ROAS" },
  { key: "frequency", label: "Frequency" },
];

export function getCampaignMetricValue(c: Campaign, key: MetricKey): number | string {
  switch (key) {
    case "spend": return c.spend;
    case "impressions": return c.impressions;
    case "reach": return c.impressions * 0.85;
    case "clicks": return c.clicks;
    case "ctr": return c.ctr;
    case "cpc": return c.cpc;
    case "cpm": return c.impressions > 0 ? (c.spend / c.impressions) * 1000 : 0;
    case "leads": return c.leads;
    case "purchases": return c.purchases;
    case "conversionRate": return c.clicks > 0 ? (c.leads / c.clicks) * 100 : 0;
    case "cpl": return c.leads > 0 ? c.spend / c.leads : 0;
    case "roas": return c.roas;
    case "frequency": {
      const totalFreq = c.adSets?.reduce((s, as) => s + as.frequency, 0) || 0;
      const count = c.adSets?.length || 1;
      return totalFreq / count;
    }
    default: return 0;
  }
}

export function formatMetricValue(key: MetricKey, value: number): string {
  switch (key) {
    case "spend": case "cpc": case "cpl": case "cpm":
      return `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
    case "ctr": case "conversionRate":
      return `${value.toFixed(2)}%`;
    case "roas":
      return `${value.toFixed(1)}x`;
    case "frequency":
      return value.toFixed(1);
    case "impressions": case "clicks": case "reach": case "leads": case "purchases":
      return value.toLocaleString("en-IN");
    default:
      return String(value);
  }
}
