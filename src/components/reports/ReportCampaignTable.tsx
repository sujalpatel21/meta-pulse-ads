import { CampaignPerformance, MetricKey, getCampaignMetricValue, formatMetricValue } from "@/lib/reportEngine";

interface Props {
  performance: CampaignPerformance[];
  selectedMetrics: MetricKey[];
}

const statusColors: Record<string, string> = {
  scaling: "hsl(var(--metric-positive))",
  underperforming: "hsl(var(--metric-warning))",
  waste: "hsl(var(--metric-negative))",
  stable: "hsl(var(--metric-neutral))",
};

export default function ReportCampaignTable({ performance, selectedMetrics }: Props) {
  return (
    <div className="chart-card p-5">
      <h2 className="text-sm font-semibold text-foreground mb-4">📋 Campaign Performance Table</h2>
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Campaign</th>
              <th>Status</th>
              {selectedMetrics.map(m => (
                <th key={m} className="text-right">{m.toUpperCase()}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {performance.map(p => (
              <tr key={p.campaign.campaignId}>
                <td>
                  <div className="font-medium text-xs">{p.campaign.name}</div>
                  <div className="text-[10px] text-muted-foreground">{p.campaign.objective}</div>
                </td>
                <td>
                  <span className="text-[10px] px-2 py-1 rounded-full font-mono whitespace-nowrap" style={{
                    background: `${statusColors[p.status]}15`,
                    color: statusColors[p.status],
                    border: `1px solid ${statusColors[p.status]}30`,
                  }}>
                    {p.statusLabel}
                  </span>
                </td>
                {selectedMetrics.map(m => {
                  const val = getCampaignMetricValue(p.campaign, m);
                  return (
                    <td key={m} className="text-right font-mono text-xs">
                      {formatMetricValue(m, typeof val === "number" ? val : parseFloat(val as string))}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
