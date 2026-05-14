"use client";

import { useEffect, useMemo, useState } from "react";
import type { Session } from "@/lib/types";
import { buildIndex } from "@/lib/tfidf";

const PALETTE = [
  { bg: "rgba(99,102,241,0.18)", border: "rgba(99,102,241,0.45)", fg: "#a5b4fc" },
  { bg: "rgba(20,184,166,0.18)", border: "rgba(20,184,166,0.45)", fg: "#5eead4" },
  { bg: "rgba(245,158,11,0.18)", border: "rgba(245,158,11,0.45)", fg: "#fcd34d" },
  { bg: "rgba(239,68,68,0.18)",  border: "rgba(239,68,68,0.45)",  fg: "#fca5a5" },
  { bg: "rgba(168,85,247,0.18)", border: "rgba(168,85,247,0.45)", fg: "#d8b4fe" },
  { bg: "rgba(34,197,94,0.18)",  border: "rgba(34,197,94,0.45)",  fg: "#86efac" },
  { bg: "rgba(249,115,22,0.18)", border: "rgba(249,115,22,0.45)", fg: "#fdba74" },
  { bg: "rgba(14,165,233,0.18)", border: "rgba(14,165,233,0.45)", fg: "#7dd3fc" },
];

function termColor(term: string) {
  let h = 0;
  for (let i = 0; i < term.length; i++) h = (h * 31 + term.charCodeAt(i)) & 0xffff;
  return PALETTE[h % PALETTE.length];
}

const API_SESSIONS = "https://aie.65labs.org/api/v1/sessions";

function useAllSessions(fallback: Session[]) {
  const [data, setData] = useState<Session[]>(fallback);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(API_SESSIONS)
      .then((r) => r.json())
      .then((json) => {
        const sessions: Session[] = (json.sessions ?? []).filter(
          (s: Session) => s.description && s.format !== "break",
        );
        setData(sessions.length > 0 ? sessions : fallback);
      })
      .catch(() => setData(fallback))
      .finally(() => setLoading(false));
  }, []);

  return { sessions: data, loading };
}

export default function ContentGraph({
  sessions: fallback,
  onSearch,
}: {
  sessions: Session[];
  onSearch: (q: string) => void;
}) {
  const { sessions, loading } = useAllSessions(fallback);
  const [active, setActive] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  const index = useMemo(() => buildIndex(sessions), [sessions]);
  const cloudTerms = useMemo(() => index.globalTerms.slice(0, 70), [index]);

  function handleSelect(term: string) {
    if (active === term) {
      setActive(null);
      onSearch("");
    } else {
      setActive(term);
      onSearch(term);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="font-mono text-[10px] text-ink-faint">
          {loading ? (
            <span className="animate-pulse">fetching descriptions…</span>
          ) : (
            `${cloudTerms.length} terms · click to filter`
          )}
        </span>
        {active && (
          <button
            type="button"
            onClick={() => { setActive(null); onSearch(""); }}
            className="ml-auto font-mono text-[10px] text-ink-faint underline-offset-2 hover:text-ink-dim hover:underline"
          >
            clear
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-2 py-1">
        {cloudTerms.map(({ term, score, docFreq }) => {
          const maxScore = cloudTerms[0].score;
          const minScore = cloudTerms[cloudTerms.length - 1].score;
          const t = (score - minScore) / (maxScore - minScore + 0.001);
          // clamp font size: 10–20px on mobile (handled via clamp), up to 28px on wider screens
          const pxBase = 10 + t * 18;
          const fontSize = `clamp(10px, ${pxBase.toFixed(1)}px, ${(pxBase * 1.4).toFixed(1)}px)`;
          const opacity = 0.55 + t * 0.45;
          const c = termColor(term);
          const isActive = active === term;
          const isHovered = hovered === term;
          return (
            <button
              key={term}
              type="button"
              onClick={() => handleSelect(term)}
              onMouseEnter={() => setHovered(term)}
              onMouseLeave={() => setHovered(null)}
              title={`${docFreq} session${docFreq === 1 ? "" : "s"}`}
              style={{
                fontSize,
                opacity: isActive || isHovered ? 1 : opacity,
                backgroundColor: isActive ? c.fg : c.bg,
                border: `1px solid ${c.border}`,
                color: isActive ? "#000" : c.fg,
                transition: "all 0.15s",
                flexShrink: 0,
              }}
              className="rounded-full px-2.5 py-0.5 font-mono leading-tight tracking-tight"
            >
              {term}
            </button>
          );
        })}
      </div>

      {active && (
        <div className="rounded-lg border border-line bg-surface-2 px-3 py-2 font-mono text-[11px] text-ink-dim">
          Showing sessions mentioning{" "}
          <span className="font-semibold text-ink">"{active}"</span>
          {" — "}
          {index.sessionsByTerm.get(active)?.length ?? 0} match
          {(index.sessionsByTerm.get(active)?.length ?? 0) === 1 ? "" : "es"}
        </div>
      )}
    </div>
  );
}
