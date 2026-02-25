import { useState, useEffect, createContext, useContext } from "react";
import { AdAccount, Campaign } from "@/data/mockData";
import { fetchAdAccounts, fetchCampaigns, getDateRangeFromPreset } from "@/services/metaService";
import Sidebar from "./Sidebar";
import Header from "./Header";

interface DashboardContextValue {
  accounts: AdAccount[];
  selectedAccount: AdAccount | null;
  setSelectedAccount: (a: AdAccount) => void;
  campaigns: Campaign[];
  campaignsLoading: boolean;
  accountsLoading: boolean;
  dateRange: string;
  setDateRange: (r: string) => void;
  compareMode: string;
  setCompareMode: (m: string) => void;
  liveMode: boolean;
  refreshCampaigns: () => void;
  apiError: string | null;
}

export const DashboardContext = createContext<DashboardContextValue>({} as DashboardContextValue);

export function useDashboard() {
  return useContext(DashboardContext);
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const [accounts, setAccounts] = useState<AdAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<AdAccount | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campaignsLoading, setCampaignsLoading] = useState(true);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [dateRange, setDateRange] = useState("last30");
  const [compareMode, setCompareMode] = useState("none");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [liveMode, setLiveMode] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Load ad accounts on mount
  useEffect(() => {
    setAccountsLoading(true);
    fetchAdAccounts()
      .then((accts) => {
        if (accts.length > 0) {
          // Filter only active accounts (accountStatus 1)
          const activeAccounts = accts.filter((a: any) => !a.accountStatus || a.accountStatus === 1);
          const finalAccounts = activeAccounts.length > 0 ? activeAccounts : accts;
          setAccounts(finalAccounts);
          setSelectedAccount(finalAccounts[0]);
          setLiveMode(true);
          setApiError(null);
        }
      })
      .catch((e) => {
        console.warn("Could not load live accounts:", e);
        setApiError(e.message);
        setLiveMode(false);
      })
      .finally(() => setAccountsLoading(false));
  }, []);

  // Load campaigns when account or date range changes
  useEffect(() => {
    if (!selectedAccount) return;
    loadCampaigns();
  }, [selectedAccount?.accountId, dateRange]);

  const loadCampaigns = async () => {
    if (!selectedAccount) return;
    setCampaignsLoading(true);
    setApiError(null);
    try {
      const dr = getDateRangeFromPreset(dateRange);
      const data = await fetchCampaigns(selectedAccount.accountId, dr);
      setCampaigns(data);
    } catch (e: any) {
      console.warn("Campaign load error:", e);
      setApiError(e.message);
      setCampaigns([]);
    } finally {
      setCampaignsLoading(false);
    }
  };

  return (
    <DashboardContext.Provider
      value={{
        accounts,
        selectedAccount,
        setSelectedAccount,
        campaigns,
        campaignsLoading,
        accountsLoading,
        dateRange,
        setDateRange,
        compareMode,
        setCompareMode,
        liveMode,
        refreshCampaigns: loadCampaigns,
        apiError,
      }}
    >
      <div className="flex h-screen overflow-hidden" style={{ background: "hsl(var(--background))" }}>
        <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
        <div className="flex flex-col flex-1 overflow-hidden min-w-0">
          <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
          <main className="flex-1 overflow-y-auto p-6">
            {accountsLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center space-y-3">
                  <div className="w-8 h-8 border-2 rounded-full animate-spin mx-auto" style={{ borderColor: "hsl(var(--muted))", borderTopColor: "hsl(var(--brand))" }} />
                  <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>Loading ad accounts from Meta API...</p>
                </div>
              </div>
            ) : children}
          </main>
        </div>
      </div>
    </DashboardContext.Provider>
  );
}
