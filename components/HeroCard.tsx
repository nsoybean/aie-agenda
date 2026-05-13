import QRCode from "react-qr-code";
import { aggregateTopics, countByDay, EVENT_DAYS, formatTime } from "@/lib/api";
import { hueFor } from "@/lib/theme";
import { EVENT_NAME } from "@/lib/site";
import { getTheme, pillColorsForTheme } from "@/lib/themes";
import type { ThemeId } from "@/lib/themes";
import type { Session } from "@/lib/types";

const DAY_META: Record<string, { label: string }> = {
  "2026-05-15": { label: "DAY 1 · FRI" },
  "2026-05-16": { label: "DAY 2 · SAT" },
  "2026-05-17": { label: "DAY 3 · SUN" },
};

export default function HeroCard({
  name,
  sessions,
  footer = "ai.engineer/singapore",
  themeId,
  xHandle,
  linkedin,
  cardUrl,
  className = "",
}: {
  name: string;
  sessions: Session[];
  footer?: string;
  themeId?: ThemeId;
  xHandle?: string;
  linkedin?: string;
  cardUrl?: string;
  className?: string;
}) {
  const theme = getTheme(themeId);
  const raw = name.trim() || "My";
  const possessive = /s$/i.test(raw) ? `${raw}'` : `${raw}'s`;
  const topics = aggregateTopics(sessions).slice(0, 5);
  const byDay = countByDay(sessions);
  const total = sessions.length;
  const days = EVENT_DAYS.filter((d) => (byDay[d] ?? 0) > 0).length || EVENT_DAYS.length;

  const byDaySessions = Object.fromEntries(
    EVENT_DAYS.map((d) => [
      d,
      sessions.filter((s) => s.day === d).sort((a, b) => a.startsAt.localeCompare(b.startsAt)),
    ]),
  );

  const tx = theme.textAt;

  return (
    <div
      className={`@container relative aspect-[1200/630] w-full overflow-hidden rounded-[1.4cqw] ${className}`}
      style={{ background: theme.bg, fontFamily: "var(--font-body-sans)", color: theme.text }}
    >
      {/* aurora glows */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        {theme.glows.map((g, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              top: g.top,
              bottom: g.bottom,
              left: g.left,
              right: g.right,
              width: g.w,
              height: g.h,
              filter: "blur(60px)",
              background: `radial-gradient(closest-side, ${g.color}, transparent)`,
            }}
          />
        ))}
        {theme.vignette && (
          <div className="absolute inset-0" style={{ background: theme.vignette }} />
        )}
        {/* Vercel: subtle dot-grid texture */}
        {theme.id === "vercel" && (
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)",
              backgroundSize: "28px 28px",
            }}
          />
        )}
        <div className="grain-overlay absolute inset-0 mix-blend-soft-light opacity-30" />
      </div>

      {/* hairline frame */}
      <div
        className="absolute inset-[1.6cqw] rounded-[1.1cqw]"
        style={{ border: `1px solid ${theme.frameBorder}` }}
        aria-hidden
      />

      <div className="relative flex h-full flex-col px-[4cqw] py-[3.2cqw]">
        {/* header row */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-[0.7cqw] pt-[0.2cqw]">
            <Dot color="#ff5f57" /><Dot color="#febc2e" /><Dot color="#28c840" />
          </div>
          <div className="flex flex-col items-end gap-[0.6cqw]">
            <div className="label text-[1.05cqw]" style={{ color: tx(0.60) }}>
              {EVENT_NAME} · 2026
            </div>
            {cardUrl && (
              <div
                className="rounded-[0.4cqw] p-[0.4cqw]"
                style={{ background: theme.isDark ? "rgba(255,255,255,0.90)" : "rgba(0,0,0,0.08)" }}
              >
                <QRCode
                  value={cardUrl}
                  size={100}
                  style={{ width: "6.5cqw", height: "6.5cqw", display: "block" }}
                  fgColor={theme.isDark ? "#0a0a0a" : "#111111"}
                  bgColor="transparent"
                  level="M"
                />
              </div>
            )}
          </div>
        </div>

        {/* headline */}
        <div className="mt-[2.2cqw]">
          <div className="label text-[1.05cqw]" style={{ color: tx(0.55) }}>
            Personal agenda
          </div>
          <h1 className="serif mt-[0.6cqw] text-[5.8cqw] font-semibold leading-[0.98]"
              style={{ color: theme.text }}>
            <span>{possessive}</span>{" "}
            <span className="serif-italic font-normal" style={{ color: tx(0.88) }}>agenda</span>
          </h1>
          <div className="mt-[1.1cqw] label text-[1.1cqw]" style={{ color: tx(0.65) }}>
            <span style={{ color: theme.text }}>{total}</span> session{total === 1 ? "" : "s"}
            <span className="mx-[0.6cqw]" style={{ color: tx(0.25) }}>/</span>
            <span style={{ color: theme.text }}>{days}</span> day{days === 1 ? "" : "s"}
            <span className="mx-[0.6cqw]" style={{ color: tx(0.25) }}>/</span> 15–17 May
          </div>
        </div>

        {/* topic pills */}
        {topics.length > 0 && (
          <div className="mt-[1.5cqw] flex flex-wrap gap-[0.6cqw]">
            {topics.map((t) => {
              const c = pillColorsForTheme(hueFor(t.topic), theme.isDark);
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
        <div
          className="grid grid-cols-3 gap-[2cqw] pt-[1.6cqw]"
          style={{ borderTop: `1px solid ${theme.divider}` }}
        >
          {EVENT_DAYS.map((d) => {
            const daySessions = byDaySessions[d] ?? [];
            const n = byDay[d] ?? 0;
            const shown = daySessions.slice(0, 3);
            const extra = n - 3;
            return (
              <div key={d} className="flex min-w-0 flex-col">
                <div className="flex items-baseline justify-between gap-1">
                  <div className="label text-[0.85cqw]" style={{ color: tx(0.50) }}>
                    {DAY_META[d].label}
                  </div>
                  <div className="serif text-[2.2cqw] font-semibold leading-none" style={{ color: theme.text }}>
                    {n}
                  </div>
                </div>
                <div className="mt-[0.6cqw] h-px" style={{ background: theme.divider }} />
                <ul className="mt-[0.7cqw] space-y-[0.55cqw]">
                  {shown.length === 0 ? (
                    <li className="label text-[0.82cqw]" style={{ color: tx(0.22) }}>nothing yet</li>
                  ) : (
                    shown.map((s) => (
                      <li key={s.id} className="flex items-baseline gap-[0.5cqw]">
                        <span
                          className="shrink-0 font-mono text-[0.82cqw]"
                          style={{ color: tx(0.40) }}
                        >
                          {formatTime(s.startsAt)}
                        </span>
                        <span
                          className="serif truncate text-[1.05cqw] leading-tight"
                          style={{ color: tx(0.85) }}
                        >
                          {s.title === "TBA" ? "To be announced" : s.title}
                        </span>
                      </li>
                    ))
                  )}
                  {extra > 0 && (
                    <li className="label text-[0.80cqw]" style={{ color: tx(0.32) }}>
                      +{extra} more
                    </li>
                  )}
                </ul>
              </div>
            );
          })}
        </div>

        {/* footer */}
        <div
          className="mt-[1.4cqw] flex items-center justify-between font-mono text-[0.9cqw]"
          style={{ color: tx(0.45) }}
        >
          <span>
            {xHandle || linkedin
              ? [xHandle && `@${xHandle}`, linkedin && `li/${linkedin}`].filter(Boolean).join(" · ")
              : "plan yours · aie-agenda"}
          </span>
          <span style={{ color: tx(0.65) }}>{footer}</span>
        </div>
      </div>
    </div>
  );
}

function Dot({ color }: { color: string }) {
  return (
    <span className="h-[0.9cqw] w-[0.9cqw] rounded-full" style={{ background: color, opacity: 0.9 }} />
  );
}
