

## Overview Dashboard Visualization Redesign

Replace the current 4 chart sections (Spend vs Leads trend, ROAS gauge, Spend distribution pie, Campaign bar chart) with more insightful, signal-driven visualizations that match the Bloomberg Terminal aesthetic.

---

### New Visualization Layout

**Row 1 (3 columns):**

1. **Conversion Funnel Flow** — Horizontal funnel showing Impressions → Clicks → Leads → Purchases with animated drop-off percentages and glow effects. Shows where money leaks at a glance.

2. **Campaign Health Heatmap** — Grid with campaigns as rows and metrics (CTR, CPC, ROAS, CPL) as columns. Cells color-coded green/amber/red based on performance thresholds. Instant visual scan of what's healthy and what's not.

3. **Budget Utilization Radials** — Stack of mini radial gauges per campaign showing budget consumed vs allocated. Over-budget campaigns glow red, under-budget glow amber.

**Row 2 (2 columns):**

4. **Top vs Bottom Performers** — Side-by-side card comparing the best and worst campaign by ROAS/CPL. Shows key metrics with delta arrows and sparklines. "Your best campaign outperforms worst by 3.2x on ROAS."

5. **Efficiency Radar Chart** — Multi-axis radar chart comparing top 4 campaigns across CTR, CPC, ROAS, Lead Rate, and Spend Efficiency. Shows which campaign is balanced vs lopsided.

**Row 3 (full width):**

6. **Campaign Performance Table** — Keep existing table (already good).

---

### Technical Approach

- Create new component: `src/components/dashboard/InsightCharts.tsx` with all 5 new chart components
- Modify `src/pages/Overview.tsx` to replace the current chart sections with new components
- Use recharts (RadarChart, RadialBarChart, custom SVG) + custom CSS for heatmap
- Reuse existing `CustomTooltip` glass-morphism style and color palette from `Charts.tsx`
- Keep `PerformanceSummary` cards row (the Cost/Lead, CPC, CTR, Active row)
- Remove imports of `SpendLeadsChart`, `CampaignBarChart`, `SpendPieChart`, `ROASGauge` from Overview

### Data Sources
All derived from existing `Campaign[]` data — no new API calls or DB changes needed.

