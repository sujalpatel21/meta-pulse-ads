import { useState } from "react";
import { useDashboard } from "@/components/layout/Layout";
import { computeKPIs } from "@/data/mockData";
import { cn } from "@/lib/utils";

export default function Budget() {
  const { selectedAccount } = useDashboard();
  const kpis = computeKPIs(selectedAccount.campaigns);
  const totalBudget = selectedAccount.campaigns.reduce((s, c) => s + c.budget, 0);

  const [targetCPL, setTargetCPL] = useState(300);
  const [targetROAS, setTargetROAS] = useState(3);
  const [monthlyBudget, setMonthlyBudget] = useState(200000);

  const budgetUsedPct = Math.min((kpis.spend / monthlyBudget) * 100, 100);
  const daysInMonth = 30;
  const today = new Date().getDate();
  const daysRemaining = daysInMonth - today;
  const dailyRecommended = (monthlyBudget - kpis.spend) / Math.max(daysRemaining, 1);
  const cpl = kpis.leads > 0 ? kpis.spend / kpis.leads : 0;

  const cplOk = cpl <= targetCPL || kpis.leads === 0;
  const roasOk = kpis.roas >= targetROAS || kpis.roas === 0;
  const budgetOk = budgetUsedPct <= 85;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold" style={{ color: "hsl(var(--foreground))" }}>Budget & Goals</h1>
        <p className="text-sm mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>{selectedAccount.accountName}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Goal Settings */}
        <div className="chart-card p-5">
          <h3 className="text-sm font-semibold mb-4" style={{ color: "hsl(var(--foreground))" }}>⚙️ Set Goals</h3>
          <div className="space-y-5">
            {[
              { label: "Target CPL (₹)", value: targetCPL, setter: setTargetCPL, min: 50, max: 2000, step: 50 },
              { label: "Target ROAS (x)", value: targetROAS, setter: setTargetROAS, min: 1, max: 10, step: 0.5 },
              { label: "Monthly Budget (₹)", value: monthlyBudget, setter: setMonthlyBudget, min: 10000, max: 1000000, step: 5000 },
            ].map((g) => (
              <div key={g.label}>
                <div className="flex justify-between text-sm mb-2" style={{ color: "hsl(var(--foreground))" }}>
                  <span>{g.label}</span>
                  <span className="font-mono font-bold">{g.label.includes("ROAS") ? `${g.value}x` : `₹${g.value.toLocaleString("en-IN")}`}</span>
                </div>
                <input
                  type="range" min={g.min} max={g.max} step={g.step} value={g.value}
                  onChange={(e) => g.setter(Number(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer"
                  style={{ background: `linear-gradient(90deg, hsl(var(--brand)) ${((g.value - g.min) / (g.max - g.min)) * 100}%, hsl(var(--muted)) 0%)` }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Budget Status */}
        <div className="chart-card p-5">
          <h3 className="text-sm font-semibold mb-4" style={{ color: "hsl(var(--foreground))" }}>📊 Budget Tracker</h3>
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2" style={{ color: "hsl(var(--muted-foreground))" }}>
              <span>Monthly Budget Used</span>
              <span className="font-mono">₹{kpis.spend.toLocaleString("en-IN")} / ₹{monthlyBudget.toLocaleString("en-IN")}</span>
            </div>
            <div className="progress-bar h-3">
              <div className={cn("progress-fill", budgetUsedPct > 90 && "danger")} style={{ width: `${budgetUsedPct}%` }} />
            </div>
            <div className="flex justify-between text-xs mt-1.5" style={{ color: "hsl(var(--muted-foreground))" }}>
              <span>{budgetUsedPct.toFixed(1)}% used</span>
              <span>{daysRemaining} days remaining</span>
            </div>
          </div>

          <div className="p-4 rounded-xl mb-4" style={{ background: "hsl(var(--muted))" }}>
            <div className="text-xs mb-1" style={{ color: "hsl(var(--muted-foreground))" }}>Recommended Daily Spend</div>
            <div className="text-2xl font-bold font-mono" style={{ color: "hsl(var(--brand))" }}>
              ₹{dailyRecommended.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
            </div>
            <div className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
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
              <div key={m.label} className="p-3 rounded-lg" style={{ background: "hsl(var(--muted))" }}>
                <div className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>{m.label}</div>
                <div className="text-sm font-bold font-mono mt-0.5" style={{ color: "hsl(var(--foreground))" }}>{m.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Goal Achievement */}
      <div className="chart-card p-5">
        <h3 className="text-sm font-semibold mb-4" style={{ color: "hsl(var(--foreground))" }}>🎯 Goal Achievement</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "CPL Goal", target: `₹${targetCPL}`, actual: cpl > 0 ? `₹${cpl.toFixed(0)}` : "—", ok: cplOk, desc: cplOk ? "Within target" : `₹${(cpl - targetCPL).toFixed(0)} above target` },
            { label: "ROAS Goal", target: `${targetROAS}x`, actual: kpis.roas > 0 ? `${kpis.roas.toFixed(1)}x` : "—", ok: roasOk, desc: roasOk ? "Meeting target" : `${(targetROAS - kpis.roas).toFixed(1)}x below target` },
            { label: "Budget Control", target: "< 85%", actual: `${budgetUsedPct.toFixed(1)}%`, ok: budgetOk, desc: budgetOk ? "Under control" : "Overspend risk" },
          ].map((g) => (
            <div key={g.label} className={cn("p-5 rounded-xl border", g.ok ? "alert-healthy" : "alert-critical")}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold">{g.label}</span>
                <span className="text-xl">{g.ok ? "✅" : "❌"}</span>
              </div>
              <div className="text-2xl font-bold font-mono mb-1">{g.actual}</div>
              <div className="text-xs opacity-80">Target: {g.target}</div>
              <div className="text-xs mt-1 opacity-80">{g.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
