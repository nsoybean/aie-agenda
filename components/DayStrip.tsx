import { EVENT_DAYS } from "@/lib/api";

const SHORT: Record<string, string> = {
  "2026-05-15": "FRI",
  "2026-05-16": "SAT",
  "2026-05-17": "SUN",
};

/** A sparkline-ish strip: FRI/SAT/SUN with a row of blocks (one per picked session) + the count. */
export default function DayStrip({
  countByDay,
  className = "",
  compact = false,
}: {
  countByDay: Record<string, number>;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div className={`flex items-stretch gap-3 ${className}`}>
      {EVENT_DAYS.map((d) => {
        const n = countByDay[d] ?? 0;
        return (
          <div key={d} className="flex min-w-0 flex-1 flex-col gap-1.5">
            <div className="flex items-baseline justify-between font-mono text-[11px] tracking-widest text-white/55">
              <span>{SHORT[d]}</span>
              <span className="text-white/85">{n}</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {n === 0 ? (
                <span className="h-1.5 w-full rounded-full bg-white/8" />
              ) : (
                Array.from({ length: Math.min(n, compact ? 10 : 14) }).map((_, i) => (
                  <span
                    key={i}
                    className="h-1.5 flex-1 min-w-[6px] rounded-full"
                    style={{ background: "rgba(255,255,255,0.85)" }}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
