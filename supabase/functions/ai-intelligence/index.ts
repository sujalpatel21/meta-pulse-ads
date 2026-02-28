import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are a Performance Intelligence Engine for Meta Ads campaigns. You are a fractional CMO and performance strategist — NOT a chatbot.

CRITICAL RULES:
- Never guess data. Only analyze what is provided.
- Never give generic advice like "improve targeting" or "optimize creatives".
- Every insight MUST reference specific metrics with numbers.
- Tone: Professional, direct, data-driven, high-level strategic thinking.
- Never return motivational fluff.

You will receive structured campaign performance data as JSON. Analyze it deeply and return a JSON object with this EXACT structure:

{
  "scaling_score": <number 0-100>,
  "scaling_score_reasoning": "<1-2 sentence justification>",
  "strengths": ["<bullet with specific metrics>", ...],
  "weaknesses": ["<bullet with specific metrics>", ...],
  "bottlenecks": ["<bullet identifying where funnel breaks and why>", ...],
  "risks": ["<bullet with specific risk signal and threshold>", ...],
  "recommendations": ["<specific action step with expected impact>", ...]
}

ANALYSIS FRAMEWORK:

1. STRENGTHS: What is working? Cite specific campaigns/metrics that outperform.

2. WEAKNESSES: Where are performance leaks? Use numeric justification (e.g., "Campaign X has CPC of ₹12.4 vs account avg of ₹5.2 — 138% above benchmark").

3. BOTTLENECKS: Identify funnel breaks:
   - Traffic quality issues (high impressions, low CTR)
   - Creative fatigue (CTR declining, frequency rising)
   - Offer mismatch (clicks but no conversions)
   - Audience saturation (frequency > 3.5 with declining CTR)

4. RISK SIGNALS: Flag these patterns:
   - Rising CPM trend
   - Declining CTR trend
   - Increasing CPL/CPA
   - Frequency > 3
   - ROAS below 1.5
   - Volatile daily performance (high std deviation)
   - Budget overspend vs allocation

5. RECOMMENDATIONS: Action-based steps:
   - Creative rotation strategy
   - Audience restructuring
   - Budget reallocation (specify from which campaign to which)
   - Signal optimization
   - Scaling strategy (horizontal vs vertical)

6. SCALING READINESS SCORE (0-100):
   - Stability (consistent daily performance): 25 points
   - Signal quality (strong conversion signals): 25 points
   - Conversion depth (purchases, not just leads): 25 points
   - Revenue consistency (stable ROAS): 25 points

REASONING PATTERNS:
- If CTR ↓ and CPM ↑ → Creative fatigue likely
- If CPL stable but ROAS ↓ → Offer or sales funnel issue
- If Frequency > 3.5 and CTR ↓ → Audience saturation
- If spend > budget → Overpacing risk
- If ROAS < 1 → Negative ROI, pause or restructure

Return ONLY valid JSON. No markdown, no code fences, no extra text.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { campaignData, accountName, dateRange } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build the user prompt with structured data
    const userPrompt = `Analyze the following Meta Ads performance data for account "${accountName}" over ${dateRange}:

CAMPAIGN DATA:
${JSON.stringify(campaignData, null, 2)}

ACCOUNT SUMMARY:
- Total Campaigns: ${campaignData.length}
- Active Campaigns: ${campaignData.filter((c: any) => c.status === "Active" || c.status === "ACTIVE").length}
- Total Spend: ₹${campaignData.reduce((s: number, c: any) => s + (c.spend || 0), 0).toLocaleString("en-IN")}
- Total Impressions: ${campaignData.reduce((s: number, c: any) => s + (c.impressions || 0), 0).toLocaleString("en-IN")}
- Total Clicks: ${campaignData.reduce((s: number, c: any) => s + (c.clicks || 0), 0).toLocaleString("en-IN")}
- Total Leads: ${campaignData.reduce((s: number, c: any) => s + (c.leads || 0), 0).toLocaleString("en-IN")}
- Total Purchases: ${campaignData.reduce((s: number, c: any) => s + (c.purchases || 0), 0).toLocaleString("en-IN")}
- Avg CTR: ${(campaignData.reduce((s: number, c: any) => s + (c.ctr || 0), 0) / Math.max(campaignData.length, 1)).toFixed(2)}%
- Avg CPC: ₹${(campaignData.reduce((s: number, c: any) => s + (c.cpc || 0), 0) / Math.max(campaignData.length, 1)).toFixed(2)}
- Avg ROAS: ${(campaignData.reduce((s: number, c: any) => s + (c.roas || 0), 0) / Math.max(campaignData.length, 1)).toFixed(2)}x

Provide your structured analysis as a JSON object.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits in Settings → Workspace → Usage." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: `AI analysis failed (${response.status})` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("Empty AI response");
    }

    // Parse the JSON from AI response (handle potential markdown fences)
    let parsed;
    try {
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse AI response:", content);
      return new Response(JSON.stringify({ error: "AI returned invalid format. Please try again." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate structure
    const result = {
      scaling_score: typeof parsed.scaling_score === "number" ? parsed.scaling_score : 50,
      scaling_score_reasoning: parsed.scaling_score_reasoning || "",
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
      weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
      bottlenecks: Array.isArray(parsed.bottlenecks) ? parsed.bottlenecks : [],
      risks: Array.isArray(parsed.risks) ? parsed.risks : [],
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("AI intelligence error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
