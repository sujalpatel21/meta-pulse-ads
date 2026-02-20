// ================================================================
// METAFLOW ANALYTICS — Mock Data
// Realistic Indian market data for Meta Ads dashboard
// Structure mirrors Meta Marketing API response format
// ================================================================

export interface DailyMetric {
  date: string;
  spend: number;
  impressions: number;
  clicks: number;
  leads: number;
  purchases: number;
  reach: number;
}

export interface Ad {
  adId: string;
  name: string;
  thumbnail: string;
  spend: number;
  impressions: number;
  clicks: number;
  leads: number;
  purchases: number;
  ctr: number;
  cpc: number;
  roas: number;
  engagementScore: number;
  fatigue: boolean;
  fatigueReason?: string;
  status: "Active" | "Paused";
  dailyMetrics: DailyMetric[];
}

export interface AdSet {
  adSetId: string;
  name: string;
  budget: number;
  spend: number;
  impressions: number;
  clicks: number;
  leads: number;
  purchases: number;
  ctr: number;
  cpc: number;
  frequency: number;
  audienceType: string;
  status: "Active" | "Paused";
  ads: Ad[];
  dailyMetrics: DailyMetric[];
}

export interface Campaign {
  campaignId: string;
  name: string;
  objective: string;
  budget: number;
  spend: number;
  impressions: number;
  clicks: number;
  leads: number;
  purchases: number;
  ctr: number;
  cpc: number;
  roas: number;
  status: "Active" | "Paused";
  adSets: AdSet[];
  dailyMetrics: DailyMetric[];
}

export interface AdAccount {
  accountId: string;
  accountName: string;
  currency: string;
  campaigns: Campaign[];
}

export interface Client {
  clientId: string;
  clientName: string;
  industry: string;
  logo: string;
  adAccounts: AdAccount[];
}

// ── Helper: generate daily metrics for last 14 days ──────────────
function generateDailyMetrics(
  baseSpend: number,
  baseLeads: number,
  variation = 0.3
): DailyMetric[] {
  const metrics: DailyMetric[] = [];
  const today = new Date();

  for (let i = 13; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const factor = 1 + (Math.random() - 0.5) * variation;
    const spend = Math.round(baseSpend * factor);
    const leads = Math.round(baseLeads * factor);
    const clicks = Math.round(leads * (8 + Math.random() * 4));
    const impressions = Math.round(clicks * (25 + Math.random() * 15));

    metrics.push({
      date: date.toISOString().split("T")[0],
      spend,
      impressions,
      clicks,
      leads,
      purchases: Math.round(leads * 0.12),
      reach: Math.round(impressions * 0.85),
    });
  }
  return metrics;
}

// ── ABC FITNESS ───────────────────────────────────────────────────
const abcFitnessAds_cmp1_adset1: Ad[] = [
  {
    adId: "ad_1_1_1",
    name: "Summer Offer Creative",
    thumbnail: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=120&h=90&fit=crop",
    spend: 8200, impressions: 52000, clicks: 1820, leads: 42, purchases: 5,
    ctr: 3.5, cpc: 4.5, roas: 2.1, engagementScore: 62,
    fatigue: true, fatigueReason: "CTR dropped 15% over last 7 days",
    status: "Active", dailyMetrics: generateDailyMetrics(585, 3),
  },
  {
    adId: "ad_1_1_2",
    name: "Gym Transformation Video",
    thumbnail: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=120&h=90&fit=crop",
    spend: 9500, impressions: 61000, clicks: 2310, leads: 58, purchases: 7,
    ctr: 3.79, cpc: 4.11, roas: 2.6, engagementScore: 81,
    fatigue: false, status: "Active", dailyMetrics: generateDailyMetrics(678, 4.1),
  },
  {
    adId: "ad_1_1_3",
    name: "Free Trial Offer Static",
    thumbnail: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=120&h=90&fit=crop",
    spend: 5100, impressions: 31000, clicks: 980, leads: 21, purchases: 3,
    ctr: 3.16, cpc: 5.2, roas: 1.9, engagementScore: 55,
    fatigue: false, status: "Paused", dailyMetrics: generateDailyMetrics(364, 1.5),
  },
];

const abcFitnessAds_cmp1_adset2: Ad[] = [
  {
    adId: "ad_1_2_1",
    name: "Membership Drive Carousel",
    thumbnail: "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=120&h=90&fit=crop",
    spend: 7300, impressions: 44000, clicks: 1540, leads: 35, purchases: 4,
    ctr: 3.5, cpc: 4.74, roas: 2.2, engagementScore: 70,
    fatigue: false, status: "Active", dailyMetrics: generateDailyMetrics(521, 2.5),
  },
  {
    adId: "ad_1_2_2",
    name: "Testimonial Video Ad",
    thumbnail: "https://images.unsplash.com/photo-1576678927484-cc907957088c?w=120&h=90&fit=crop",
    spend: 8900, impressions: 58000, clicks: 2100, leads: 52, purchases: 6,
    ctr: 3.62, cpc: 4.24, roas: 2.5, engagementScore: 78,
    fatigue: false, status: "Active", dailyMetrics: generateDailyMetrics(635, 3.7),
  },
  {
    adId: "ad_1_2_3",
    name: "New Year Resolution Banner",
    thumbnail: "https://images.unsplash.com/photo-1545389336-cf090694435e?w=120&h=90&fit=crop",
    spend: 4200, impressions: 24000, clicks: 720, leads: 15, purchases: 2,
    ctr: 3.0, cpc: 5.83, roas: 1.7, engagementScore: 45,
    fatigue: true, fatigueReason: "Impression frequency too high (>5)",
    status: "Paused", dailyMetrics: generateDailyMetrics(300, 1.1),
  },
];

const abcFitnessAds_cmp1_adset3: Ad[] = [
  {
    adId: "ad_1_3_1",
    name: "Protein Supplement Cross-sell",
    thumbnail: "https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=120&h=90&fit=crop",
    spend: 5800, impressions: 36000, clicks: 1260, leads: 28, purchases: 8,
    ctr: 3.5, cpc: 4.6, roas: 3.8, engagementScore: 74,
    fatigue: false, status: "Active", dailyMetrics: generateDailyMetrics(414, 2),
  },
  {
    adId: "ad_1_3_2",
    name: "Weekend Warrior Static",
    thumbnail: "https://images.unsplash.com/photo-1556817411-31ae72fa3ea0?w=120&h=90&fit=crop",
    spend: 3900, impressions: 22000, clicks: 770, leads: 18, purchases: 3,
    ctr: 3.5, cpc: 5.06, roas: 2.0, engagementScore: 58,
    fatigue: false, status: "Active", dailyMetrics: generateDailyMetrics(278, 1.3),
  },
  {
    adId: "ad_1_3_3",
    name: "Women Fitness Reel",
    thumbnail: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=120&h=90&fit=crop",
    spend: 7100, impressions: 49000, clicks: 1890, leads: 45, purchases: 6,
    ctr: 3.86, cpc: 3.76, roas: 2.8, engagementScore: 85,
    fatigue: false, status: "Active", dailyMetrics: generateDailyMetrics(507, 3.2),
  },
];

const abcFitnessAdSets_cmp1: AdSet[] = [
  {
    adSetId: "adset_1_1",
    name: "Mumbai – 25–40 Health Enthusiasts",
    budget: 20000, spend: 22800, impressions: 144000, clicks: 5110, leads: 121, purchases: 15,
    ctr: 3.55, cpc: 4.46, frequency: 3.2, audienceType: "Interest – Health & Fitness",
    status: "Active", ads: abcFitnessAds_cmp1_adset1, dailyMetrics: generateDailyMetrics(1628, 8.6),
  },
  {
    adSetId: "adset_1_2",
    name: "Lookalike – Previous Gym Members",
    budget: 18000, spend: 20400, impressions: 126000, clicks: 4360, leads: 102, purchases: 12,
    ctr: 3.46, cpc: 4.68, frequency: 2.9, audienceType: "Lookalike (1%) – Customers",
    status: "Active", ads: abcFitnessAds_cmp1_adset2, dailyMetrics: generateDailyMetrics(1457, 7.3),
  },
  {
    adSetId: "adset_1_3",
    name: "Retargeting – Website Visitors",
    budget: 12000, spend: 16800, impressions: 107000, clicks: 3920, leads: 91, purchases: 17,
    ctr: 3.66, cpc: 4.29, frequency: 5.1, audienceType: "Retargeting – 30d Website Visitors",
    status: "Active", ads: abcFitnessAds_cmp1_adset3, dailyMetrics: generateDailyMetrics(1200, 6.5),
  },
];

// Campaign 2 AdSets (simplified)
const abcFitnessAdSets_cmp2: AdSet[] = [
  {
    adSetId: "adset_2_1",
    name: "Delhi NCR – 18–35 Young Professionals",
    budget: 15000, spend: 14200, impressions: 88000, clicks: 2640, leads: 68, purchases: 11,
    ctr: 3.0, cpc: 5.38, frequency: 2.4, audienceType: "Interest – Yoga & Wellness",
    status: "Active",
    ads: [
      {
        adId: "ad_2_1_1", name: "Morning Yoga Static",
        thumbnail: "https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=120&h=90&fit=crop",
        spend: 5400, impressions: 33000, clicks: 990, leads: 26, purchases: 4,
        ctr: 3.0, cpc: 5.45, roas: 2.0, engagementScore: 65, fatigue: false,
        status: "Active", dailyMetrics: generateDailyMetrics(385, 1.9),
      },
      {
        adId: "ad_2_1_2", name: "Flexibility Challenge Video",
        thumbnail: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=120&h=90&fit=crop",
        spend: 4900, impressions: 30000, clicks: 900, leads: 23, purchases: 4,
        ctr: 3.0, cpc: 5.44, roas: 2.1, engagementScore: 60, fatigue: false,
        status: "Active", dailyMetrics: generateDailyMetrics(350, 1.6),
      },
      {
        adId: "ad_2_1_3", name: "Studio Tour Reel",
        thumbnail: "https://images.unsplash.com/photo-1575052814086-f385e2e2ad1b?w=120&h=90&fit=crop",
        spend: 3900, impressions: 25000, clicks: 750, leads: 19, purchases: 3,
        ctr: 3.0, cpc: 5.2, roas: 1.9, engagementScore: 55, fatigue: false,
        status: "Paused", dailyMetrics: generateDailyMetrics(278, 1.4),
      },
    ],
    dailyMetrics: generateDailyMetrics(1014, 4.9),
  },
  {
    adSetId: "adset_2_2",
    name: "Bangalore – IT Professionals 28–45",
    budget: 16000, spend: 15600, impressions: 96000, clicks: 2880, leads: 72, purchases: 10,
    ctr: 3.0, cpc: 5.42, frequency: 2.6, audienceType: "Behavioural – Fitness App Users",
    status: "Active",
    ads: [
      {
        adId: "ad_2_2_1", name: "Lunch Break Workout",
        thumbnail: "https://images.unsplash.com/photo-1590507621108-433608c97823?w=120&h=90&fit=crop",
        spend: 5800, impressions: 36000, clicks: 1080, leads: 27, purchases: 4,
        ctr: 3.0, cpc: 5.37, roas: 2.0, engagementScore: 68, fatigue: false,
        status: "Active", dailyMetrics: generateDailyMetrics(414, 1.9),
      },
      {
        adId: "ad_2_2_2", name: "Corporate Wellness Package",
        thumbnail: "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=120&h=90&fit=crop",
        spend: 5200, impressions: 32000, clicks: 960, leads: 24, purchases: 3,
        ctr: 3.0, cpc: 5.42, roas: 1.8, engagementScore: 63, fatigue: false,
        status: "Active", dailyMetrics: generateDailyMetrics(371, 1.7),
      },
      {
        adId: "ad_2_2_3", name: "Online PT Sessions",
        thumbnail: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=120&h=90&fit=crop",
        spend: 4600, impressions: 28000, clicks: 840, leads: 21, purchases: 3,
        ctr: 3.0, cpc: 5.48, roas: 1.9, engagementScore: 57, fatigue: false,
        status: "Active", dailyMetrics: generateDailyMetrics(328, 1.5),
      },
    ],
    dailyMetrics: generateDailyMetrics(1114, 5.1),
  },
  {
    adSetId: "adset_2_3",
    name: "Pune – Women 25–40 Active Lifestyle",
    budget: 10000, spend: 9400, impressions: 58000, clicks: 1740, leads: 44, purchases: 6,
    ctr: 3.0, cpc: 5.4, frequency: 2.1, audienceType: "Custom Audience – Email List",
    status: "Active",
    ads: [
      {
        adId: "ad_2_3_1", name: "Women Empowerment Creative",
        thumbnail: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=120&h=90&fit=crop",
        spend: 3500, impressions: 22000, clicks: 660, leads: 17, purchases: 3,
        ctr: 3.0, cpc: 5.3, roas: 2.2, engagementScore: 72, fatigue: false,
        status: "Active", dailyMetrics: generateDailyMetrics(250, 1.2),
      },
      {
        adId: "ad_2_3_2", name: "Zumba Class Promo",
        thumbnail: "https://images.unsplash.com/photo-1524594152303-9fd13543fe6e?w=120&h=90&fit=crop",
        spend: 3100, impressions: 19000, clicks: 570, leads: 14, purchases: 2,
        ctr: 3.0, cpc: 5.44, roas: 1.8, engagementScore: 60, fatigue: false,
        status: "Active", dailyMetrics: generateDailyMetrics(221, 1),
      },
      {
        adId: "ad_2_3_3", name: "Diet & Fitness Bundle",
        thumbnail: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=120&h=90&fit=crop",
        spend: 2800, impressions: 17000, clicks: 510, leads: 13, purchases: 1,
        ctr: 3.0, cpc: 5.49, roas: 1.6, engagementScore: 50, fatigue: false,
        status: "Paused", dailyMetrics: generateDailyMetrics(200, 0.9),
      },
    ],
    dailyMetrics: generateDailyMetrics(671, 3.1),
  },
];

export const mockClients: Client[] = [
  {
    clientId: "1",
    clientName: "ABC Fitness",
    industry: "Fitness & Wellness",
    logo: "🏋️",
    adAccounts: [
      {
        accountId: "act_abc_001",
        accountName: "ABC Fitness – Main Account",
        currency: "INR",
        campaigns: [
          {
            campaignId: "cmp_1",
            name: "Fitness Lead Generation",
            objective: "Lead Generation",
            budget: 50000,
            spend: 60000,
            impressions: 357000,
            clicks: 13190,
            leads: 314,
            purchases: 44,
            ctr: 3.69,
            cpc: 4.55,
            roas: 2.4,
            status: "Active",
            adSets: abcFitnessAdSets_cmp1,
            dailyMetrics: generateDailyMetrics(4285, 22.4),
          },
          {
            campaignId: "cmp_2",
            name: "Yoga & Wellness Program",
            objective: "Lead Generation",
            budget: 41000,
            spend: 39200,
            impressions: 242000,
            clicks: 7260,
            leads: 184,
            purchases: 27,
            ctr: 3.0,
            cpc: 5.4,
            roas: 2.0,
            status: "Active",
            adSets: abcFitnessAdSets_cmp2,
            dailyMetrics: generateDailyMetrics(2800, 13.1),
          },
          {
            campaignId: "cmp_3",
            name: "Protein Supplement Sales",
            objective: "Conversions",
            budget: 30000,
            spend: 27800,
            impressions: 168000,
            clicks: 5880,
            leads: 0,
            purchases: 89,
            ctr: 3.5,
            cpc: 4.73,
            roas: 3.8,
            status: "Active",
            adSets: [
              {
                adSetId: "adset_3_1", name: "Gym Goers – Supplement Interest",
                budget: 15000, spend: 14200, impressions: 86000, clicks: 3010, leads: 0, purchases: 46,
                ctr: 3.5, cpc: 4.72, frequency: 2.8, audienceType: "Interest – Sports Nutrition",
                status: "Active",
                ads: [
                  {
                    adId: "ad_3_1_1", name: "Whey Protein Offer",
                    thumbnail: "https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=120&h=90&fit=crop",
                    spend: 5200, impressions: 31000, clicks: 1085, leads: 0, purchases: 17,
                    ctr: 3.5, cpc: 4.79, roas: 4.0, engagementScore: 75, fatigue: false,
                    status: "Active", dailyMetrics: generateDailyMetrics(371, 1.2),
                  },
                  {
                    adId: "ad_3_1_2", name: "Mass Gainer Bundle",
                    thumbnail: "https://images.unsplash.com/photo-1512069772995-ec65ed45afd6?w=120&h=90&fit=crop",
                    spend: 4800, impressions: 29000, clicks: 1015, leads: 0, purchases: 16,
                    ctr: 3.5, cpc: 4.73, roas: 3.8, engagementScore: 70, fatigue: false,
                    status: "Active", dailyMetrics: generateDailyMetrics(342, 1.1),
                  },
                  {
                    adId: "ad_3_1_3", name: "Pre-workout Flash Sale",
                    thumbnail: "https://images.unsplash.com/photo-1546519638405-a9f9c5426abe?w=120&h=90&fit=crop",
                    spend: 4200, impressions: 26000, clicks: 910, leads: 0, purchases: 13,
                    ctr: 3.5, cpc: 4.62, roas: 3.5, engagementScore: 65, fatigue: false,
                    status: "Active", dailyMetrics: generateDailyMetrics(300, 0.9),
                  },
                ],
                dailyMetrics: generateDailyMetrics(1014, 3.3),
              },
              {
                adSetId: "adset_3_2", name: "Post-workout Recovery Audience",
                budget: 10000, spend: 8900, impressions: 55000, clicks: 1925, leads: 0, purchases: 28,
                ctr: 3.5, cpc: 4.62, frequency: 2.3, audienceType: "Behavioural – Active Athletes",
                status: "Active",
                ads: [
                  {
                    adId: "ad_3_2_1", name: "Recovery Shake Ad",
                    thumbnail: "https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=120&h=90&fit=crop",
                    spend: 3200, impressions: 20000, clicks: 700, leads: 0, purchases: 10,
                    ctr: 3.5, cpc: 4.57, roas: 3.8, engagementScore: 68, fatigue: false,
                    status: "Active", dailyMetrics: generateDailyMetrics(228, 0.7),
                  },
                  {
                    adId: "ad_3_2_2", name: "Sleep & Recovery Pack",
                    thumbnail: "https://images.unsplash.com/photo-1512069772995-ec65ed45afd6?w=120&h=90&fit=crop",
                    spend: 2900, impressions: 18000, clicks: 630, leads: 0, purchases: 9,
                    ctr: 3.5, cpc: 4.6, roas: 3.7, engagementScore: 64, fatigue: false,
                    status: "Active", dailyMetrics: generateDailyMetrics(207, 0.6),
                  },
                  {
                    adId: "ad_3_2_3", name: "BCAA Summer Promo",
                    thumbnail: "https://images.unsplash.com/photo-1546519638405-a9f9c5426abe?w=120&h=90&fit=crop",
                    spend: 2800, impressions: 17000, clicks: 595, leads: 0, purchases: 9,
                    ctr: 3.5, cpc: 4.71, roas: 3.9, engagementScore: 62, fatigue: false,
                    status: "Active", dailyMetrics: generateDailyMetrics(200, 0.6),
                  },
                ],
                dailyMetrics: generateDailyMetrics(635, 2),
              },
              {
                adSetId: "adset_3_3", name: "Retargeting – Cart Abandoners",
                budget: 8000, spend: 4700, impressions: 27000, clicks: 945, leads: 0, purchases: 15,
                ctr: 3.5, cpc: 4.97, frequency: 4.2, audienceType: "Retargeting – 7d Cart Abandoners",
                status: "Paused",
                ads: [
                  {
                    adId: "ad_3_3_1", name: "Complete Your Order",
                    thumbnail: "https://images.unsplash.com/photo-1590507621108-433608c97823?w=120&h=90&fit=crop",
                    spend: 1800, impressions: 10000, clicks: 350, leads: 0, purchases: 6,
                    ctr: 3.5, cpc: 5.14, roas: 4.5, engagementScore: 80, fatigue: false,
                    status: "Paused", dailyMetrics: generateDailyMetrics(128, 0.4),
                  },
                  {
                    adId: "ad_3_3_2", name: "10% Off – Last Chance",
                    thumbnail: "https://images.unsplash.com/photo-1512069772995-ec65ed45afd6?w=120&h=90&fit=crop",
                    spend: 1600, impressions: 9000, clicks: 315, leads: 0, purchases: 5,
                    ctr: 3.5, cpc: 5.08, roas: 4.3, engagementScore: 78, fatigue: false,
                    status: "Paused", dailyMetrics: generateDailyMetrics(114, 0.4),
                  },
                  {
                    adId: "ad_3_3_3", name: "Free Shaker Offer",
                    thumbnail: "https://images.unsplash.com/photo-1546519638405-a9f9c5426abe?w=120&h=90&fit=crop",
                    spend: 1300, impressions: 8000, clicks: 280, leads: 0, purchases: 4,
                    ctr: 3.5, cpc: 4.64, roas: 4.1, engagementScore: 76, fatigue: false,
                    status: "Paused", dailyMetrics: generateDailyMetrics(92, 0.3),
                  },
                ],
                dailyMetrics: generateDailyMetrics(335, 1.1),
              },
            ],
            dailyMetrics: generateDailyMetrics(1985, 6.4),
          },
          {
            campaignId: "cmp_4",
            name: "Brand Awareness Campaign",
            objective: "Reach",
            budget: 20000,
            spend: 18400,
            impressions: 520000,
            clicks: 3120,
            leads: 0,
            purchases: 0,
            ctr: 0.6,
            cpc: 5.9,
            roas: 0,
            status: "Paused",
            adSets: [],
            dailyMetrics: generateDailyMetrics(1314, 0),
          },
        ],
      },
      {
        accountId: "act_abc_002",
        accountName: "ABC Fitness – South India",
        currency: "INR",
        campaigns: [
          {
            campaignId: "cmp_5",
            name: "Chennai Lead Campaign",
            objective: "Lead Generation",
            budget: 25000,
            spend: 22100,
            impressions: 134000,
            clicks: 4690,
            leads: 118,
            purchases: 16,
            ctr: 3.5,
            cpc: 4.71,
            roas: 2.2,
            status: "Active",
            adSets: [],
            dailyMetrics: generateDailyMetrics(1578, 8.4),
          },
          {
            campaignId: "cmp_6",
            name: "Hyderabad Conversions",
            objective: "Conversions",
            budget: 18000,
            spend: 16700,
            impressions: 98000,
            clicks: 2940,
            leads: 0,
            purchases: 54,
            ctr: 3.0,
            cpc: 5.68,
            roas: 3.1,
            status: "Active",
            adSets: [],
            dailyMetrics: generateDailyMetrics(1192, 3.9),
          },
          {
            campaignId: "cmp_7",
            name: "Kochi Brand Reach",
            objective: "Reach",
            budget: 10000,
            spend: 9200,
            impressions: 280000,
            clicks: 1400,
            leads: 0,
            purchases: 0,
            ctr: 0.5,
            cpc: 6.57,
            roas: 0,
            status: "Paused",
            adSets: [],
            dailyMetrics: generateDailyMetrics(657, 0),
          },
          {
            campaignId: "cmp_8",
            name: "Bangalore Premium Members",
            objective: "Conversions",
            budget: 22000,
            spend: 20800,
            impressions: 122000,
            clicks: 4270,
            leads: 94,
            purchases: 31,
            ctr: 3.5,
            cpc: 4.87,
            roas: 2.8,
            status: "Active",
            adSets: [],
            dailyMetrics: generateDailyMetrics(1485, 6.7),
          },
        ],
      },
    ],
  },

  // ── CLIENT 2: SKYRISE REAL ESTATE ─────────────────────────────
  {
    clientId: "2",
    clientName: "Skyrise Real Estate",
    industry: "Real Estate",
    logo: "🏢",
    adAccounts: [
      {
        accountId: "act_sky_001",
        accountName: "Skyrise – Residential Projects",
        currency: "INR",
        campaigns: [
          {
            campaignId: "cmp_9",
            name: "Luxury Apartments Lead Gen",
            objective: "Lead Generation",
            budget: 120000,
            spend: 115400,
            impressions: 480000,
            clicks: 11520,
            leads: 218,
            purchases: 8,
            ctr: 2.4,
            cpc: 53.0,
            roas: 6.2,
            status: "Active",
            adSets: [],
            dailyMetrics: generateDailyMetrics(8242, 15.6),
          },
          {
            campaignId: "cmp_10",
            name: "Commercial Spaces Awareness",
            objective: "Lead Generation",
            budget: 80000,
            spend: 74200,
            impressions: 310000,
            clicks: 7440,
            leads: 142,
            purchases: 3,
            ctr: 2.4,
            cpc: 52.3,
            roas: 4.1,
            status: "Active",
            adSets: [],
            dailyMetrics: generateDailyMetrics(5300, 10.1),
          },
          {
            campaignId: "cmp_11",
            name: "Affordable Housing Scheme",
            objective: "Lead Generation",
            budget: 50000,
            spend: 48600,
            impressions: 290000,
            clicks: 8700,
            leads: 198,
            purchases: 12,
            ctr: 3.0,
            cpc: 24.5,
            roas: 5.8,
            status: "Active",
            adSets: [],
            dailyMetrics: generateDailyMetrics(3471, 14.1),
          },
          {
            campaignId: "cmp_12",
            name: "NRI Investment Campaign",
            objective: "Reach",
            budget: 40000,
            spend: 38100,
            impressions: 650000,
            clicks: 3900,
            leads: 45,
            purchases: 2,
            ctr: 0.6,
            cpc: 97.7,
            roas: 3.2,
            status: "Paused",
            adSets: [],
            dailyMetrics: generateDailyMetrics(2721, 3.2),
          },
        ],
      },
      {
        accountId: "act_sky_002",
        accountName: "Skyrise – Commercial Division",
        currency: "INR",
        campaigns: [
          {
            campaignId: "cmp_13",
            name: "Office Space – IT Parks",
            objective: "Lead Generation",
            budget: 60000,
            spend: 57800,
            impressions: 240000,
            clicks: 5760,
            leads: 96,
            purchases: 4,
            ctr: 2.4,
            cpc: 60.2,
            roas: 3.9,
            status: "Active",
            adSets: [],
            dailyMetrics: generateDailyMetrics(4128, 6.9),
          },
          {
            campaignId: "cmp_14",
            name: "Retail Outlet Leads",
            objective: "Lead Generation",
            budget: 35000,
            spend: 32400,
            impressions: 155000,
            clicks: 3720,
            leads: 74,
            purchases: 2,
            ctr: 2.4,
            cpc: 43.8,
            roas: 2.8,
            status: "Active",
            adSets: [],
            dailyMetrics: generateDailyMetrics(2314, 5.3),
          },
          {
            campaignId: "cmp_15",
            name: "Warehouse & Logistics Spaces",
            objective: "Lead Generation",
            budget: 25000,
            spend: 22100,
            impressions: 95000,
            clicks: 2280,
            leads: 38,
            purchases: 1,
            ctr: 2.4,
            cpc: 58.2,
            roas: 2.1,
            status: "Paused",
            adSets: [],
            dailyMetrics: generateDailyMetrics(1578, 2.7),
          },
          {
            campaignId: "cmp_16",
            name: "Smart City Project Awareness",
            objective: "Reach",
            budget: 45000,
            spend: 41200,
            impressions: 820000,
            clicks: 4100,
            leads: 52,
            purchases: 1,
            ctr: 0.5,
            cpc: 100.5,
            roas: 1.8,
            status: "Active",
            adSets: [],
            dailyMetrics: generateDailyMetrics(2942, 3.7),
          },
        ],
      },
    ],
  },

  // ── CLIENT 3: EDTECH PRO ──────────────────────────────────────
  {
    clientId: "3",
    clientName: "EduTech Pro",
    industry: "Education Technology",
    logo: "🎓",
    adAccounts: [
      {
        accountId: "act_edu_001",
        accountName: "EduTech Pro – Online Courses",
        currency: "INR",
        campaigns: [
          {
            campaignId: "cmp_17",
            name: "Full Stack Developer Course",
            objective: "Lead Generation",
            budget: 45000,
            spend: 43800,
            impressions: 210000,
            clicks: 8400,
            leads: 284,
            purchases: 56,
            ctr: 4.0,
            cpc: 5.21,
            roas: 4.2,
            status: "Active",
            adSets: [],
            dailyMetrics: generateDailyMetrics(3128, 20.3),
          },
          {
            campaignId: "cmp_18",
            name: "Data Science Bootcamp",
            objective: "Conversions",
            budget: 38000,
            spend: 36700,
            impressions: 178000,
            clicks: 7120,
            leads: 198,
            purchases: 42,
            ctr: 4.0,
            cpc: 5.15,
            roas: 3.8,
            status: "Active",
            adSets: [],
            dailyMetrics: generateDailyMetrics(2621, 14.1),
          },
          {
            campaignId: "cmp_19",
            name: "Digital Marketing Mastery",
            objective: "Lead Generation",
            budget: 28000,
            spend: 26400,
            impressions: 132000,
            clicks: 5280,
            leads: 148,
            purchases: 28,
            ctr: 4.0,
            cpc: 5.0,
            roas: 3.2,
            status: "Active",
            adSets: [],
            dailyMetrics: generateDailyMetrics(1885, 10.6),
          },
          {
            campaignId: "cmp_20",
            name: "CAT Exam Preparation",
            objective: "Lead Generation",
            budget: 20000,
            spend: 18900,
            impressions: 94000,
            clicks: 3760,
            leads: 104,
            purchases: 18,
            ctr: 4.0,
            cpc: 5.02,
            roas: 2.9,
            status: "Paused",
            adSets: [],
            dailyMetrics: generateDailyMetrics(1350, 7.4),
          },
        ],
      },
      {
        accountId: "act_edu_002",
        accountName: "EduTech Pro – School Segment",
        currency: "INR",
        campaigns: [
          {
            campaignId: "cmp_21",
            name: "CBSE Tuition Leads",
            objective: "Lead Generation",
            budget: 22000,
            spend: 20800,
            impressions: 104000,
            clicks: 4160,
            leads: 132,
            purchases: 24,
            ctr: 4.0,
            cpc: 4.99,
            roas: 3.4,
            status: "Active",
            adSets: [],
            dailyMetrics: generateDailyMetrics(1485, 9.4),
          },
          {
            campaignId: "cmp_22",
            name: "JEE / NEET Crash Course",
            objective: "Conversions",
            budget: 30000,
            spend: 28400,
            impressions: 142000,
            clicks: 5680,
            leads: 168,
            purchases: 38,
            ctr: 4.0,
            cpc: 5.0,
            roas: 4.5,
            status: "Active",
            adSets: [],
            dailyMetrics: generateDailyMetrics(2028, 12),
          },
          {
            campaignId: "cmp_23",
            name: "Olympiad Preparation",
            objective: "Lead Generation",
            budget: 15000,
            spend: 13200,
            impressions: 66000,
            clicks: 2640,
            leads: 72,
            purchases: 12,
            ctr: 4.0,
            cpc: 5.0,
            roas: 2.7,
            status: "Paused",
            adSets: [],
            dailyMetrics: generateDailyMetrics(942, 5.1),
          },
          {
            campaignId: "cmp_24",
            name: "School ERP Awareness",
            objective: "Reach",
            budget: 12000,
            spend: 11100,
            impressions: 220000,
            clicks: 1100,
            leads: 22,
            purchases: 3,
            ctr: 0.5,
            cpc: 50.9,
            roas: 1.9,
            status: "Active",
            adSets: [],
            dailyMetrics: generateDailyMetrics(792, 1.6),
          },
        ],
      },
    ],
  },
];

// ── Utility: Aggregate account-level metrics ──────────────────────
export function getAccountMetrics(campaigns: Campaign[]) {
  return campaigns.reduce(
    (acc, c) => ({
      spend: acc.spend + c.spend,
      impressions: acc.impressions + c.impressions,
      clicks: acc.clicks + c.clicks,
      leads: acc.leads + c.leads,
      purchases: acc.purchases + c.purchases,
    }),
    { spend: 0, impressions: 0, clicks: 0, leads: 0, purchases: 0 }
  );
}

export function computeKPIs(campaigns: Campaign[]) {
  const totals = getAccountMetrics(campaigns);
  const ctr = totals.clicks && totals.impressions ? (totals.clicks / totals.impressions) * 100 : 0;
  const cpc = totals.clicks ? totals.spend / totals.clicks : 0;
  const cpl = totals.leads ? totals.spend / totals.leads : 0;
  const roas = totals.purchases
    ? campaigns.reduce((s, c) => s + c.roas * c.spend, 0) / totals.spend
    : 0;

  return { ...totals, ctr, cpc, cpl, roas };
}

// ── Merge daily metrics across campaigns ─────────────────────────
export function aggregateDailyMetrics(campaigns: Campaign[]): DailyMetric[] {
  const map = new Map<string, DailyMetric>();

  campaigns.forEach((c) => {
    c.dailyMetrics.forEach((d) => {
      const existing = map.get(d.date) || {
        date: d.date,
        spend: 0, impressions: 0, clicks: 0, leads: 0, purchases: 0, reach: 0,
      };
      map.set(d.date, {
        date: d.date,
        spend: existing.spend + d.spend,
        impressions: existing.impressions + d.impressions,
        clicks: existing.clicks + d.clicks,
        leads: existing.leads + d.leads,
        purchases: existing.purchases + d.purchases,
        reach: existing.reach + d.reach,
      });
    });
  });

  return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
}
