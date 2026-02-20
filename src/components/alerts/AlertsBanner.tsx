import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle, XCircle, X } from "lucide-react";
import { Campaign } from "@/data/mockData";
import { generateAlerts, Alert } from "@/services/metaService";
import { cn } from "@/lib/utils";

export default function AlertsBanner({ campaigns }: { campaigns: Campaign[] }) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [dismissed, setDismissed] = useState<string[]>([]);

  useEffect(() => {
    generateAlerts(campaigns).then(setAlerts);
  }, [campaigns]);

  const visible = alerts.filter((a) => !dismissed.includes(a.id)).slice(0, 3);
  if (visible.length === 0) return null;

  return (
    <div className="space-y-2">
      {visible.map((alert) => (
        <div key={alert.id} className={cn("flex items-start gap-3 px-4 py-3 rounded-xl text-sm", alert.type === "critical" ? "alert-critical" : alert.type === "warning" ? "alert-warning" : "alert-healthy")}>
          <div className="shrink-0 mt-0.5">
            {alert.type === "critical" ? <XCircle size={15} /> : alert.type === "warning" ? <AlertTriangle size={15} /> : <CheckCircle size={15} />}
          </div>
          <div className="flex-1 min-w-0">
            <span className="font-semibold">{alert.title}: </span>
            <span className="opacity-90">{alert.message}</span>
          </div>
          <button onClick={() => setDismissed([...dismissed, alert.id])} className="shrink-0 opacity-60 hover:opacity-100 transition-opacity">
            <X size={13} />
          </button>
        </div>
      ))}
    </div>
  );
}
