import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, TrendingUp, Layers, MousePointer2,
  Bell, Target, FileText, Settings, ChevronLeft,
  Zap, BarChart3, Wifi, FlaskConical, Coffee,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useDashboard } from "./Layout";

const navItems = [
  { icon: LayoutDashboard, label: "Overview", path: "/" },
  { icon: Coffee, label: "Daily Digest", path: "/daily-digest" },
  { icon: TrendingUp, label: "Campaigns", path: "/campaigns" },
  { icon: Layers, label: "Ad Sets", path: "/adsets" },
  { icon: MousePointer2, label: "Ads", path: "/ads" },
  { icon: FlaskConical, label: "A/B Testing", path: "/ab-testing" },
  { icon: Target, label: "Budget & Goals", path: "/budget" },
  { icon: Bell, label: "Alerts", path: "/alerts" },
  { icon: FileText, label: "Reports", path: "/reports" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

interface SidebarProps {
  open: boolean;
  onToggle: () => void;
}

export default function Sidebar({ open, onToggle }: SidebarProps) {
  const location = useLocation();
  const { liveMode } = useDashboard();

  return (
    <aside
      className={cn(
        "flex flex-col h-full border-r transition-all duration-300 shrink-0 relative z-20",
        open ? "w-56" : "w-14"
      )}
      style={{
        background: "hsl(var(--sidebar-background))",
        borderColor: "hsl(var(--sidebar-border))",
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-3 px-4 py-4 border-b"
        style={{ borderColor: "hsl(var(--sidebar-border))" }}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: "var(--gradient-brand)" }}
        >
          <BarChart3 size={16} style={{ color: "hsl(var(--primary-foreground))" }} />
        </div>
        {open && (
          <div className="animate-fade-in min-w-0">
            <div className="text-sm font-bold gradient-text leading-none">MetaPulse</div>
            <div className="text-xs mt-0.5" style={{ color: "hsl(var(--sidebar-foreground))" }}>
              Analytics
            </div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const active = location.pathname === item.path ||
            (item.path !== "/" && location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn("nav-item", active && "active", !open && "justify-center px-0")}
              title={!open ? item.label : undefined}
            >
              <item.icon size={16} className="shrink-0" />
              {open && <span className="animate-fade-in truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {open && (
        <div className="px-3 pb-3">
          <div
            className="rounded-lg p-3 text-xs ai-insight-box"
          >
            <div className="flex items-center gap-1.5 mb-1">
              {liveMode ? (
                <>
                  <Wifi size={11} className="text-emerald-400" />
                  <span className="font-semibold text-emerald-400">Live Data</span>
                </>
              ) : (
                <>
                  <Zap size={11} style={{ color: "hsl(var(--brand))" }} />
                  <span className="font-semibold" style={{ color: "hsl(var(--brand))" }}>Demo Mode</span>
                </>
              )}
            </div>
            <p style={{ color: "hsl(var(--muted-foreground))" }}>
              {liveMode ? "Connected to Meta API" : "Using mock data — connect Meta API in Settings"}
            </p>
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-16 w-6 h-6 rounded-full flex items-center justify-center border transition-all hover:scale-110 z-30"
        style={{
          background: "hsl(var(--background-card))",
          borderColor: "hsl(var(--border))",
          color: "hsl(var(--muted-foreground))",
        }}
      >
        <ChevronLeft
          size={12}
          className={cn("transition-transform", !open && "rotate-180")}
        />
      </button>
    </aside>
  );
}
