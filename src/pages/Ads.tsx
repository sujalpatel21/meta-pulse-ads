import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useDashboard } from "@/components/layout/Layout";
import { Ad } from "@/data/mockData";
import { fetchAds, getDateRangeFromPreset } from "@/services/metaService";
import { ArrowLeft, AlertTriangle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Ads() {
  const { campaigns, dateRange, liveMode } = useDashboard();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const adSetId = searchParams.get("adset");
  const adId = searchParams.get("ad");

  const [ads, setAds] = useState<Ad[]>([]);
  const [selectedAd, setSelectedAd] = useState<Ad | null>(null);
  const [adSetName, setAdSetName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAds = async () => {
      setLoading(true);
      let foundAds: Ad[] = [];

      // Always fetch from API in live mode
      if (adSetId && liveMode) {
        try {
          const dr = getDateRangeFromPreset(dateRange);
          foundAds = await fetchAds(adSetId, dr);
          setAdSetName(adSetId);
        } catch (e) {
          console.warn("Failed to fetch ads:", e);
          foundAds = [];
        }
      }

      // Fallback: try inline data from campaigns (mock mode)
      if (foundAds.length === 0 && !liveMode) {
        for (const c of campaigns) {
          for (const as of (c.adSets || [])) {
            if (!adSetId || as.adSetId === adSetId) {
              foundAds = as.ads || [];
              setAdSetName(as.name);
              break;
            }
          }
          if (foundAds.length > 0) break;
        }
      }

      setAds(foundAds);
      const selected = adId ? foundAds.find((a) => a.adId === adId) || foundAds[0] : foundAds[0];
      setSelectedAd(selected || null);
      setLoading(false);
    };
    loadAds();
  }, [adSetId, adId, campaigns, dateRange, liveMode]);

  if (loading) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="h-64 bg-muted rounded-xl animate-pulse" />
      </div>
    );
  }

  const EngagementBar = ({ score }: { score: number }) => (
    <div className="progress-bar mt-1">
      <div
        className="progress-fill"
        style={{
          width: `${score}%`,
          background: score >= 70 ? "var(--gradient-positive)" : score >= 50 ? "linear-gradient(90deg, hsl(38,92%,50%), hsl(38,92%,60%))" : "linear-gradient(90deg, hsl(0,84%,50%), hsl(0,84%,60%))",
        }}
      />
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(adSetId ? `/adsets?adset=${adSetId}` : "/adsets")}
          className="p-1.5 rounded-md hover:bg-muted transition-colors"
          style={{ color: "hsl(var(--muted-foreground))" }}
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-xl font-bold" style={{ color: "hsl(var(--foreground))" }}>Ads</h1>
          <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
            {adSetName || "All Ads"}
          </p>
        </div>
      </div>

      {ads.length === 0 ? (
        <div className="chart-card p-12 text-center">
          <p style={{ color: "hsl(var(--muted-foreground))" }}>
            No ads found. Navigate from Campaigns → Ad Sets → Ads.
          </p>
          <button onClick={() => navigate("/campaigns")} className="mt-4 text-sm" style={{ color: "hsl(var(--brand))" }}>
            Go to Campaigns →
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="chart-card p-4 space-y-2 lg:col-span-1">
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "hsl(var(--muted-foreground))" }}>
              Ads ({ads.length})
            </h3>
            {ads.map((ad) => (
              <button
                key={ad.adId}
                onClick={() => setSelectedAd(ad)}
                className={cn(
                  "w-full text-left p-3 rounded-lg transition-all border",
                  selectedAd?.adId === ad.adId
                    ? "border-brand/30 bg-brand/10"
                    : "border-transparent hover:bg-muted"
                )}
              >
                <div className="flex items-center gap-2">
                  <img src={ad.thumbnail} alt={ad.name} className="w-10 h-7 rounded object-cover shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs font-medium truncate" style={{
                      color: selectedAd?.adId === ad.adId ? "hsl(var(--brand))" : "hsl(var(--foreground))"
                    }}>
                      {ad.name}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      {ad.fatigue && <AlertTriangle size={9} style={{ color: "hsl(var(--metric-warning))" }} />}
                      <span className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                        CTR {ad.ctr.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {selectedAd && (
            <div className="lg:col-span-3 space-y-4">
              <div className="chart-card p-5">
                <div className="flex gap-5 mb-5">
                  <img
                    src={selectedAd.thumbnail}
                    alt={selectedAd.name}
                    className="w-32 h-24 rounded-xl object-cover shrink-0"
                    style={{ border: "2px solid hsl(var(--border))" }}
                  />
                  <div className="flex-1">
                    <h2 className="text-lg font-bold mb-2" style={{ color: "hsl(var(--foreground))" }}>
                      {selectedAd.name}
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", selectedAd.status === "Active" ? "status-active" : "status-paused")}>
                        {selectedAd.status}
                      </span>
                      {selectedAd.fatigue ? (
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium alert-warning flex items-center gap-1">
                          <AlertTriangle size={10} /> Ad Fatigue Detected
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium alert-healthy flex items-center gap-1">
                          <CheckCircle size={10} /> Healthy
                        </span>
                      )}
                    </div>
                    {selectedAd.fatigue && selectedAd.fatigueReason && (
                      <p className="text-xs mt-2 p-2 rounded-lg" style={{
                        background: "hsl(38,92%,50%/0.1)",
                        color: "hsl(38,92%,60%)",
                        border: "1px solid hsl(38,92%,50%/0.2)",
                      }}>
                        ⚠ {selectedAd.fatigueReason}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mb-5 p-4 rounded-lg" style={{ background: "hsl(var(--muted))" }}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-semibold" style={{ color: "hsl(var(--muted-foreground))" }}>
                      ENGAGEMENT SCORE
                    </span>
                    <span className="text-xl font-bold font-mono" style={{
                      color: selectedAd.engagementScore >= 70 ? "hsl(var(--metric-positive))" :
                        selectedAd.engagementScore >= 50 ? "hsl(var(--metric-warning))" : "hsl(var(--metric-negative))"
                    }}>
                      {selectedAd.engagementScore}/100
                    </span>
                  </div>
                  <EngagementBar score={selectedAd.engagementScore} />
                  <p className="text-xs mt-2" style={{ color: "hsl(var(--muted-foreground))" }}>
                    {selectedAd.engagementScore >= 70 ? "Strong creative performance" :
                      selectedAd.engagementScore >= 50 ? "Average — consider A/B testing a new creative" :
                        "Poor — refresh creative immediately"}
                  </p>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {[
                    { label: "Spend", value: `₹${selectedAd.spend.toLocaleString("en-IN")}` },
                    { label: "Impressions", value: selectedAd.impressions.toLocaleString("en-IN") },
                    { label: "Clicks", value: selectedAd.clicks.toLocaleString("en-IN") },
                    { label: "Leads", value: selectedAd.leads.toString() },
                    { label: "Purchases", value: selectedAd.purchases.toString() },
                    { label: "CTR", value: `${selectedAd.ctr.toFixed(2)}%` },
                    { label: "CPC", value: `₹${selectedAd.cpc.toFixed(2)}` },
                    { label: "ROAS", value: `${selectedAd.roas.toFixed(1)}x` },
                  ].map((m) => (
                    <div key={m.label} className="p-3 rounded-lg" style={{ background: "hsl(var(--muted))" }}>
                      <div className="text-xs mb-1" style={{ color: "hsl(var(--muted-foreground))" }}>{m.label}</div>
                      <div className="text-sm font-bold font-mono" style={{ color: "hsl(var(--foreground))" }}>{m.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="chart-card p-5">
                <h3 className="text-sm font-semibold mb-4" style={{ color: "hsl(var(--foreground))" }}>
                  All Ads Comparison
                </h3>
                <div className="overflow-x-auto">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Ad Name</th><th>Spend</th><th>Leads</th><th>CTR</th><th>CPC</th><th>ROAS</th><th>Score</th><th>Fatigue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ads.map((ad) => (
                        <tr
                          key={ad.adId}
                          onClick={() => setSelectedAd(ad)}
                          className="cursor-pointer"
                          style={selectedAd?.adId === ad.adId ? { background: "hsl(var(--brand)/0.05)" } : {}}
                        >
                          <td>
                            <div className="flex items-center gap-2">
                              <img src={ad.thumbnail} className="w-8 h-6 rounded object-cover" alt="" />
                              <span className="text-xs font-medium truncate max-w-[140px]" style={{ color: "hsl(var(--foreground))" }}>{ad.name}</span>
                            </div>
                          </td>
                          <td className="font-mono text-xs">₹{ad.spend.toLocaleString("en-IN")}</td>
                          <td className="font-mono text-xs" style={{ color: "hsl(var(--metric-positive))" }}>{ad.leads}</td>
                          <td className="font-mono text-xs">{ad.ctr.toFixed(2)}%</td>
                          <td className="font-mono text-xs">₹{ad.cpc.toFixed(2)}</td>
                          <td className="font-mono text-xs">{ad.roas.toFixed(1)}x</td>
                          <td>
                            <span className="text-xs font-mono font-bold" style={{
                              color: ad.engagementScore >= 70 ? "hsl(var(--metric-positive))" :
                                ad.engagementScore >= 50 ? "hsl(var(--metric-warning))" : "hsl(var(--metric-negative))"
                            }}>
                              {ad.engagementScore}
                            </span>
                          </td>
                          <td>
                            {ad.fatigue ? (
                              <span className="text-xs alert-warning px-1.5 py-0.5 rounded-full">Yes</span>
                            ) : (
                              <span className="text-xs alert-healthy px-1.5 py-0.5 rounded-full">No</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
