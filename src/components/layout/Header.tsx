import { Menu, ChevronDown, Calendar, RefreshCw } from "lucide-react";
import { useDashboard } from "./Layout";
import { mockClients } from "@/data/mockData";
import { useState } from "react";
import { cn } from "@/lib/utils";

const dateRangeOptions = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "last7", label: "Last 7 Days" },
  { value: "last14", label: "Last 14 Days" },
  { value: "last30", label: "Last 30 Days" },
  { value: "thisMonth", label: "This Month" },
  { value: "lastMonth", label: "Last Month" },
];

const compareModeOptions = [
  { value: "none", label: "No Comparison" },
  { value: "yesterday", label: "vs Yesterday" },
  { value: "prev7", label: "vs Prev 7 Days" },
  { value: "prevMonth", label: "vs Prev Month" },
];

interface HeaderProps {
  onToggleSidebar: () => void;
}

export default function Header({ onToggleSidebar }: HeaderProps) {
  const { selectedClient, setSelectedClient, selectedAccount, setSelectedAccount,
    dateRange, setDateRange, compareMode, setCompareMode } = useDashboard();

  const [clientOpen, setClientOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);

  const dateLabel = dateRangeOptions.find((d) => d.value === dateRange)?.label || "Last 7 Days";
  const compareLabel = compareModeOptions.find((c) => c.value === compareMode)?.label || "No Comparison";

  return (
    <header
      className="flex items-center gap-3 px-5 py-3 border-b shrink-0 relative z-10"
      style={{
        background: "hsl(var(--background-elevated))",
        borderColor: "hsl(var(--border))",
      }}
    >
      {/* Sidebar toggle */}
      <button
        onClick={onToggleSidebar}
        className="p-1.5 rounded-md transition-colors hover:bg-muted"
        style={{ color: "hsl(var(--muted-foreground))" }}
      >
        <Menu size={18} />
      </button>

      <div className="flex items-center gap-2 flex-1 flex-wrap">
        {/* Client selector */}
        <Dropdown
          open={clientOpen}
          onToggle={() => { setClientOpen(!clientOpen); setAccountOpen(false); setDateOpen(false); setCompareOpen(false); }}
          label={
            <span className="flex items-center gap-2">
              <span className="text-base">{selectedClient.logo}</span>
              <span className="font-semibold text-sm" style={{ color: "hsl(var(--foreground))" }}>
                {selectedClient.clientName}
              </span>
            </span>
          }
          badge="Client"
        >
          {mockClients.map((client) => (
            <button
              key={client.clientId}
              onClick={() => { setSelectedClient(client); setClientOpen(false); }}
              className={cn(
                "w-full text-left px-3 py-2 text-sm rounded-md transition-colors hover:bg-muted flex items-center gap-2",
                selectedClient.clientId === client.clientId && "bg-muted"
              )}
            >
              <span>{client.logo}</span>
              <div>
                <div className="font-medium" style={{ color: "hsl(var(--foreground))" }}>{client.clientName}</div>
                <div className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>{client.industry}</div>
              </div>
            </button>
          ))}
        </Dropdown>

        <span style={{ color: "hsl(var(--border))" }}>/</span>

        {/* Account selector */}
        <Dropdown
          open={accountOpen}
          onToggle={() => { setAccountOpen(!accountOpen); setClientOpen(false); setDateOpen(false); setCompareOpen(false); }}
          label={
            <span className="text-sm font-medium" style={{ color: "hsl(var(--foreground))" }}>
              {selectedAccount.accountName}
            </span>
          }
          badge="Ad Account"
        >
          {selectedClient.adAccounts.map((account) => (
            <button
              key={account.accountId}
              onClick={() => { setSelectedAccount(account); setAccountOpen(false); }}
              className={cn(
                "w-full text-left px-3 py-2 text-sm rounded-md transition-colors hover:bg-muted",
                selectedAccount.accountId === account.accountId && "bg-muted"
              )}
              style={{ color: "hsl(var(--foreground))" }}
            >
              <div className="font-medium">{account.accountName}</div>
              <div className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                {account.accountId} · {account.campaigns.length} campaigns
              </div>
            </button>
          ))}
        </Dropdown>
      </div>

      <div className="flex items-center gap-2">
        {/* Compare mode */}
        <Dropdown
          open={compareOpen}
          onToggle={() => { setCompareOpen(!compareOpen); setClientOpen(false); setAccountOpen(false); setDateOpen(false); }}
          label={
            <span className="text-xs font-medium flex items-center gap-1.5" style={{ color: "hsl(var(--muted-foreground))" }}>
              <RefreshCw size={12} />
              {compareLabel}
            </span>
          }
          align="right"
        >
          {compareModeOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { setCompareMode(opt.value); setCompareOpen(false); }}
              className={cn(
                "w-full text-left px-3 py-2 text-sm rounded-md transition-colors hover:bg-muted",
                compareMode === opt.value && "bg-muted"
              )}
              style={{ color: "hsl(var(--foreground))" }}
            >
              {opt.label}
            </button>
          ))}
        </Dropdown>

        {/* Date range */}
        <Dropdown
          open={dateOpen}
          onToggle={() => { setDateOpen(!dateOpen); setClientOpen(false); setAccountOpen(false); setCompareOpen(false); }}
          label={
            <span className="text-xs font-medium flex items-center gap-1.5" style={{ color: "hsl(var(--foreground))" }}>
              <Calendar size={12} />
              {dateLabel}
            </span>
          }
          align="right"
        >
          {dateRangeOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { setDateRange(opt.value); setDateOpen(false); }}
              className={cn(
                "w-full text-left px-3 py-2 text-sm rounded-md transition-colors hover:bg-muted",
                dateRange === opt.value && "bg-muted"
              )}
              style={{ color: "hsl(var(--foreground))" }}
            >
              {opt.label}
            </button>
          ))}
        </Dropdown>
      </div>
    </header>
  );
}

interface DropdownProps {
  open: boolean;
  onToggle: () => void;
  label: React.ReactNode;
  badge?: string;
  children: React.ReactNode;
  align?: "left" | "right";
}

function Dropdown({ open, onToggle, label, badge, children, align = "left" }: DropdownProps) {
  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all hover:border-muted-foreground/30"
        style={{
          background: "hsl(var(--background-card))",
          borderColor: "hsl(var(--border))",
        }}
      >
        {badge && (
          <span className="text-xs px-1.5 py-0.5 rounded font-medium" style={{ background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }}>
            {badge}
          </span>
        )}
        {label}
        <ChevronDown
          size={12}
          className={cn("transition-transform shrink-0", open && "rotate-180")}
          style={{ color: "hsl(var(--muted-foreground))" }}
        />
      </button>

      {open && (
        <div
          className={cn(
            "absolute top-full mt-1 min-w-[200px] rounded-xl border p-1 z-50 shadow-xl animate-fade-in",
            align === "right" ? "right-0" : "left-0"
          )}
          style={{
            background: "hsl(var(--popover))",
            borderColor: "hsl(var(--border))",
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}
