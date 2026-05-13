"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { conflictIdSet } from "@/lib/api";
import { encodeAgenda } from "@/lib/state";
import type { ThemeId } from "@/lib/themes";
import { DEFAULT_THEME } from "@/lib/themes";
import type { Session } from "@/lib/types";
import HeroCard from "./HeroCard";
import SessionList from "./SessionList";
import SessionDetailPanel from "./SessionDetailPanel";
import ShareBar from "./ShareBar";
import ThemeSelector from "./ThemeSelector";

const CARD_ID = "agenda-hero-card";

export default function CardView({
  name,
  sessions,
  editHref,
  siteHost,
  initialTheme,
  xHandle,
  linkedin,
}: {
  name: string;
  sessions: Session[];
  editHref: string;
  siteHost: string;
  initialTheme?: ThemeId;
  xHandle?: string;
  linkedin?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState<Session | null>(null);
  const [theme, setTheme] = useState<ThemeId>(initialTheme ?? DEFAULT_THEME);
  const [cardUrl, setCardUrl] = useState("");
  useEffect(() => { setCardUrl(window.location.href); }, []);
  const conflicts = useMemo(() => conflictIdSet(sessions), [sessions]);
  const nClashes = conflicts.size;
  const ids = useMemo(() => sessions.map((s) => s.id), [sessions]);

  function handleThemeChange(t: ThemeId) {
    setTheme(t);
    const q = encodeAgenda({ name, ids, theme: t, ...(xHandle && { x: xHandle }), ...(linkedin && { linkedin }) });
    router.replace(`/card?${q}`, { scroll: false });
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-10 sm:py-14">
      {/* top nav */}
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <div className="serif text-lg font-semibold leading-tight text-ink">
            AI Engineer Singapore
          </div>
          <div className="label text-[10px] text-ink-faint">15–17 May 2026 · Your agenda</div>
        </div>
        <a
          href={editHref}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-line px-3 py-1.5 font-mono text-xs text-ink-dim transition-colors hover:border-line-strong hover:text-ink"
        >
          ← Edit my picks
        </a>
      </div>

      {/* the card */}
      <div className="mx-auto max-w-2xl">
        <div id={CARD_ID} className="overflow-hidden rounded-lg shadow-[0_20px_70px_rgba(0,0,0,0.6)]">
          <HeroCard
            name={name}
            sessions={sessions}
            footer={siteHost}
            themeId={theme}
            xHandle={xHandle}
            linkedin={linkedin}
            cardUrl={cardUrl || undefined}
          />
        </div>
      </div>

      {/* theme selector + share bar */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
        <ThemeSelector current={theme} onChange={handleThemeChange} />
        <ShareBar name={name} sessions={sessions} cardNodeId={CARD_ID} />
      </div>

      {nClashes > 0 && (
        <p className="mt-4 text-sm text-amber-300/80">
          ⚠ {nClashes} sessions overlap — tap a row marked "clash" to see details.
        </p>
      )}

      {/* full agenda */}
      <section className="mt-10">
        <div className="mb-5 flex items-baseline justify-between">
          <h2 className="serif text-2xl font-semibold text-ink">
            {name.trim() ? `${name.trim()}'s` : "Your"} full agenda
          </h2>
          <span className="font-mono text-sm text-ink-faint">{sessions.length} sessions</span>
        </div>
        <SessionList sessions={sessions} conflictIds={conflicts} onSelect={setOpen} selectedId={open?.id} />
      </section>

      <SessionDetailPanel session={open} allSessions={sessions} onClose={() => setOpen(null)} />
    </main>
  );
}
