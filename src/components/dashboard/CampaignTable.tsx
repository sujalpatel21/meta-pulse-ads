import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronUp, ChevronDown, ArrowUpRight } from "lucide-react";
import { Campaign } from "@/data/mockData";
import { cn } from "@/lib/utils";

interface CampaignTableProps {
  campaigns: Campaign[];
}

type SortKey = "name" | "spend" | "leads" | "ctr" | "cpc" | "roas";

export default function CampaignTable({ campaigns }: CampaignTableProps) {
  const navigate = useNavigate();
  const [sortKey, setSortKey] = useState<SortKey>("spend");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const sorted = [...campaigns].sort((a, b) => {
    let va: number | string = a[sortKey] as number | string;
    let vb: number | string = b[sortKey] as number | string;
    if (typeof va === "string") va = va.toLowerCase();
    if (typeof vb === "string") vb = vb.toLowerCase();
    if (va < vb) return sortDir === "asc" ? -1 : 1;
    if (va > vb) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sortKey !== k) return null;
    return sortDir === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />;
  };

  const Col = ({ k, label, className }: { k: SortKey; label: string; className?: string }) => (
    <th className={cn("cursor-pointer select-none", className)} onClick={() => handleSort(k)}>
      <span className="flex items-center gap-1">
        {label}
        <SortIcon k={k} />
      </span>
    </th>
  );

  return (
    <div className="overflow-x-auto">
      <table className="data-table">
        <thead>
          <tr>
            <Col k="name" label="Campaign" />
            <th>Objective</th>
            <Col k="spend" label="Spend" />
            <Col k="leads" label="Leads" />
            <Col k="ctr" label="CTR" />
            <Col k="cpc" label="CPC" />
            <Col k="roas" label="ROAS" />
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((c) => (
            <tr key={c.campaignId} className="cursor-pointer group">
              <td>
                <div className="font-medium max-w-[200px] truncate" style={{ color: "hsl(var(--foreground))" }}>
                  {c.name}
                </div>
              </td>
              <td>
                <span
                  className="text-xs px-2 py-1 rounded-full font-medium"
                  style={{ background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }}
                >
                  {c.objective}
                </span>
              </td>
              <td>
                <span className="font-mono font-semibold" style={{ color: "hsl(var(--foreground))" }}>
                  ₹{c.spend.toLocaleString("en-IN")}
                </span>
              </td>
              <td>
                <span className="font-mono" style={{ color: c.leads > 100 ? "hsl(var(--metric-positive))" : "hsl(var(--foreground))" }}>
                  {c.leads.toLocaleString("en-IN")}
                </span>
              </td>
              <td>
                <span
                  className="font-mono"
                  style={{
                    color: c.ctr > 3
                      ? "hsl(var(--metric-positive))"
                      : c.ctr < 1
                      ? "hsl(var(--metric-negative))"
                      : "hsl(var(--foreground))",
                  }}
                >
                  {c.ctr.toFixed(2)}%
                </span>
              </td>
              <td>
                <span className="font-mono" style={{ color: "hsl(var(--foreground))" }}>
                  ₹{c.cpc.toFixed(2)}
                </span>
              </td>
              <td>
                <span
                  className="font-mono font-semibold"
                  style={{
                    color: c.roas >= 3
                      ? "hsl(var(--metric-positive))"
                      : c.roas >= 2
                      ? "hsl(var(--foreground))"
                      : c.roas > 0
                      ? "hsl(var(--metric-warning))"
                      : "hsl(var(--muted-foreground))",
                  }}
                >
                  {c.roas > 0 ? `${c.roas.toFixed(1)}x` : "—"}
                </span>
              </td>
              <td>
                <span className={cn("text-xs px-2 py-1 rounded-full font-medium", c.status === "Active" ? "status-active" : "status-paused")}>
                  {c.status}
                </span>
              </td>
              <td>
                <button
                  onClick={() => navigate(`/campaigns?id=${c.campaignId}`)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-muted"
                  style={{ color: "hsl(var(--brand))" }}
                >
                  <ArrowUpRight size={14} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {campaigns.length === 0 && (
        <div className="text-center py-12" style={{ color: "hsl(var(--muted-foreground))" }}>
          No campaigns found for this account.
        </div>
      )}
    </div>
  );
}
