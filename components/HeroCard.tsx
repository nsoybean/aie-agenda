import { aggregateTopics, countByDay, EVENT_DAYS, formatTime } from "@/lib/api";
import { pillColors } from "@/lib/theme";
import { EVENT_NAME } from "@/lib/site";
import type { Session } from "@/lib/types";

const DAY_LABEL: Record<string, { label: string; date: string }> = {
  "2026-05-15": { label: "DAY 1 · FRI", date: "15 May" },
  "2026-05-16": { label: "DAY 2 · SAT", date: "16 May" },
  "2026-05-17": { label: "DAY 3 · SUN", date: "17 May" },
};

export default function HeroCard({
  name,
  sessions,
  footer = "ai.engineer/singapore",
  className = "",
}: {
  name: string;
  sessions: Session[];
  footer?: string;
  className?: string;
}) {
  const raw = name.trim() || "My";
  const possessive = /s$/i.test(raw) ? `${raw}'` : `${raw}'s`;
  const topics = aggregateTopics(sessions).slice(0, 5);
  const byDay = countByDay(sessions);
  const total = sessions.length;
  const days = EVENT_DAYS.filter((d) => (byDay[d] ?? 0) > 0).length || EVENT_DAYS.length;

  // sessions sorted by time, grouped per day
  const byDaySessions = Object.fromEntries(
    EVENT_DAYS.map((d) => [
      d,
      sessions.filter((s) => s.day === d).sort((a, b) => a.startsAt.localeCompare(b.startsAt)),
    ]),
  );

  return (
    <div
      className={`@container relative aspect-[1200/630] w-full overflow-hidden rounded-[1.4cqw] bg-black ${className}`}
      style={{ fontFamily: "var(--font-body-sans)" }}
    >
      {/* aurora glow */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div
          className="absolute -left-[12%] -top-[28%] h-[70%] w-[55%] rounded-full blur-[60px]"
          style={{ background: "radial-gradient(closest-side, rgba(139,108,255,0.38), transparent)" }}
        />
        <div
          className="absolute -right-[10%] -top-[20%] h-[60%] w-[45%] rounded-full blur-[60px]"
          style={{ background: "radial-gradient(closest-side, rgba(255,138,92,0.22), transparent)" }}
        />
        <div
          className="absolute left-[20%] bottom-[-30%] h-[55%] w-[50%] rounded-full blur-[70px]"
          style={{ background: "radial-gradient(closest-side, rgba(79,212,196,0.15), transparent)" }}
        />
        <div className="grain-overlay absolute inset-0 mix-blend-soft-light opacity-40" />
        <div
          className="absolute inset-0"
          style={{ background: "radial-gradient(130% 120% at 50% 0%, transparent 40%, rgba(0,0,0,0.75) 100%)" }}
        />
      </div>

      {/* hairline frame */}
      <div className="absolute inset-[1.6cqw] rounded-[1.1cqw] border border-white/22" aria-hidden />

      <div className="relative flex h-full flex-col px-[4cqw] py-[3.2cqw]">
        {/* header row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-[0.7cqw]">
            <Dot color="#ff5f57" />
            <Dot color="#febc2e" />
            <Dot color="#28c840" />
          </div>
          <div className="label text-[1.05cqw] text-white/65">{EVENT_NAME} · 2026</div>
        </div>

        {/* headline — slightly more compact to free space */}
        <div className="mt-[2.2cqw]">
          <div className="label text-[1.05cqw] text-white/60">Personal agenda</div>
          <h1 className="serif mt-[0.6cqw] text-[5.8cqw] font-semibold leading-[0.98] text-white">
            <span>{possessive}</span>{" "}
            <span className="serif-italic font-normal text-white/90">agenda</span>
          </h1>
          <div className="mt-[1.1cqw] label text-[1.1cqw] text-white/70">
            <span className="text-white">{total}</span> session{total === 1 ? "" : "s"}
            <span className="mx-[0.6cqw] text-white/30">/</span>
            <span className="text-white">{days}</span> day{days === 1 ? "" : "s"}
            <span className="mx-[0.6cqw] text-white/30">/</span> 15–17 May
          </div>
        </div>

        {/* topic pills */}
        {topics.length > 0 && (
          <div className="mt-[1.5cqw] flex flex-wrap gap-[0.6cqw]">
            {topics.map((t) => {
              const c = pillColors(t.topic);
              return (
                <span
                  key={t.topic}
                  className="rounded-full px-[0.9cqw] py-[0.35cqw] font-mono text-[1.0cqw] lowercase tracking-tight"
                  style={{ backgroundColor: c.bg, border: `1px solid ${c.border}`, color: c.fg }}
                >
                  {t.topic}
                </span>
              );
            })}
          </div>
        )}

        <div className="flex-1" />

        {/* 3-column day breakdown */}
        <div className="grid grid-cols-3 gap-[2cqw] border-t border-white/20 pt-[1.6cqw]">
          {EVENT_DAYS.map((d) => {
            const daySessions = byDaySessions[d] ?? [];
            const n = byDay[d] ?? 0;
            const shown = daySessions.slice(0, 3);
            const extra = n - 3;
            return (
              <div key={d} className="flex min-w-0 flex-col">
                <div className="flex items-baseline justify-between gap-1">
                  <div className="label text-[0.85cqw] text-white/55">{DAY_LABEL[d].label}</div>
                  <div className="serif text-[2.2cqw] font-semibold leading-none text-white">{n}</div>
                </div>
                <div className="mt-[0.6cqw] h-px bg-white/15" />
                <ul className="mt-[0.7cqw] space-y-[0.55cqw]">
                  {shown.length === 0 ? (
                    <li className="label text-[0.85cqw] text-white/25">nothing yet</li>
                  ) : (
                    shown.map((s) => (
                      <li key={s.id} className="flex items-baseline gap-[0.5cqw]">
                        <span className="shrink-0 font-mono text-[0.82cqw] text-white/45">
                          {formatTime(s.startsAt)}
                        </span>
                        <span className="serif truncate text-[1.05cqw] leading-tight text-white/85">
                          {s.title === "TBA" ? "To be announced" : s.title}
                        </span>
                      </li>
                    ))
                  )}
                  {extra > 0 && (
                    <li className="label text-[0.82cqw] text-white/35">+{extra} more</li>
                  )}
                </ul>
              </div>
            );
          })}
        </div>

        {/* footer */}
        <div className="mt-[1.4cqw] flex items-center justify-between font-mono text-[0.9cqw] text-white/50">
          <span>plan yours · aie-agenda</span>
          <span className="text-white/70">{footer}</span>
        </div>
      </div>
    </div>
  );
}

function Dot({ color }: { color: string }) {
  return <span className="h-[0.9cqw] w-[0.9cqw] rounded-full" style={{ background: color, opacity: 0.9 }} />;
}
