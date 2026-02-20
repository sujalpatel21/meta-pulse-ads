import { useState, createContext, useContext } from "react";
import { mockClients, Client, AdAccount } from "@/data/mockData";
import Sidebar from "./Sidebar";
import Header from "./Header";

interface DashboardContextValue {
  selectedClient: Client;
  setSelectedClient: (c: Client) => void;
  selectedAccount: AdAccount;
  setSelectedAccount: (a: AdAccount) => void;
  dateRange: string;
  setDateRange: (r: string) => void;
  compareMode: string;
  setCompareMode: (m: string) => void;
}

export const DashboardContext = createContext<DashboardContextValue>({} as DashboardContextValue);

export function useDashboard() {
  return useContext(DashboardContext);
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const [selectedClient, setSelectedClient] = useState<Client>(mockClients[0]);
  const [selectedAccount, setSelectedAccount] = useState<AdAccount>(mockClients[0].adAccounts[0]);
  const [dateRange, setDateRange] = useState("last7");
  const [compareMode, setCompareMode] = useState("none");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleClientChange = (client: Client) => {
    setSelectedClient(client);
    setSelectedAccount(client.adAccounts[0]);
  };

  return (
    <DashboardContext.Provider
      value={{
        selectedClient,
        setSelectedClient: handleClientChange,
        selectedAccount,
        setSelectedAccount,
        dateRange,
        setDateRange,
        compareMode,
        setCompareMode,
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
