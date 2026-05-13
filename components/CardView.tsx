"use client";

import { useMemo, useState } from "react";
import { conflictIdSet } from "@/lib/api";
import type { Session } from "@/lib/types";
import HeroCard from "./HeroCard";
import SessionList from "./SessionList";
import SessionDetailPanel from "./SessionDetailPanel";
import ShareBar from "./ShareBar";

const CARD_ID = "agenda-hero-card";

export default function CardView({
  name,
  sessions,
  editHref,
  siteHost,
}: {
  name: string;
  sessions: Session[];
  editHref: string;
  siteHost: string;
}) {
  const [open, setOpen] = useState<Session | null>(null);
  const conflicts = useMemo(() => conflictIdSet(sessions), [sessions]);
  const nClashes = conflicts.size;

  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-10 sm:py-14">
      {/* the card */}
      <div className="mx-auto max-w-2xl">
        <div id={CARD_ID} className="overflow-hidden rounded-2xl shadow-[0_20px_70px_rgba(0,0,0,0.6)]">
          <HeroCard name={name} sessions={sessions} footer={siteHost} />
        </div>
      </div>

      <div className="mt-6">
        <ShareBar name={name} sessions={sessions} cardNodeId={CARD_ID} editHref={editHref} />
      </div>

      {nClashes > 0 && (
        <p className="mt-4 text-sm text-amber-300/80">
          ⚠ {nClashes / 2 >= 1 ? `${nClashes} sessions overlap` : "Some sessions overlap"} — tap a row marked
          “clash” to see the conflict.
        </p>
      )}

      {/* full agenda */}
      <section className="mt-10">
        <div className="mb-5 flex items-baseline justify-between">
          <h2 className="serif text-2xl font-semibold text-ink">
            {name.trim() ? `${name.trim()}’s` : "Your"} full agenda
          </h2>
          <span className="font-mono text-sm text-ink-faint">{sessions.length} sessions</span>
        </div>
        <SessionList sessions={sessions} conflictIds={conflicts} onSelect={setOpen} selectedId={open?.id} />
      </section>

      <SessionDetailPanel session={open} onClose={() => setOpen(null)} />
    </main>
  );
}
