import { aggregateTopics, countByDay, EVENT_DAYS, formatTime } from "@/lib/api";
import { pillColors } from "@/lib/theme";
import { EVENT_NAME } from "@/lib/site";
import type { Session } from "@/lib/types";

const DAY_NUM: Record<string, string> = {
  "2026-05-15": "DAY 1 · FRI",
  "2026-05-16": "DAY 2 · SAT",
  "2026-05-17": "DAY 3 · SUN",
};

/**
 * The shareable agenda card — editorial black, à la ai.engineer/singapore.
 * Every size is in `cqw` units so it renders identically whether shown small
 * on a page or captured to a 1200×630 PNG.
 */
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
  const highlights = pickHighlights(sessions, 3);

  return (
    <div
      className={`@container relative aspect-[1200/630] w-full overflow-hidden rounded-[1.4cqw] bg-black ${className}`}
      style={{ fontFamily: "var(--font-body-sans)" }}
    >
      {/* restrained aurora glow */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div
          className="absolute -left-[12%] -top-[28%] h-[70%] w-[55%] rounded-full blur-[60px]"
          style={{ background: "radial-gradient(closest-side, rgba(139,108,255,0.30), transparent)" }}
        />
        <div
          className="absolute -right-[10%] -top-[20%] h-[60%] w-[45%] rounded-full blur-[60px]"
          style={{ background: "radial-gradient(closest-side, rgba(255,138,92,0.18), transparent)" }}
        />
        <div
          className="absolute left-[20%] bottom-[-30%] h-[55%] w-[50%] rounded-full blur-[70px]"
          style={{ background: "radial-gradient(closest-side, rgba(79,212,196,0.12), transparent)" }}
        />
        <div className="grain-overlay absolute inset-0 mix-blend-soft-light opacity-40" />
        <div
          className="absolute inset-0"
          style={{ background: "radial-gradient(130% 120% at 50% 0%, transparent 40%, rgba(0,0,0,0.85) 100%)" }}
        />
      </div>

      {/* hairline frame */}
      <div className="absolute inset-[1.6cqw] rounded-[1.1cqw] border border-white/12" aria-hidden />

      <div className="relative flex h-full flex-col px-[4cqw] py-[3.4cqw]">
        {/* header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-[0.7cqw]">
            <Dot color="#ff5f57" />
            <Dot color="#febc2e" />
            <Dot color="#28c840" />
          </div>
          <div className="label text-[1.05cqw] text-white/45">
            {EVENT_NAME} · 2026
          </div>
        </div>

        {/* headline block */}
        <div className="mt-[3cqw]">
          <div className="label text-[1.05cqw] text-white/45">Personal agenda</div>
          <h1 className="serif mt-[0.8cqw] text-[7cqw] font-semibold leading-[0.98] text-white">
            <span className="truncate">{possessive}</span>{" "}
            <span className="serif-italic font-normal text-white/90">agenda</span>
          </h1>
          <div className="mt-[1.4cqw] label text-[1.15cqw] text-white/55">
            <span className="text-white/90">{total}</span> session{total === 1 ? "" : "s"}
            <span className="mx-[0.7cqw] text-white/25">/</span>
            <span className="text-white/90">{days}</span> day{days === 1 ? "" : "s"}
            <span className="mx-[0.7cqw] text-white/25">/</span> 15–17 May
          </div>
        </div>

        {/* topic pills */}
        {topics.length > 0 && (
          <div className="mt-[1.8cqw] flex flex-wrap gap-[0.7cqw]">
            {topics.map((t) => {
              const c = pillColors(t.topic);
              return (
                <span
                  key={t.topic}
                  className="rounded-full px-[1cqw] py-[0.4cqw] font-mono text-[1.1cqw] lowercase tracking-tight"
                  style={{ backgroundColor: c.bg, border: `1px solid ${c.border}`, color: c.fg }}
                >
                  {t.topic}
                </span>
              );
            })}
          </div>
        )}

        <div className="flex-1" />

        {/* bottom: day counts + highlights */}
        <div className="grid grid-cols-[1.05fr_1fr] gap-[3cqw] border-t border-white/12 pt-[1.8cqw]">
          <div className="grid grid-cols-3 gap-[1.2cqw]">
            {EVENT_DAYS.map((d) => (
              <div key={d} className="flex flex-col">
                <div className="label text-[0.85cqw] text-white/35">{DAY_NUM[d]}</div>
                <div className="serif mt-[0.3cqw] text-[3.2cqw] font-semibold leading-none text-white">
                  {byDay[d] ?? 0}
                </div>
                <div className="mt-[0.7cqw] flex gap-[0.25cqw]">
                  {(byDay[d] ?? 0) === 0 ? (
                    <span className="h-[0.32cqw] w-full rounded-full bg-white/10" />
                  ) : (
                    Array.from({ length: Math.min(byDay[d] ?? 0, 7) }).map((_, i) => (
                      <span key={i} className="h-[0.32cqw] flex-1 min-w-[0.5cqw] rounded-full bg-white/75" />
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="min-w-0">
            <div className="label text-[0.85cqw] text-white/35">On your list</div>
            <ul className="mt-[0.7cqw] space-y-[0.55cqw]">
              {highlights.length === 0 ? (
                <li className="text-[1.15cqw] text-white/40">— nothing picked yet —</li>
              ) : (
                highlights.map((s) => (
                  <li key={s.id} className="flex items-baseline gap-[0.7cqw]">
                    <span className="font-mono text-[0.95cqw] text-white/35">{formatTime(s.startsAt)}</span>
                    <span className="serif truncate text-[1.35cqw] leading-tight text-white/85">
                      {s.title === "TBA" ? "To be announced" : s.title}
                    </span>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>

        {/* footer */}
        <div className="mt-[1.6cqw] flex items-center justify-between font-mono text-[0.95cqw] text-white/35">
          <span>plan yours · aie-agenda</span>
          <span className="text-white/55">{footer}</span>
        </div>
      </div>
    </div>
  );
}

function Dot({ color }: { color: string }) {
  return <span className="h-[0.9cqw] w-[0.9cqw] rounded-full" style={{ background: color, opacity: 0.85 }} />;
}

function pickHighlights(sessions: Session[], n: number): Session[] {
  const score = (s: Session) => {
    const t = (s.topics ?? []).join(" ").toLowerCase();
    if (t.includes("keynote")) return 4;
    if (s.format === "talk" && t.includes("main stage")) return 3;
    if (s.format === "workshop") return 2;
    if (s.format === "leadership") return 1;
    return 0;
  };
  return sessions
    .slice()
    .sort((a, b) => score(b) - score(a) || a.startsAt.localeCompare(b.startsAt))
    .slice(0, n)
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}
