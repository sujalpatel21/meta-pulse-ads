import { useState, useEffect, createContext, useContext } from "react";
import { mockClients, AdAccount, Campaign } from "@/data/mockData";
import { fetchAdAccounts, fetchCampaigns, getDateRangeFromPreset, getUseLiveData } from "@/services/metaService";
import Sidebar from "./Sidebar";
import Header from "./Header";

interface DashboardContextValue {
  accounts: AdAccount[];
  selectedAccount: AdAccount;
  setSelectedAccount: (a: AdAccount) => void;
  campaigns: Campaign[];
  campaignsLoading: boolean;
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
  const [accounts, setAccounts] = useState<AdAccount[]>(mockClients[0].adAccounts);
  const [selectedAccount, setSelectedAccount] = useState<AdAccount>(mockClients[0].adAccounts[0]);
  const [campaigns, setCampaigns] = useState<Campaign[]>(mockClients[0].adAccounts[0].campaigns);
  const [campaignsLoading, setCampaignsLoading] = useState(false);
  const [dateRange, setDateRange] = useState("last7");
  const [compareMode, setCompareMode] = useState("none");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [liveMode, setLiveMode] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Load ad accounts on mount
  useEffect(() => {
    if (!getUseLiveData()) return;
    
    fetchAdAccounts()
      .then((accts) => {
        if (accts.length > 0) {
          // Check if we got real accounts (not mock fallback)
          const isReal = accts.some((a) => a.accountId.startsWith("act_") && !a.accountId.includes("abc"));
          setAccounts(accts);
          setSelectedAccount(accts[0]);
          setLiveMode(isReal);
          setApiError(null);
        }
      })
      .catch((e) => {
        console.warn("Could not load live accounts:", e);
        setApiError(e.message);
      });
  }, []);

  // Load campaigns when account or date range changes
  useEffect(() => {
    loadCampaigns();
  }, [selectedAccount.accountId, dateRange]);

  const loadCampaigns = async () => {
    setCampaignsLoading(true);
    setApiError(null);
    try {
      const dr = getDateRangeFromPreset(dateRange);
      const data = await fetchCampaigns(selectedAccount.accountId, dr);
      setCampaigns(data);
    } catch (e: any) {
      console.warn("Campaign load error:", e);
      setApiError(e.message);
      // fallback
      setCampaigns(selectedAccount.campaigns || []);
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
            {children}
          </main>
        </div>
      </div>
    </DashboardContext.Provider>
  );
}
