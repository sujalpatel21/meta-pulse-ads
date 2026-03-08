

## Winner Creative Section for A/B Testing Page

### What We're Building
A new "Winner Creatives" section at the top of the A/B Testing page that highlights the winning ads from completed A/B tests for the selected ad account. This gives a quick visual summary of which creatives performed best.

### Plan

**1. Create `WinnerCreatives` component** (`src/components/ab-testing/WinnerCreatives.tsx`)
- Filter tests to only show `Completed` tests that have a `winnerId`
- For each winner, display a card with:
  - Ad thumbnail, ad name, variant label (with trophy icon)
  - Campaign name it belongs to
  - Key winning metrics: CTR, CPC, ROAS, Leads, Confidence %
  - The metric it won on (e.g., "Won on CTR")
  - A comparison summary vs the losing variant (e.g., "+32% better CTR")
- Styled as a horizontal scrollable row or grid, using the existing dark theme with gold/green accents for winners
- Empty state if no completed tests with winners exist

**2. Update `ABTesting.tsx` page**
- Import and render `WinnerCreatives` between the KPI strip and the test list
- Pass the `tests` array and `loading` state as props

### Technical Details
- Reuses existing `ABTest` and `ABTestVariant` types from `mockData.ts`
- Reuses `formatINR` from `metaService.ts` for currency formatting
- No backend changes needed — winners are already determined by the `get_ab_tests` edge function logic
- Component uses the same `chart-card` styling pattern as the rest of the dashboard

