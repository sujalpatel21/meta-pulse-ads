import { useState, useMemo, useEffect } from "react";
import { useDashboard } from "@/components/layout/Layout";
import { FlaskConical, Layers, Image, Trophy, Clock, AlertTriangle, ChevronDown, Loader2 } from "lucide-react";
import {
  detectCampaignTests,
  detectAdTests,
  generateRecommendations,
  AutoDetectedTest,
} from "@/lib/abTestEngine";
import { fetchAdSets, fetchAds, getDateRangeFromPreset } from "@/services/metaService";
import { Campaign } from "@/data/mockData";
import TestComparisonTable from "@/components/ab-testing/TestComparisonTable";
import AIRecommendations from "@/components/ab-testing/AIRecommendations";

type TabKey = "all" | "campaign" | "ad";

const TABS: { key: TabKey; label: string; icon: React.ReactNode; desc: string }[] = [
  { key: "all", label: "All Tests", icon: <FlaskConical size={14} />, desc: "All auto-detected tests" },
  { key: "campaign", label: "Strategy", icon: <Layers size={14} />, desc: "Campaign vs Campaign" },
  { key: "ad", label: "Creative", icon: <Image size={14} />, desc: "Ad vs Ad" },
];

export default function ABTesting() {
  const { campaigns, campaignsLoading, apiError, dateRange } = useDashboard();
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("all");
  const [enrichedCampaigns, setEnrichedCampaigns] = useState<Campaign[]>([]);
  const [loadingCreatives, setLoadingCreatives] = useState(false);

  // Fetch ad sets + ads for creative testing
  useEffect(() => {
    if (campaigns.length === 0) return;

    const targetCampaigns = selectedCampaignId === "all"
      ? campaigns.filter(c => c.spend > 0).slice(0, 5) // top 5 spending campaigns
      : campaigns.filter(c => c.campaignId === selectedCampaignId);

    if (targetCampaigns.length === 0) {
      setEnrichedCampaigns([]);
      return;
    }

    let cancelled = false;
    setLoadingCreatives(true);

    const dr = getDateRangeFromPreset(dateRange);

    Promise.all(
      targetCampaigns.map(async (camp) => {
        try {
          const adSets = await fetchAdSets(camp.campaignId, dr);
          // Fetch ads for each ad set
          const enrichedAdSets = await Promise.all(
            adSets.map(async (adSet) => {
              try {
                const ads = await fetchAds(adSet.adSetId, dr);
                return { ...adSet, ads };
              } catch {
                return adSet;
              }
            })
          );
          return { ...camp, adSets: enrichedAdSets };
        } catch {
          return camp;
        }
      })
    ).then((results) => {
      if (!cancelled) {
        setEnrichedCampaigns(results);
        setLoadingCreatives(false);
      }
    });

    return () => { cancelled = true; };
  }, [campaigns, selectedCampaignId, dateRange]);

  const campaignTests = useMemo(() => detectCampaignTests(campaigns), [campaigns]);
  const adTests = useMemo(() => detectAdTests(enrichedCampaigns), [enrichedCampaigns]);

  const allTests = useMemo(() => [...campaignTests, ...adTests], [campaignTests, adTests]);
  const recommendations = useMemo(() => generateRecommendations(allTests), [allTests]);

  const filteredTests = useMemo(() => {
    if (activeTab === "all") return allTests;
    if (activeTab === "campaign") return campaignTests;
    if (activeTab === "ad") return adTests;
    return allTests;
  }, [activeTab, allTests, campaignTests, adTests]);

  const stats = useMemo(() => ({
    total: allTests.length,
    winners: allTests.filter((t) => t.winnerVerdict === "winner").length,
    inconclusive: allTests.filter((t) => t.winnerVerdict === "inconclusive").length,
    collecting: allTests.filter((t) => t.winnerVerdict === "collecting").length,
    campaign: campaignTests.length,
    ad: adTests.length,
  }), [allTests, campaignTests, adTests]);

  // Active campaigns for the dropdown
  const activeCampaigns = useMemo(() =>
    campaigns.filter(c => c.spend > 0),
    [campaigns]
  );

  const loading = campaignsLoading;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2" style={{ color: "hsl(var(--foreground))" }}>
            <FlaskConical size={22} style={{ color: "hsl(var(--brand))" }} />
            A/B Testing Intelligence
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
            Auto-detected tests across campaigns &amp; creatives
          </p>
        </div>
        {!loading && allTests.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "hsl(var(--metric-positive))" }} />
            <span className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
              {allTests.length} tests detected
            </span>
          </div>
        )}
      </div>

      {/* API Error */}
      {apiError && (
        <div className="p-3 rounded-lg text-sm" style={{
          background: "hsl(var(--metric-negative) / 0.1)",
          color: "hsl(0 84% 60%)",
          border: "1px solid hsl(var(--metric-negative) / 0.2)",
        }}>
          ⚠️ API Error: {apiError} — Showing available data
        </div>
      )}

      {/* KPI Strip */}
      {!loading && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <KPICard icon={<FlaskConical size={16} />} iconBg="hsl(var(--brand) / 0.15)" iconColor="hsl(var(--brand))" label="Total Tests" value={stats.total} />
          <KPICard icon={<Trophy size={16} />} iconBg="hsl(var(--metric-positive) / 0.15)" iconColor="hsl(var(--metric-positive))" label="Winners Found" value={stats.winners} />
          <KPICard icon={<AlertTriangle size={16} />} iconBg="hsl(var(--metric-warning) / 0.15)" iconColor="hsl(var(--metric-warning))" label="Inconclusive" value={stats.inconclusive} />
          <KPICard icon={<Clock size={16} />} iconBg="hsl(var(--muted) / 0.3)" iconColor="hsl(var(--muted-foreground))" label="Collecting Data" value={stats.collecting} />
        </div>
      )}

      {/* Tabs + Campaign Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center gap-1 p-1 rounded-lg w-fit" style={{
          background: "hsl(var(--muted) / 0.3)",
          border: "1px solid hsl(var(--border) / 0.5)",
        }}>
          {TABS.map((tab) => {
            const count = tab.key === "all" ? stats.total : stats[tab.key as "campaign" | "ad"];
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-all"
                style={{
                  background: activeTab === tab.key ? "hsl(var(--brand) / 0.15)" : "transparent",
                  color: activeTab === tab.key ? "hsl(var(--brand))" : "hsl(var(--muted-foreground))",
                  border: activeTab === tab.key ? "1px solid hsl(var(--brand) / 0.3)" : "1px solid transparent",
                }}
              >
                {tab.icon}
                {tab.label}
                <span className="ml-1 opacity-60">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Campaign selector for creative tab */}
        {(activeTab === "ad" || activeTab === "all") && activeCampaigns.length > 0 && (
          <div className="relative">
            <select
              value={selectedCampaignId}
              onChange={(e) => setSelectedCampaignId(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 rounded-lg text-xs font-medium outline-none cursor-pointer transition-all"
              style={{
                background: "hsl(var(--muted) / 0.3)",
                border: "1px solid hsl(var(--border))",
                color: "hsl(var(--foreground))",
              }}
            >
              <option value="all">All Campaigns (Top 5)</option>
              {activeCampaigns.map((c) => (
                <option key={c.campaignId} value={c.campaignId}>
                  {c.name.length > 45 ? c.name.substring(0, 42) + "..." : c.name}
                </option>
              ))}
            </select>
            <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "hsl(var(--muted-foreground))" }} />
          </div>
        )}

        {loadingCreatives && (
          <div className="flex items-center gap-1.5 text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
            <Loader2 size={12} className="animate-spin" />
            Loading creatives...
          </div>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-1 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="chart-card h-[200px] animate-pulse" style={{ background: "hsl(var(--muted) / 0.3)" }} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !loadingCreatives && filteredTests.length === 0 && (
        <div className="chart-card p-12 text-center">
          <FlaskConical size={40} className="mx-auto mb-3" style={{ color: "hsl(var(--muted-foreground))" }} />
          <h3 className="text-sm font-semibold mb-1" style={{ color: "hsl(var(--foreground))" }}>No tests detected</h3>
          <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
            {activeTab === "ad"
              ? "No ad sets with 2+ ads found in the selected campaign. Select a different campaign or check your ad structure."
              : "Tests are auto-detected when multiple campaigns share the same objective, or when ads exist within the same ad set."}
          </p>
        </div>
      )}

      {/* AI Recommendations */}
      {!loading && activeTab === "all" && recommendations.length > 0 && (
        <AIRecommendations recommendations={recommendations} />
      )}

      {/* Test Cards */}
      {!loading && filteredTests.length > 0 && (
        <div className="space-y-4">
          {(activeTab === "all" || activeTab === "campaign") && campaignTests.length > 0 && (
            <>
              {activeTab === "all" && (
                <SectionHeader icon={<Layers size={15} />} title="Strategy Tests" subtitle="Campaigns with same objective compared" count={campaignTests.length} />
              )}
              {(activeTab === "all" ? campaignTests : filteredTests.filter(t => t.level === "campaign")).map((test) => (
                <TestComparisonTable key={test.testId} test={test} />
              ))}
            </>
          )}

          {(activeTab === "all" || activeTab === "ad") && adTests.length > 0 && (
            <>
              {activeTab === "all" && (
                <SectionHeader icon={<Image size={15} />} title="Creative Tests" subtitle="Ads within the same ad set compared" count={adTests.length} />
              )}
              {adTests.map((test) => (
                <TestComparisonTable key={test.testId} test={test} />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function KPICard({ icon, iconBg, iconColor, label, value }: { icon: React.ReactNode; iconBg: string; iconColor: string; label: string; value: number }) {
  return (
    <div className="chart-card p-3.5 flex items-center gap-3">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: iconBg }}>
        <span style={{ color: iconColor }}>{icon}</span>
      </div>
      <div>
        <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: "hsl(var(--muted-foreground))" }}>{label}</p>
        <p className="text-lg font-bold" style={{ color: "hsl(var(--foreground))" }}>{value}</p>
      </div>
    </div>
  );
}

function SectionHeader({ icon, title, subtitle, count }: { icon: React.ReactNode; title: string; subtitle: string; count: number }) {
  return (
    <div className="flex items-center gap-2.5 pt-4 pb-1">
      <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "hsl(var(--brand) / 0.12)" }}>
        <span style={{ color: "hsl(var(--brand))" }}>{icon}</span>
      </div>
      <div>
        <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: "hsl(var(--foreground))" }}>
          {title}
          <span className="text-[10px] font-normal px-1.5 py-0.5 rounded-full" style={{
            background: "hsl(var(--muted) / 0.5)",
            color: "hsl(var(--muted-foreground))",
          }}>
            {count}
          </span>
        </h3>
        <p className="text-[10px]" style={{ color: "hsl(var(--muted-foreground))" }}>{subtitle}</p>
      </div>
    </div>
  );
}
