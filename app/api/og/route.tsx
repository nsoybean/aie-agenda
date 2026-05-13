import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import {
  aggregateTopics,
  countByDay,
  EVENT_DAYS,
  formatTime,
  getSchedule,
  resolveSessions,
} from "@/lib/api";
import { hueFor } from "@/lib/theme";
import { decodeAgenda } from "@/lib/state";
import { getTheme, pillColorsForTheme } from "@/lib/themes";
import { EVENT_NAME } from "@/lib/site";
import type { Session } from "@/lib/types";

export const runtime = "nodejs";

const W = 1200;
const H = 630;

const DAY_NUM: Record<string, string> = {
  "2026-05-15": "DAY 1 · FRI",
  "2026-05-16": "DAY 2 · SAT",
  "2026-05-17": "DAY 3 · SUN",
};

async function fonts() {
  const dir = join(process.cwd(), "assets", "fonts");
  const [frReg, frSemi, frItal, inReg, inSemi, jb] = await Promise.all([
    readFile(join(dir, "Fraunces-Regular.woff")),
    readFile(join(dir, "Fraunces-SemiBold.woff")),
    readFile(join(dir, "Fraunces-Italic.woff")),
    readFile(join(dir, "Inter-Regular.woff")),
    readFile(join(dir, "Inter-SemiBold.woff")),
    readFile(join(dir, "JetBrainsMono-Medium.woff")),
  ]);
  return [
    { name: "Fraunces", data: frReg, weight: 400 as const, style: "normal" as const },
    { name: "Fraunces", data: frSemi, weight: 600 as const, style: "normal" as const },
    { name: "Fraunces", data: frItal, weight: 400 as const, style: "italic" as const },
    { name: "Inter", data: inReg, weight: 400 as const, style: "normal" as const },
    { name: "Inter", data: inSemi, weight: 600 as const, style: "normal" as const },
    { name: "JetBrains Mono", data: jb, weight: 500 as const, style: "normal" as const },
  ];
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

const MONO = "JetBrains Mono";
const SERIF = "Fraunces";
const SANS = "Inter";

const DAY_NUM_OG: Record<string, string> = {
  "2026-05-15": "DAY 1 · FRI",
  "2026-05-16": "DAY 2 · SAT",
  "2026-05-17": "DAY 3 · SUN",
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const { name, ids, theme: themeId, x, linkedin } = decodeAgenda(searchParams);
  const theme = getTheme(themeId);
  const tx = theme.textAt;

  const schedule = await getSchedule().catch(() => null);
  const sessions = schedule ? resolveSessions(schedule, ids) : [];

  const raw = name.trim() || "My";
  const possessive = /s$/i.test(raw) ? `${raw}'` : `${raw}'s`;
  const topics = aggregateTopics(sessions).slice(0, 5);
  const byDay = countByDay(sessions);
  const total = sessions.length;
  const days = EVENT_DAYS.filter((d) => (byDay[d] ?? 0) > 0).length || EVENT_DAYS.length;

  const label = (size: number, color = tx(0.50)) =>
    ({
      fontFamily: MONO,
      fontSize: size,
      letterSpacing: size * 0.22,
      textTransform: "uppercase" as const,
      color,
    });

  const img = (
    <div
      style={{
        width: W, height: H,
        display: "flex", flexDirection: "column",
        background: theme.bg, color: theme.text,
        fontFamily: SANS, position: "relative", overflow: "hidden",
      }}
    >
      {/* aurora glows */}
      {theme.glows.map((g, i) => (
        <div key={i} style={{
          position: "absolute",
          top: g.top, bottom: g.bottom, left: g.left, right: g.right,
          width: g.w, height: g.h,
          background: `radial-gradient(closest-side, ${g.color}, transparent)`,
          filter: "blur(1px)",
        }} />
      ))}
      {theme.vignette && (
        <div style={{ position: "absolute", top: 0, left: 0, width: W, height: H, background: theme.vignette }} />
      )}
      {theme.id === "vercel" && (
        <div style={{
          position: "absolute", top: 0, left: 0, width: W, height: H,
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }} />
      )}

      {/* hairline frame */}
      <div style={{
        position: "absolute", top: 26, left: 26, right: 26, bottom: 26,
        border: `1px solid ${theme.frameBorder}`, borderRadius: 8,
      }} />

      {/* content */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          padding: "54px 64px",
          position: "relative",
        }}
      >
        {/* header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 9 }}>
            <div style={{ width: 13, height: 13, borderRadius: 99, background: "#ff5f57" }} />
            <div style={{ width: 13, height: 13, borderRadius: 99, background: "#febc2e" }} />
            <div style={{ width: 13, height: 13, borderRadius: 99, background: "#28c840" }} />
          </div>
          <div style={label(13, tx(0.60))}>{EVENT_NAME} · 2026</div>
        </div>

        {/* headline */}
        <div style={{ display: "flex", flexDirection: "column", marginTop: 28 }}>
          <div style={label(13, tx(0.52))}>Personal agenda</div>
          <div style={{ display: "flex", alignItems: "baseline", flexWrap: "wrap", marginTop: 8 }}>
            <span style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 88, lineHeight: 1, color: theme.text }}>
              {possessive}
            </span>
            <span
              style={{
                fontFamily: SERIF,
                fontStyle: "italic",
                fontWeight: 400,
                fontSize: 88,
                lineHeight: 1,
                color: tx(0.88),
                marginLeft: 20,
              }}
            >
              agenda
            </span>
          </div>
          <div style={{ ...label(16, tx(0.60)), marginTop: 20, display: "flex" }}>
            <span style={{ color: theme.text }}>{total}</span>
            <span style={{ marginLeft: 8 }}>session{total === 1 ? "" : "s"}</span>
            <span style={{ margin: "0 12px", color: tx(0.25) }}>/</span>
            <span style={{ color: theme.text }}>{days}</span>
            <span style={{ marginLeft: 8 }}>day{days === 1 ? "" : "s"}</span>
            <span style={{ margin: "0 12px", color: tx(0.25) }}>/</span>
            <span>15–17 May</span>
          </div>
        </div>

        {/* topics */}
        {topics.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 9, marginTop: 24 }}>
            {topics.map((t) => {
              const c = pillColorsForTheme(hueFor(t.topic), theme.isDark);
              return (
                <div key={t.topic} style={{
                  display: "flex", fontFamily: MONO, fontSize: 15,
                  color: c.fg, background: c.bg, border: `1px solid ${c.border}`,
                  borderRadius: 99, padding: "6px 14px",
                }}>
                  {t.topic}
                </div>
              );
            })}
          </div>
        )}

        <div style={{ flex: 1 }} />

        {/* 3-column day breakdown */}
        <div style={{ display: "flex", gap: 28, borderTop: `1px solid ${theme.divider}`, paddingTop: 20 }}>
          {EVENT_DAYS.map((d) => {
            const daySessions = sessions
              .filter((s) => s.day === d)
              .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
            const n = byDay[d] ?? 0;
            const shown = daySessions.slice(0, 3);
            const extra = n - 3;
            return (
              <div key={d} style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                  <div style={label(10, tx(0.52))}>{DAY_NUM_OG[d]}</div>
                  <div style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 32, lineHeight: 1, color: theme.text }}>
                    {n}
                  </div>
                </div>
                <div style={{ height: 1, background: theme.divider, marginTop: 8 }} />
                <div style={{ display: "flex", flexDirection: "column", gap: 7, marginTop: 10 }}>
                  {shown.length === 0 ? (
                    <div style={{ fontFamily: MONO, fontSize: 11, color: tx(0.22), textTransform: "uppercase", letterSpacing: 2 }}>
                      nothing yet
                    </div>
                  ) : (
                    shown.map((s) => (
                      <div key={s.id} style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                        <span style={{ fontFamily: MONO, fontSize: 11, color: tx(0.42), flexShrink: 0 }}>
                          {formatTime(s.startsAt)}
                        </span>
                        <span style={{
                          fontFamily: SERIF, fontSize: 14, lineHeight: 1.25, color: tx(0.85),
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        }}>
                          {s.title === "TBA" ? "To be announced" : s.title}
                        </span>
                      </div>
                    ))
                  )}
                  {extra > 0 && (
                    <div style={{ fontFamily: MONO, fontSize: 10, color: tx(0.32), textTransform: "uppercase", letterSpacing: 1.5 }}>
                      +{extra} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* footer */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 18, fontFamily: MONO, fontSize: 12, color: tx(0.45) }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            {x ? (
              <div style={{ display: "flex", alignItems: "center", gap: 5, color: tx(0.70) }}>
                {/* X logo */}
                <svg viewBox="0 0 24 24" width={13} height={13} fill={tx(0.70)}>
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                <span>@{x}</span>
              </div>
            ) : (
              <span>plan yours · aie-agenda</span>
            )}
            {linkedin && (
              <div style={{ display: "flex", alignItems: "center", gap: 5, color: tx(0.70) }}>
                {/* LinkedIn logo */}
                <svg viewBox="0 0 24 24" width={13} height={13} fill={tx(0.70)}>
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
                <span>{linkedin}</span>
              </div>
            )}
          </div>
          <span style={{ color: tx(0.62) }}>ai.engineer/singapore</span>
        </div>
      </div>
    </div>
  );

  return new ImageResponse(img, {
    width: W,
    height: H,
    fonts: await fonts(),
    headers: {
      "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400",
    },
  });
}
