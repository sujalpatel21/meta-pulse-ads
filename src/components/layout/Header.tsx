import { Menu, ChevronDown, Calendar, RefreshCw, Wifi, WifiOff, Search } from "lucide-react";
import { useDashboard } from "./Layout";
import { useState, useMemo, useRef, useEffect } from "react";
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
  const { accounts, selectedAccount, setSelectedAccount,
    dateRange, setDateRange, compareMode, setCompareMode,
    liveMode, refreshCampaigns, campaignsLoading } = useDashboard();

  const [accountOpen, setAccountOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  const [accountSearch, setAccountSearch] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  const dateLabel = dateRangeOptions.find((d) => d.value === dateRange)?.label || "Last 7 Days";
  const compareLabel = compareModeOptions.find((c) => c.value === compareMode)?.label || "No Comparison";

  // Focus search input when account dropdown opens
  useEffect(() => {
    if (accountOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
    if (!accountOpen) setAccountSearch("");
  }, [accountOpen]);

  const filteredAccounts = useMemo(() => {
    if (!accountSearch.trim()) return accounts;
    const q = accountSearch.toLowerCase();
    return accounts.filter(
      (a) =>
        a.accountName.toLowerCase().includes(q) ||
        a.accountId.toLowerCase().includes(q)
    );
  }, [accounts, accountSearch]);

  if (!selectedAccount) return null;

  return (
    <header
      className="flex items-center gap-3 px-5 py-3 border-b shrink-0 relative z-10"
      style={{
        background: "hsl(var(--background-elevated))",
        borderColor: "hsl(var(--border))",
      }}
    >
      <button
        onClick={onToggleSidebar}
        className="p-1.5 rounded-md transition-colors hover:bg-muted"
        style={{ color: "hsl(var(--muted-foreground))" }}
      >
        <Menu size={18} />
      </button>

      <div className="flex items-center gap-2 flex-1 flex-wrap">
        {/* Live/Mock indicator */}
        <div className={cn(
          "flex items-center gap-1.5 text-xs px-2 py-1 rounded-full font-medium",
          liveMode ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
        )}>
          {liveMode ? <Wifi size={10} /> : <WifiOff size={10} />}
          {liveMode ? "Live" : "Mock"}
        </div>

        {/* Account selector with search */}
        <Dropdown
          open={accountOpen}
          onToggle={() => { setAccountOpen(!accountOpen); setDateOpen(false); setCompareOpen(false); }}
          label={
            <span className="text-sm font-medium truncate max-w-[200px]" style={{ color: "hsl(var(--foreground))" }}>
              {selectedAccount.accountName}
            </span>
          }
          badge="Ad Account"
          wide
        >
          <div className="p-2 border-b" style={{ borderColor: "hsl(var(--border))" }}>
            <div className="flex items-center gap-2 px-2 py-1.5 rounded-md" style={{ background: "hsl(var(--muted))" }}>
              <Search size={12} style={{ color: "hsl(var(--muted-foreground))" }} />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search accounts..."
                value={accountSearch}
                onChange={(e) => setAccountSearch(e.target.value)}
                className="bg-transparent border-none outline-none text-xs flex-1"
                style={{ color: "hsl(var(--foreground))" }}
              />
            </div>
          </div>
          <div className="max-h-[300px] overflow-y-auto p-1">
            {filteredAccounts.length === 0 ? (
              <div className="text-xs text-center py-4" style={{ color: "hsl(var(--muted-foreground))" }}>
                No accounts found
              </div>
            ) : (
              filteredAccounts.map((account) => (
                <button
                  key={account.accountId}
                  onClick={() => { setSelectedAccount(account); setAccountOpen(false); }}
                  className={cn(
                    "w-full text-left px-3 py-2 text-sm rounded-md transition-colors hover:bg-muted",
                    selectedAccount.accountId === account.accountId && "bg-muted"
                  )}
                  style={{ color: "hsl(var(--foreground))" }}
                >
                  <div className="font-medium text-xs truncate">{account.accountName}</div>
                  <div className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                    {account.accountId} · {account.currency}
                  </div>
                </button>
              ))
            )}
          </div>
          <div className="p-2 border-t text-xs text-center" style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--muted-foreground))" }}>
            {accounts.length} accounts total
          </div>
        </Dropdown>
      </div>

      <div className="flex items-center gap-2">
        {/* Refresh */}
        <button
          onClick={refreshCampaigns}
          disabled={campaignsLoading}
          className="p-1.5 rounded-md transition-colors hover:bg-muted disabled:opacity-50"
          style={{ color: "hsl(var(--muted-foreground))" }}
          title="Refresh data"
        >
          <RefreshCw size={14} className={cn(campaignsLoading && "animate-spin")} />
        </button>

        {/* Compare mode */}
        <Dropdown
          open={compareOpen}
          onToggle={() => { setCompareOpen(!compareOpen); setAccountOpen(false); setDateOpen(false); }}
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
          onToggle={() => { setDateOpen(!dateOpen); setAccountOpen(false); setCompareOpen(false); }}
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
  wide?: boolean;
}

function Dropdown({ open, onToggle, label, badge, children, align = "left", wide }: DropdownProps) {
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
            "absolute top-full mt-1 rounded-xl border z-50 shadow-xl animate-fade-in",
            align === "right" ? "right-0" : "left-0",
            wide ? "min-w-[300px]" : "min-w-[200px] p-1"
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
