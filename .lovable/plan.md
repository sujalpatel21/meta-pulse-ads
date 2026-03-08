
# Meta Marketing API Integration -- Complete Step-by-Step Plan

## What You Need to Provide (Before We Start Building)

### 1. Meta Business Account Setup (You Do This on Facebook)

Go to **[Meta Business Suite](https://business.facebook.com)** and make sure you have:

- A **Meta Business Manager** account
- At least one **Ad Account** linked to it

### 2. Create a Meta App (You Do This on Facebook)

1. Go to **[developers.facebook.com/apps](https://developers.facebook.com/apps)**
2. Click **"Create App"**
3. Select **"Business"** as the app type
4. Give it a name (e.g., "MetaFlow Dashboard")
5. Link it to your Business Manager
6. Under **"Add Products"**, add **"Marketing API"**

### 3. Generate a Long-Lived Access Token

1. In your Meta App, go to **Tools > Graph API Explorer**
2. Select your app from the dropdown
3. Click **"Generate Access Token"**
4. Grant these permissions:
   - `ads_read` -- read campaign, ad set, and ad data
   - `ads_management` -- (optional, only if you want to pause/enable campaigns later)
   - `read_insights` -- read performance metrics (spend, impressions, clicks, etc.)
   - `business_management` -- access business-level ad accounts
5. Copy the short-lived token
6. Exchange it for a **long-lived token** (lasts ~60 days) using this URL:
   ```
   https://graph.facebook.com/v19.0/oauth/access_token?
     grant_type=fb_exchange_token&
     client_id=YOUR_APP_ID&
     client_secret=YOUR_APP_SECRET&
     fb_exchange_token=YOUR_SHORT_LIVED_TOKEN
   ```
7. Save the resulting token -- **this is what you'll give to Lovable**

### 4. Get Your Ad Account ID(s)

- In Meta Business Suite, go to **Settings > Ad Accounts**
- Your Ad Account ID looks like: `act_123456789`
- You'll need this to fetch campaigns

---

## What I Will Build (After You Provide the Token)

### Step 1: Enable Lovable Cloud
- Set up Lovable Cloud backend (database, edge functions, secrets management)

### Step 2: Store Your Meta Access Token Securely
- Save your token as a Supabase secret called `META_ACCESS_TOKEN`
- It will never be exposed in frontend code

### Step 3: Create Edge Function -- `meta-ads`
A single serverless function that proxies all Meta API calls:

```
Endpoint: /meta-ads
```

It will handle these operations:
- **`get_ad_accounts`** -- Fetch all ad accounts from your Business Manager
- **`get_campaigns`** -- Fetch campaigns for a specific ad account with insights
- **`get_adsets`** -- Fetch ad sets for a campaign with performance data
- **`get_ads`** -- Fetch individual ads with metrics and creative thumbnails
- **`get_insights`** -- Fetch daily breakdowns for charts

Meta Graph API endpoints used:
- `GET /v19.0/me/adaccounts` -- list ad accounts
- `GET /v19.0/act_{id}/campaigns` -- list campaigns with insights
- `GET /v19.0/{campaign_id}/adsets` -- list ad sets with insights
- `GET /v19.0/{adset_id}/ads` -- list ads with insights and creative

Fields requested from Meta:
- Campaigns: `name, objective, status, daily_budget, lifetime_budget, insights{spend,impressions,clicks,reach,actions,cost_per_action_type,purchase_roas,ctr,cpc}`
- Ad Sets: `name, status, daily_budget, targeting, insights{spend,impressions,clicks,reach,frequency,actions,ctr,cpc}`
- Ads: `name, status, creative{thumbnail_url}, insights{spend,impressions,clicks,actions,purchase_roas,ctr,cpc}`

### Step 4: Update `metaService.ts`
Replace every mock function with real calls to the edge function:
- `fetchClients()` becomes `fetchAdAccounts()` calling the edge function
- `fetchCampaigns()` calls edge function with account ID and date range
- `fetchAdSets()` calls edge function with campaign ID
- `fetchAds()` calls edge function with ad set ID
- Data is transformed from Meta's API format into the existing TypeScript interfaces (`Campaign`, `AdSet`, `Ad`, etc.)

### Step 5: Update Layout Context
- Replace hardcoded `mockClients` with data fetched from the edge function
- Ad accounts are loaded on app startup
- Client/account selector works with real accounts

### Step 6: Update All Pages
- Overview, Campaigns, AdSets, Ads, Alerts, Budget pages will all use the updated service layer
- No visual changes needed -- the data interfaces stay the same
- Loading states and error handling added for API failures

---

## What Will Work After Integration

| Dashboard Feature | Data Source |
|---|---|
| KPI Cards (Spend, Impressions, Clicks, Leads, ROAS) | Meta Insights API |
| Spend vs Leads chart (14-day trend) | Meta daily breakdown |
| Campaign performance table | Meta Campaigns API |
| Ad Set drill-down | Meta Ad Sets API |
| Individual ad performance | Meta Ads API |
| Ad creative thumbnails | Meta Creative API |
| Alerts (high CPL, low ROAS, overspend) | Calculated from live data |
| AI Insights | Calculated from live data |

---

## Important Notes

- **Token expiry**: Long-lived tokens last ~60 days. You'll need to regenerate periodically (or implement a System User token for permanent access).
- **Rate limits**: Meta API has rate limits. The edge function will include basic error handling for this.
- **No Pixel needed**: We only use the Marketing/Insights API -- no Facebook Pixel required.
- **All data stays server-side**: The access token is stored as a secret and only used inside the edge function.

---

## Technical Details

### Data Transformation Layer
The edge function will transform Meta's API response format into the existing TypeScript interfaces so that all current UI components (charts, tables, KPI cards) work without modification.

Example transformation:
```
Meta API Response:
  { "actions": [{"action_type": "lead", "value": "42"}] }

Transformed to:
  { leads: 42 }
```

### Error Handling
- Token expired: Show a message in Settings to re-authenticate
- Rate limited: Retry with exponential backoff
- Network errors: Show toast notification with retry option

### File Changes Summary
- **New**: `supabase/functions/meta-ads/index.ts` (edge function)
- **Modified**: `src/services/metaService.ts` (real API calls)
- **Modified**: `src/components/layout/Layout.tsx` (dynamic account loading)
- **Modified**: `src/pages/Settings.tsx` (add token status indicator)
- **Config**: `supabase/config.toml` (edge function config)
