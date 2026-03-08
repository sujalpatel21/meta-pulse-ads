

## Campaign-Level Budget Goals with Per-Account Persistence

### What We're Building

Enhance the Budget & Goals page so users can set **per-campaign targets** (CPL, ROAS, monthly budget) for the selected ad account. Goals are saved to the database per account+campaign. The Goal Achievement section shows a card **per campaign** with specific messages when targets are missed.

### Database

**New table: `budget_goals`**

```sql
CREATE TABLE public.budget_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id text NOT NULL,
  campaign_id text,
  campaign_name text,
  target_cpl numeric DEFAULT 300,
  target_roas numeric DEFAULT 3,
  monthly_budget numeric DEFAULT 200000,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(account_id, campaign_id)
);
ALTER TABLE public.budget_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON public.budget_goals FOR ALL USING (true) WITH CHECK (true);
```

### UI Changes — `src/pages/Budget.tsx`

**1. Campaign Selector**
- Add a dropdown at the top showing "All Campaigns" + list of campaigns from `useDashboard().campaigns`
- When a campaign is selected, goals load/save for that specific `account_id + campaign_id`
- "All Campaigns" sets goals at account level (`campaign_id = NULL`)

**2. Set Goals Section**
- Same sliders but values load from `budget_goals` table on mount and on campaign/account change
- On slider change, debounce upsert to `budget_goals`

**3. Budget Tracker**
- When a specific campaign is selected, show that campaign's spend vs its budget target
- When "All Campaigns", show aggregate like today

**4. Goal Achievement Section (key enhancement)**
- Iterate through ALL campaigns in the account
- For each campaign that has saved goals, show a card with:
  - Campaign name
  - Actual CPL vs target CPL, actual ROAS vs target ROAS, spend vs budget
  - Specific alert message: e.g. "CPL ₹450 — ₹150 above your ₹300 target"
  - Green/red color coding
- Campaigns without saved goals show a subtle "No goals set" state

### Files Changed

| File | Change |
|------|--------|
| DB Migration | Create `budget_goals` table |
| `src/pages/Budget.tsx` | Add campaign selector, DB-backed goals, per-campaign goal achievement cards |

