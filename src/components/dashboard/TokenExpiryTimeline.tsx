import { KeyRound, ShieldAlert, ShieldCheck } from "lucide-react";

// Date the current Meta access token was issued (60-day long-lived token)
const TOKEN_ISSUED_AT = new Date("2026-08-10T00:00:00Z");
const TOKEN_VALID_DAYS = 60;

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export default function TokenExpiryTimeline() {
  const today = startOfDay(new Date());
  const issued = startOfDay(TOKEN_ISSUED_AT);
  const expiry = new Date(issued.getTime() + TOKEN_VALID_DAYS * DAY_MS);

  const elapsed = Math.max(0, Math.round((today.getTime() - issued.getTime()) / DAY_MS));
  const daysLeft = Math.max(0, TOKEN_VALID_DAYS - elapsed);
  const pct = Math.min(100, (elapsed / TOKEN_VALID_DAYS) * 100);

  const state = daysLeft <= 7 ? "critical" : daysLeft <= 20 ? "warn" : "ok";
  const color =
    state === "critical"
      ? "hsl(var(--metric-negative))"
      : state === "warn"
      ? "hsl(38 92% 55%)"
      : "hsl(var(--metric-positive))";

  const fmt = (d: Date) =>
    d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });

  return (
    <div className="chart-card p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <KeyRound size={14} style={{ color }} />
          Meta Access Token
        </h3>
        <span
          className="text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1"
          style={{ background: `${color.replace(")", " / 0.12)")}`, color }}
        >
          {state === "ok" ? <ShieldCheck size={10} /> : <ShieldAlert size={10} />}
          {daysLeft > 0 ? "Active" : "Expired"}
        </span>
      </div>

      <div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold tabular-nums" style={{ color }}>
            {daysLeft}
          </span>
          <span className="text-xs text-muted-foreground">days left of {TOKEN_VALID_DAYS}</span>
        </div>
        <p className="text-[11px] mt-1 text-muted-foreground">
          Expires on {fmt(expiry)} · issued {fmt(issued)}
        </p>
      </div>

      {/* Progress */}
      <div className="h-1.5 rounded-full overflow-hidden bg-muted">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>

      {/* 60-day daily timeline */}
      <div className="grid grid-cols-[repeat(30,minmax(0,1fr))] gap-[2px]">
        {Array.from({ length: TOKEN_VALID_DAYS }).map((_, i) => {
          const dayDate = new Date(issued.getTime() + i * DAY_MS);
          const isPast = i < elapsed;
          const isToday = i === elapsed;
          const remaining = TOKEN_VALID_DAYS - i;
          return (
            <div
              key={i}
              title={`${fmt(dayDate)} · ${remaining} day${remaining === 1 ? "" : "s"} left`}
              className="h-4 rounded-[2px]"
              style={{
                background: isToday ? color : isPast ? "hsl(var(--muted))" : `${color.replace(")", " / 0.3)")}`,
                outline: isToday ? `1px solid ${color}` : "none",
              }}
            />
          );
        })}
      </div>

      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <span>Day 1</span>
        <span>Today · day {Math.min(elapsed + 1, TOKEN_VALID_DAYS)}</span>
        <span>Day {TOKEN_VALID_DAYS}</span>
      </div>
    </div>
  );
}
