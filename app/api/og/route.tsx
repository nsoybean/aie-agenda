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
import { pillColors } from "@/lib/theme";
import { decodeAgenda } from "@/lib/state";
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

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const { name, ids } = decodeAgenda(searchParams);
  const schedule = await getSchedule().catch(() => null);
  const sessions = schedule ? resolveSessions(schedule, ids) : [];

  const raw = name.trim() || "My";
  const possessive = /s$/i.test(raw) ? `${raw}'` : `${raw}'s`;
  const topics = aggregateTopics(sessions).slice(0, 5);
  const byDay = countByDay(sessions);
  const total = sessions.length;
  const days = EVENT_DAYS.filter((d) => (byDay[d] ?? 0) > 0).length || EVENT_DAYS.length;
  const highlights = pickHighlights(sessions, 3);

  const label = (size: number, color = "rgba(255,255,255,0.45)") =>
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
        width: W,
        height: H,
        display: "flex",
        flexDirection: "column",
        background: "#000000",
        color: "#fff",
        fontFamily: SANS,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* aurora */}
      <div
        style={{
          position: "absolute",
          top: -260,
          left: -200,
          width: 760,
          height: 620,
          background: "radial-gradient(closest-side, rgba(139,108,255,0.42), rgba(139,108,255,0))",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: -220,
          right: -160,
          width: 620,
          height: 520,
          background: "radial-gradient(closest-side, rgba(255,138,92,0.26), rgba(255,138,92,0))",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -300,
          left: 220,
          width: 620,
          height: 560,
          background: "radial-gradient(closest-side, rgba(79,212,196,0.18), rgba(79,212,196,0))",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: W,
          height: H,
          background: "radial-gradient(130% 120% at 50% 0%, rgba(0,0,0,0) 38%, rgba(0,0,0,0.9) 100%)",
        }}
      />

      {/* hairline frame */}
      <div
        style={{
          position: "absolute",
          top: 26,
          left: 26,
          right: 26,
          bottom: 26,
          border: "1px solid rgba(255,255,255,0.13)",
          borderRadius: 18,
        }}
      />

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
          <div style={label(13)}>{EVENT_NAME} · 2026</div>
        </div>

        {/* headline */}
        <div style={{ display: "flex", flexDirection: "column", marginTop: 34 }}>
          <div style={label(13)}>Personal agenda</div>
          <div style={{ display: "flex", alignItems: "baseline", flexWrap: "wrap", marginTop: 8 }}>
            <span style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 96, lineHeight: 1, color: "#fff" }}>
              {possessive}
            </span>
            <span
              style={{
                fontFamily: SERIF,
                fontStyle: "italic",
                fontWeight: 400,
                fontSize: 96,
                lineHeight: 1,
                color: "rgba(255,255,255,0.9)",
                marginLeft: 20,
              }}
            >
              agenda
            </span>
          </div>
          <div style={{ ...label(16, "rgba(255,255,255,0.55)"), marginTop: 20, display: "flex" }}>
            <span style={{ color: "#fff" }}>{total}</span>
            <span style={{ marginLeft: 8 }}>session{total === 1 ? "" : "s"}</span>
            <span style={{ margin: "0 12px", color: "rgba(255,255,255,0.25)" }}>/</span>
            <span style={{ color: "#fff" }}>{days}</span>
            <span style={{ marginLeft: 8 }}>day{days === 1 ? "" : "s"}</span>
            <span style={{ margin: "0 12px", color: "rgba(255,255,255,0.25)" }}>/</span>
            <span>15–17 May</span>
          </div>
        </div>

        {/* topics */}
        {topics.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 9, marginTop: 28 }}>
            {topics.map((t) => {
              const c = pillColors(t.topic);
              return (
                <div
                  key={t.topic}
                  style={{
                    display: "flex",
                    fontFamily: MONO,
                    fontSize: 16,
                    color: c.fg,
                    background: c.bg,
                    border: `1px solid ${c.border}`,
                    borderRadius: 99,
                    padding: "6px 14px",
                  }}
                >
                  {t.topic}
                </div>
              );
            })}
          </div>
        )}

        <div style={{ flex: 1 }} />

        {/* bottom */}
        <div
          style={{
            display: "flex",
            borderTop: "1px solid rgba(255,255,255,0.13)",
            paddingTop: 22,
            gap: 44,
          }}
        >
          <div style={{ display: "flex", flex: 1.05, gap: 18 }}>
            {EVENT_DAYS.map((d) => {
              const n = byDay[d] ?? 0;
              return (
                <div key={d} style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                  <div style={label(11, "rgba(255,255,255,0.35)")}>{DAY_NUM[d]}</div>
                  <div
                    style={{
                      fontFamily: SERIF,
                      fontWeight: 600,
                      fontSize: 44,
                      lineHeight: 1,
                      marginTop: 6,
                      color: "#fff",
                    }}
                  >
                    {n}
                  </div>
                  <div style={{ display: "flex", gap: 3, marginTop: 10 }}>
                    {n === 0 ? (
                      <div style={{ height: 4, flex: 1, borderRadius: 99, background: "rgba(255,255,255,0.1)" }} />
                    ) : (
                      Array.from({ length: Math.min(n, 7) }).map((_, i) => (
                        <div
                          key={i}
                          style={{ height: 4, flex: 1, borderRadius: 99, background: "rgba(255,255,255,0.75)" }}
                        />
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
            <div style={label(11, "rgba(255,255,255,0.35)")}>On your list</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
              {highlights.length === 0 ? (
                <div style={{ fontSize: 16, color: "rgba(255,255,255,0.4)" }}>— nothing picked yet —</div>
              ) : (
                highlights.map((s) => (
                  <div key={s.id} style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                    <span style={{ fontFamily: MONO, fontSize: 13, color: "rgba(255,255,255,0.35)" }}>
                      {formatTime(s.startsAt)}
                    </span>
                    <span
                      style={{
                        fontFamily: SERIF,
                        fontSize: 19,
                        color: "rgba(255,255,255,0.85)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        maxWidth: 360,
                      }}
                    >
                      {s.title === "TBA" ? "To be announced" : s.title}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 22,
            fontFamily: MONO,
            fontSize: 13,
            color: "rgba(255,255,255,0.35)",
          }}
        >
          <span>plan yours · aie-agenda</span>
          <span style={{ color: "rgba(255,255,255,0.55)" }}>ai.engineer/singapore</span>
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
