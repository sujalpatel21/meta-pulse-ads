

# MetaPulse: Senior Performance Executive Feature Recommendations

After reviewing the entire codebase, here's what's missing to make MetaPulse a true **decision-making weapon** for senior performance executives. These are prioritized by impact on daily workflow efficiency.

---

## 1. **Anomaly Detection & Auto-Alerts (Push Notifications)**
**Why:** Executives shouldn't need to open the dashboard to catch problems. The current alerts page is passive — you visit it, you see alerts. A senior exec needs alerts that come to *them*.

- Real-time anomaly detection: sudden CPL spikes, ROAS drops, budget overspend pace
- Slack/email webhook integration for critical alerts (e.g., "Campaign X CPL jumped 40% in 2 hours")
- Alert history log with timestamps so you can correlate spikes with external events

---

## 2. **Executive Summary / Daily Digest Page**
**Why:** A senior exec's first 60 seconds in the morning should answer: "What happened overnight? What needs my attention right now?"

- New `/daily-digest` page with:
  - Top 3 things that need attention (auto-ranked by severity)
  - Overnight spend summary vs. pacing
  - Campaigns that crossed alert thresholds
  - Quick-action buttons: Pause, Scale, Flag for review
- Auto-generated narrative summary using AI (already have the edge function infrastructure)

---

## 3. **Multi-Account Comparison View**
**Why:** Performance executives manage multiple accounts/clients. Currently you switch accounts one by one. No way to compare Client A vs Client B performance side-by-side.

- New `/accounts-overview` page showing all accounts in a single table/grid
- Key metrics per account: Spend, ROAS, CPL, Health Score
- Color-coded status indicators
- Click to drill into any account

---

## 4. **Action Log / Decision Tracker**
**Why:** When you scale a campaign or kill one, there's no record. Executives need an audit trail: "What did we change, when, and what was the result?"

- Database table to log actions (campaign paused, budget changed, etc.)
- Before/after metrics snapshot
- Annotation system on charts ("Scaled budget 20% here")
- Enables post-mortem analysis: "Did that budget increase actually help?"

---

## 5. **Quick Actions from Dashboard**
**Why:** Currently the dashboard is read-only. A senior exec sees a bleeding campaign and has to go to Meta Ads Manager to pause it. That's a workflow break.

- "Pause Campaign" button directly on campaign rows
- "Increase/Decrease Budget by X%" quick action
- Confirmation dialog with projected impact
- Uses Meta Marketing API write endpoints

---

## 6. **Funnel Visualization**
**Why:** The data exists (impressions → clicks → leads → purchases) but there's no visual funnel. A funnel chart instantly shows where the drop-off is.

- Visual funnel: Impressions → Clicks → Leads → Purchases
- Per-campaign and account-level funnels
- Conversion rate at each stage with benchmarks
- Highlights the biggest leakage point

---

## 7. **Competitor / Benchmark Context**
**Why:** "Is my 1.8% CTR good or bad?" Without benchmarks, numbers are meaningless.

- Industry benchmark overlays on key metrics (CTR, CPC, CPL by vertical)
- Store benchmarks in database, allow user customization
- Visual indicators: above/below benchmark

---

## Priority Ranking for Implementation

| # | Feature | Impact | Effort |
|---|---------|--------|--------|
| 1 | Executive Daily Digest | Very High | Medium |
| 2 | Funnel Visualization | High | Low |
| 3 | Multi-Account Comparison | High | Medium |
| 4 | Quick Actions (Pause/Scale) | Very High | High |
| 5 | Action Log / Decision Tracker | High | Medium |
| 6 | Push Alert Notifications | High | Medium |
| 7 | Benchmark Overlays | Medium | Low |

---

## Recommended Starting Point

**Build the Executive Daily Digest + Funnel Visualization first.** These two features give the most immediate productivity boost — the digest saves 10-15 minutes every morning, and the funnel chart turns raw numbers into instant visual clarity. Both are achievable with the existing data infrastructure.

