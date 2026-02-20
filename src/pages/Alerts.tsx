import { useEffect, useState } from "react";
import { useDashboard } from "@/components/layout/Layout";
import { generateAlerts, Alert } from "@/services/metaService";
import { AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Alerts() {
  const { selectedAccount } = useDashboard();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    generateAlerts(selectedAccount.campaigns).then((a) => { setAlerts(a); setLoading(false); });
  }, [selectedAccount]);

  const critical = alerts.filter((a) => a.type === "critical");
  const warning = alerts.filter((a) => a.type === "warning");
  const healthy = alerts.filter((a) => a.type === "healthy");

  const Icon = ({ type }: { type: Alert["type"] }) =>
    type === "critical" ? <XCircle size={16} /> : type === "warning" ? <AlertTriangle size={16} /> : <CheckCircle size={16} />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold" style={{ color: "hsl(var(--foreground))" }}>Smart Alerts</h1>
        <p className="text-sm mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>Automated performance alerts for {selectedAccount.accountName}</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Critical", count: critical.length, type: "critical", cls: "alert-critical" },
          { label: "Warnings", count: warning.length, type: "warning", cls: "alert-warning" },
          { label: "Healthy", count: healthy.length, type: "healthy", cls: "alert-healthy" },
        ].map((s) => (
          <div key={s.label} className={cn("p-5 rounded-xl text-center", s.cls)}>
            <div className="text-3xl font-bold font-mono">{s.count}</div>
            <div className="text-sm font-medium mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />)}</div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div key={alert.id} className={cn("chart-card p-4 flex items-start gap-4", alert.type === "critical" ? "border-l-4 border-l-red-500" : alert.type === "warning" ? "border-l-4 border-l-amber-500" : "border-l-4 border-l-emerald-500")}>
              <div className={cn("mt-0.5 shrink-0", alert.type === "critical" ? "text-red-400" : alert.type === "warning" ? "text-amber-400" : "text-emerald-400")}>
                <Icon type={alert.type} />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-sm" style={{ color: "hsl(var(--foreground))" }}>{alert.title}</div>
                <div className="text-sm mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>{alert.message}</div>
                <div className="flex gap-3 mt-2 text-xs font-mono" style={{ color: "hsl(var(--muted-foreground))" }}>
                  <span>Metric: {alert.metric}</span>
                  <span>Value: {typeof alert.value === "number" && alert.value > 100 ? `₹${alert.value.toFixed(0)}` : alert.value.toFixed ? alert.value.toFixed(2) : alert.value}</span>
                </div>
              </div>
              <span className={cn("text-xs px-2 py-1 rounded-full font-medium shrink-0", alert.type === "critical" ? "alert-critical" : alert.type === "warning" ? "alert-warning" : "alert-healthy")}>
                {alert.type}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
