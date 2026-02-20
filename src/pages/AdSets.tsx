import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useDashboard } from "@/components/layout/Layout";
import { AdSet, Campaign } from "@/data/mockData";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdSets() {
  const { selectedAccount } = useDashboard();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const campaignId = searchParams.get("campaign");
  const adSetId = searchParams.get("adset");

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [selectedAdSet, setSelectedAdSet] = useState<AdSet | null>(null);

  useEffect(() => {
    const allCampaigns = selectedAccount.campaigns;
    const c = campaignId
      ? allCampaigns.find((c) => c.campaignId === campaignId)
      : allCampaigns.find((c) => c.adSets.length > 0);
    setCampaign(c || null);

    if (c && c.adSets.length > 0) {
      const as = adSetId ? c.adSets.find((a) => a.adSetId === adSetId) : c.adSets[0];
      setSelectedAdSet(as || c.adSets[0]);
    }
  }, [campaignId, adSetId, selectedAccount]);

  const adSets = campaign?.adSets || [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(campaignId ? `/campaigns?id=${campaignId}` : "/campaigns")}
          className="p-1.5 rounded-md hover:bg-muted transition-colors"
          style={{ color: "hsl(var(--muted-foreground))" }}
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-xl font-bold" style={{ color: "hsl(var(--foreground))" }}>Ad Sets</h1>
          <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
            {campaign?.name || "Select a campaign"}
          </p>
        </div>
      </div>

      {adSets.length === 0 ? (
        <div className="chart-card p-12 text-center">
          <p style={{ color: "hsl(var(--muted-foreground))" }}>
            No ad sets found. Select a campaign with ad sets from the Campaigns page.
          </p>
          <button onClick={() => navigate("/campaigns")} className="mt-4 text-sm" style={{ color: "hsl(var(--brand))" }}>
            Go to Campaigns →
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Ad Set List */}
          <div className="chart-card p-4 space-y-2 lg:col-span-1">
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "hsl(var(--muted-foreground))" }}>
              Ad Sets
            </h3>
            {adSets.map((as) => (
              <button
                key={as.adSetId}
                onClick={() => setSelectedAdSet(as)}
                className={cn(
                  "w-full text-left p-3 rounded-lg transition-all border",
                  selectedAdSet?.adSetId === as.adSetId
                    ? "border-brand/30 bg-brand/10"
                    : "border-transparent hover:bg-muted"
                )}
              >
                <div className="text-xs font-semibold leading-tight" style={{
                  color: selectedAdSet?.adSetId === as.adSetId ? "hsl(var(--brand))" : "hsl(var(--foreground))"
                }}>
                  {as.name}
                </div>
                <div className="text-xs mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>
                  {as.leads} leads · Freq {as.frequency}x
                </div>
              </button>
            ))}
          </div>

          {/* Ad Set Detail */}
          {selectedAdSet && (
            <div className="lg:col-span-3 space-y-4">
              <div className="chart-card p-5">
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <h2 className="text-base font-bold" style={{ color: "hsl(var(--foreground))" }}>
                      {selectedAdSet.name}
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }}>
                        {selectedAdSet.audienceType}
                      </span>
                      <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", selectedAdSet.status === "Active" ? "status-active" : "status-paused")}>
                        {selectedAdSet.status}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate(`/ads?adset=${selectedAdSet.adSetId}`)}
                    className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg font-medium transition-all"
                    style={{ background: "hsl(var(--brand))", color: "hsl(var(--primary-foreground))" }}
                  >
                    View Ads <ArrowRight size={12} />
                  </button>
                </div>

                {/* Budget Progress */}
                <div className="mb-5">
                  <div className="flex justify-between text-xs mb-1.5" style={{ color: "hsl(var(--muted-foreground))" }}>
                    <span>Budget Utilisation</span>
                    <span>₹{selectedAdSet.spend.toLocaleString("en-IN")} / ₹{selectedAdSet.budget.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${Math.min((selectedAdSet.spend / selectedAdSet.budget) * 100, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: "Budget", value: `₹${selectedAdSet.budget.toLocaleString("en-IN")}` },
                    { label: "Spend", value: `₹${selectedAdSet.spend.toLocaleString("en-IN")}` },
                    { label: "Leads", value: selectedAdSet.leads.toString() },
                    { label: "Purchases", value: selectedAdSet.purchases.toString() },
                    { label: "CTR", value: `${selectedAdSet.ctr.toFixed(2)}%` },
                    { label: "CPC", value: `₹${selectedAdSet.cpc.toFixed(2)}` },
                    { label: "Frequency", value: `${selectedAdSet.frequency}x` },
                    { label: "Clicks", value: selectedAdSet.clicks.toLocaleString("en-IN") },
                  ].map((m) => (
                    <div key={m.label} className="p-3 rounded-lg" style={{ background: "hsl(var(--muted))" }}>
                      <div className="text-xs mb-1" style={{ color: "hsl(var(--muted-foreground))" }}>{m.label}</div>
                      <div className="text-sm font-bold font-mono" style={{ color: "hsl(var(--foreground))" }}>{m.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ads Preview */}
              <div className="chart-card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>
                    Ads in this Ad Set ({selectedAdSet.ads.length})
                  </h3>
                  <button
                    onClick={() => navigate(`/ads?adset=${selectedAdSet.adSetId}`)}
                    className="text-xs flex items-center gap-1"
                    style={{ color: "hsl(var(--brand))" }}
                  >
                    View All Ads <ArrowRight size={11} />
                  </button>
                </div>
                <div className="space-y-3">
                  {selectedAdSet.ads.map((ad) => (
                    <div
                      key={ad.adId}
                      className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                      style={{ border: "1px solid hsl(var(--border))" }}
                      onClick={() => navigate(`/ads?adset=${selectedAdSet.adSetId}&ad=${ad.adId}`)}
                    >
                      <img
                        src={ad.thumbnail}
                        alt={ad.name}
                        className="w-14 h-10 rounded-md object-cover shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate" style={{ color: "hsl(var(--foreground))" }}>
                          {ad.name}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          {ad.fatigue && (
                            <span className="text-xs px-1.5 py-0.5 rounded-full alert-warning">
                              ⚠ Fatigue
                            </span>
                          )}
                          <span className={cn("text-xs px-1.5 py-0.5 rounded-full font-medium", ad.status === "Active" ? "status-active" : "status-paused")}>
                            {ad.status}
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-xs font-mono text-right shrink-0">
                        <div>
                          <div className="font-semibold" style={{ color: "hsl(var(--foreground))" }}>
                            ₹{ad.spend.toLocaleString("en-IN")}
                          </div>
                          <div style={{ color: "hsl(var(--muted-foreground))" }}>Spend</div>
                        </div>
                        <div>
                          <div className="font-semibold" style={{ color: "hsl(var(--metric-positive))" }}>
                            {ad.leads}
                          </div>
                          <div style={{ color: "hsl(var(--muted-foreground))" }}>Leads</div>
                        </div>
                        <div>
                          <div className="font-semibold" style={{ color: "hsl(var(--foreground))" }}>
                            {ad.ctr.toFixed(2)}%
                          </div>
                          <div style={{ color: "hsl(var(--muted-foreground))" }}>CTR</div>
                        </div>
                      </div>
                      <ArrowRight size={14} style={{ color: "hsl(var(--muted-foreground))" }} className="shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
