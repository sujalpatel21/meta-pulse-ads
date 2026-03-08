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
CREATE POLICY "Allow all access to budget_goals" ON public.budget_goals FOR ALL USING (true) WITH CHECK (true);