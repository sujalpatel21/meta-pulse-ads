import { useState, useEffect, useCallback, useRef } from "react";
import { useDashboard } from "@/components/layout/Layout";
import { computeKPIs } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface BudgetGoal {
  account_id: string;
  campaign_id: string | null;
  campaign_name: string | null;
  target_cpl: number;
  target_roas: number;
  monthly_budget: number;
}

export default function Budget() {
  const { selectedAccount, campaigns } = useDashboard();
  const accountId = selectedAccount?.accountId || "";

  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("all");
  const [targetCPL, setTargetCPL] = useState(300);
  const [targetROAS, setTargetROAS] = useState(3);
  const [monthlyBudget, setMonthlyBudget] = useState(200000);
  const [allGoals, setAllGoals] = useState<BudgetGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Fetch all goals for this account
  const fetchGoals = useCallback(async () => {
    if (!accountId) return;
    setLoading(true);
    const { data } = await supabase
      .from("budget_goals")
      .select("*")
      .eq("account_id", accountId);
    if (data) {
      setAllGoals(data.map((d: any) => ({
        account_id: d.account_id,
        campaign_id: d.campaign_id,
        campaign_name: d.campaign_name,
        target_cpl: Number(d.target_cpl),
        target_roas: Number(d.target_roas),
        monthly_budget: Number(d.monthly_budget),
      })));
    }
    setLoading(false);
  }, [accountId]);

  useEffect(() => { fetchGoals(); }, [fetchGoals]);

  // When selected campaign or goals change, load the right values
  useEffect(() => {
    const campId = selectedCampaignId === "all" ? null : selectedCampaignId;
    const goal = allGoals.find(g => g.campaign_id === campId);
    if (goal) {
      setTargetCPL(goal.target_cpl);
      setTargetROAS(goal.target_roas);
      setMonthlyBudget(goal.monthly_budget);
    } else {
      setTargetCPL(300);
      setTargetROAS(3);
      setMonthlyBudget(200000);
    }
  }, [selectedCampaignId, allGoals]);

  // Reset campaign selection when account changes
  useEffect(() => { setSelectedCampaignId("all"); }, [accountId]);

  // Debounced upsert
  const upsertGoal = useCallback((cpl: number, roas: number, budget: number) => {
    if (!accountId) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const campId = selectedCampaignId === "all" ? null : selectedCampaignId;
      const campName = campId ? campaigns.find(c => c.campaignId === campId)?.name || null : null;
      await supabase.from("budget_goals").upsert({
        account_id: accountId,
        campaign_id: campId,
        campaign_name: campName,
        target_cpl: cpl,
        target_roas: roas,
        monthly_budget: budget,
        updated_at: new Date().toISOString(),
      }, { onConflict: "account_id,campaign_id" });
      fetchGoals();
    }, 500);
  }, [accountId, selectedCampaignId, campaigns, fetchGoals]);

  const handleCPL = (v: number) => { setTargetCPL(v); upsertGoal(v, targetROAS, monthlyBudget); };
  const handleROAS = (v: number) => { setTargetROAS(v); upsertGoal(targetCPL, v, monthlyBudget); };
  const handleBudget = (v: number) => { setMonthlyBudget(v); upsertGoal(targetCPL, targetROAS, v); };

  // Compute metrics for the selected scope
  const selectedCampaign = selectedCampaignId !== "all" ? campaigns.find(c => c.campaignId === selectedCampaignId) : null;
  const scopedCampaigns = selectedCampaign ? [selectedCampaign] : campaigns;
  const kpis = computeKPIs(scopedCampaigns);
  const totalBudget = scopedCampaigns.reduce((s, c) => s + c.budget, 0);

  const budgetUsedPct = Math.min((kpis.spend / monthlyBudget) * 100, 100);
  const daysInMonth = 30;
  const today = new Date().getDate();
  const daysRemaining = daysInMonth - today;
  const dailyRecommended = (monthlyBudget - kpis.spend) / Math.max(daysRemaining, 1);
  const cpl = kpis.leads > 0 ? kpis.spend / kpis.leads : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">Budget & Goals</h1>
          <p className="text-sm mt-0.5 text-muted-foreground">{selectedAccount?.accountName || ""}</p>
        </div>
        <div className="w-full sm:w-64">
          <Select value={selectedCampaignId} onValueChange={setSelectedCampaignId}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="Select Campaign" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Campaigns</SelectItem>
              {campaigns.map(c => (
                <SelectItem key={c.campaignId} value={c.campaignId}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Set Goals */}
        <div className="chart-card p-5">
          <h3 className="text-sm font-semibold mb-1 text-foreground">
            ⚙️ Set Goals {selectedCampaign ? `— ${selectedCampaign.name}` : "— All Campaigns"}
          </h3>
          <p className="text-xs text-muted-foreground mb-4">
            {loading ? "Loading saved goals…" : "Goals auto-save per campaign & account"}
          </p>
          <div className="space-y-5">
            {[
              { label: "Target CPL (₹)", value: targetCPL, setter: handleCPL, min: 50, max: 2000, step: 50 },
              { label: "Target ROAS (x)", value: targetROAS, setter: handleROAS, min: 1, max: 10, step: 0.5 },
              { label: "Monthly Budget (₹)", value: monthlyBudget, setter: handleBudget, min: 10000, max: 1000000, step: 5000 },
            ].map((g) => (
              <div key={g.label}>
                <div className="flex justify-between text-sm mb-2 text-foreground">
                  <span>{g.label}</span>
                  <span className="font-mono font-bold">
                    {g.label.includes("ROAS") ? `${g.value}x` : `₹${g.value.toLocaleString("en-IN")}`}
                  </span>
                </div>
                <input
                  type="range" min={g.min} max={g.max} step={g.step} value={g.value}
                  onChange={(e) => g.setter(Number(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(90deg, hsl(var(--brand)) ${((g.value - g.min) / (g.max - g.min)) * 100}%, hsl(var(--muted)) 0%)`,
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Budget Tracker */}
        <div className="chart-card p-5">
          <h3 className="text-sm font-semibold mb-4 text-foreground">📊 Budget Tracker</h3>
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2 text-muted-foreground">
              <span>Monthly Budget Used</span>
              <span className="font-mono">₹{kpis.spend.toLocaleString("en-IN")} / ₹{monthlyBudget.toLocaleString("en-IN")}</span>
            </div>
            <div className="progress-bar h-3">
              <div className={cn("progress-fill", budgetUsedPct > 90 && "danger")} style={{ width: `${budgetUsedPct}%` }} />
            </div>
            <div className="flex justify-between text-xs mt-1.5 text-muted-foreground">
              <span>{budgetUsedPct.toFixed(1)}% used</span>
              <span>{daysRemaining} days remaining</span>
            </div>
          </div>

          <div className="p-4 rounded-xl mb-4 bg-muted">
            <div className="text-xs mb-1 text-muted-foreground">Recommended Daily Spend</div>
            <div className="text-2xl font-bold font-mono" style={{ color: "hsl(var(--brand))" }}>
              ₹{dailyRecommended.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
            </div>
            <div className="text-xs mt-0.5 text-muted-foreground">
              To use remaining budget over {daysRemaining} days
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Total Campaign Budget", value: `₹${totalBudget.toLocaleString("en-IN")}` },
              { label: "Total Spent", value: `₹${kpis.spend.toLocaleString("en-IN")}` },
              { label: "Remaining Budget", value: `₹${Math.max(monthlyBudget - kpis.spend, 0).toLocaleString("en-IN")}` },
              { label: "Days in Month", value: `${daysRemaining} left` },
            ].map((m) => (
              <div key={m.label} className="p-3 rounded-lg bg-muted">
                <div className="text-xs text-muted-foreground">{m.label}</div>
                <div className="text-sm font-bold font-mono mt-0.5 text-foreground">{m.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Goal Achievement — Per Campaign */}
      <div className="chart-card p-5">
        <h3 className="text-sm font-semibold mb-4 text-foreground">🎯 Goal Achievement — Per Campaign</h3>
        <div className="grid grid-cols-1 gap-4">
          {campaigns.length === 0 && (
            <p className="text-sm text-muted-foreground">No campaigns found for this account.</p>
          )}
          {campaigns.map((camp) => {
            const goal = allGoals.find(g => g.campaign_id === camp.campaignId);
            if (!goal) {
              return (
                <div key={camp.campaignId} className="p-4 rounded-xl border border-border bg-muted/50">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground">{camp.name}</span>
                    <span className="text-xs text-muted-foreground px-2 py-0.5 rounded-full bg-muted">No goals set</span>
                  </div>
                </div>
              );
            }

            const campCPL = camp.leads > 0 ? camp.spend / camp.leads : 0;
            const campROAS = camp.roas || 0;
            const campSpendPct = goal.monthly_budget > 0 ? (camp.spend / goal.monthly_budget) * 100 : 0;

            const cplOk = campCPL <= goal.target_cpl || camp.leads === 0;
            const roasOk = campROAS >= goal.target_roas || campROAS === 0;
            const budgetOk = campSpendPct <= 85;
            const allOk = cplOk && roasOk && budgetOk;

            const alerts: string[] = [];
            if (!cplOk) alerts.push(`CPL ₹${campCPL.toFixed(0)} — ₹${(campCPL - goal.target_cpl).toFixed(0)} above your ₹${goal.target_cpl} target`);
            if (!roasOk) alerts.push(`ROAS ${campROAS.toFixed(1)}x — ${(goal.target_roas - campROAS).toFixed(1)}x below your ${goal.target_roas}x target`);
            if (!budgetOk) alerts.push(`Budget ${campSpendPct.toFixed(0)}% used — overspend risk (target < 85%)`);

            return (
              <div key={camp.campaignId} className={cn("p-4 rounded-xl border", allOk ? "alert-healthy" : "alert-critical")}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold">{camp.name}</span>
                  <span className="text-lg">{allOk ? "✅" : "❌"}</span>
                </div>
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div>
                    <div className="text-xs opacity-70">CPL</div>
                    <div className={cn("text-lg font-bold font-mono", !cplOk && "text-destructive")}>
                      {camp.leads > 0 ? `₹${campCPL.toFixed(0)}` : "—"}
                    </div>
                    <div className="text-xs opacity-60">Target: ₹{goal.target_cpl}</div>
                  </div>
                  <div>
                    <div className="text-xs opacity-70">ROAS</div>
                    <div className={cn("text-lg font-bold font-mono", !roasOk && "text-destructive")}>
                      {campROAS > 0 ? `${campROAS.toFixed(1)}x` : "—"}
                    </div>
                    <div className="text-xs opacity-60">Target: {goal.target_roas}x</div>
                  </div>
                  <div>
                    <div className="text-xs opacity-70">Budget</div>
                    <div className={cn("text-lg font-bold font-mono", !budgetOk && "text-destructive")}>
                      {campSpendPct.toFixed(0)}%
                    </div>
                    <div className="text-xs opacity-60">Target: &lt; 85%</div>
                  </div>
                </div>
                {alerts.length > 0 && (
                  <div className="space-y-1">
                    {alerts.map((a, i) => (
                      <div key={i} className="text-xs px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive">
                        ⚠️ {a}
                      </div>
                    ))}
                  </div>
                )}
                {allOk && (
                  <div className="text-xs px-3 py-1.5 rounded-lg bg-green-500/10 text-green-600">
                    ✅ All goals on track
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
