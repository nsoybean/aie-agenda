"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import QRCode from "react-qr-code";
import { conflictIdSet } from "@/lib/api";
import type { ThemeId } from "@/lib/themes";
import { DEFAULT_THEME, getTheme } from "@/lib/themes";
import type { Session } from "@/lib/types";
import HeroCard from "./HeroCard";
import SessionList from "./SessionList";
import SessionDetailPanel from "./SessionDetailPanel";
import ShareBar from "./ShareBar";
import ThemeSelector from "./ThemeSelector";
import TimelineView from "./TimelineView";
import { XIcon, LinkedInIcon } from "./BrandIcons";

const CARD_ID = "agenda-hero-card";

function subscribeToLocation() {
  return () => {};
}

function getCardUrl() {
  return typeof window === "undefined" ? "" : window.location.href;
}

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
  const [agendaView, setAgendaView] = useState<"list" | "timeline">("list");
  const [scanOpen, setScanOpen] = useState(false);
  const cardUrl = useSyncExternalStore(subscribeToLocation, getCardUrl, () => "");
  const conflicts = useMemo(() => conflictIdSet(sessions), [sessions]);
  const nClashes = conflicts.size;
  const selectedIds = useMemo(() => new Set(sessions.map((s) => s.id)), [sessions]);

  function handleThemeChange(t: ThemeId) {
    setTheme(t);
    const url = new URL(window.location.href);
    if (t === DEFAULT_THEME) url.searchParams.delete("t");
    else url.searchParams.set("t", t);
    router.replace(url.pathname + url.search, { scroll: false });
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
      <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <ThemeSelector current={theme} onChange={handleThemeChange} />
        <ShareBar name={name} sessions={sessions} cardNodeId={CARD_ID} onOpenScanView={() => setScanOpen(true)} />
      </div>

      {nClashes > 0 && (
        <p className="mt-4 text-sm text-amber-300/80">
          ⚠ {nClashes} sessions overlap — tap a row marked &quot;clash&quot; to see details.
        </p>
      )}

      {/* identity strip */}
      {(xHandle || linkedin) && (
        <div className="mt-8 border-t border-line pt-6">
          {name.trim() && (
            <div className="serif mb-2 text-base font-semibold leading-tight text-ink">{name.trim()}</div>
          )}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
            {xHandle && (
              <a
                href={`https://x.com/${xHandle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 font-mono text-sm text-ink-dim transition-colors hover:text-ink"
              >
                <XIcon className="h-3.5 w-3.5 shrink-0" />
                @{xHandle}
              </a>
            )}
            {linkedin && (
              <a
                href={`https://linkedin.com/in/${linkedin}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 font-mono text-sm text-ink-dim transition-colors hover:text-ink"
              >
                <LinkedInIcon className="h-3.5 w-3.5 shrink-0" />
                {linkedin}
              </a>
            )}
          </div>
        </div>
      )}

      {/* full agenda */}
      <section className="mt-10">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="serif text-2xl font-semibold text-ink">
            {name.trim() ? `${name.trim()}'s` : "Your"} full agenda
          </h2>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm text-ink-faint">{sessions.length} sessions</span>
            <div className="flex items-center rounded-full border border-line p-0.5">
              <button
                type="button"
                onClick={() => setAgendaView("list")}
                className={`rounded-full px-2.5 py-0.5 font-mono text-xs lowercase tracking-tight transition-colors ${
                  agendaView === "list" ? "bg-white text-black" : "text-ink-dim hover:text-ink"
                }`}
              >
                list
              </button>
              <button
                type="button"
                onClick={() => setAgendaView("timeline")}
                className={`rounded-full px-2.5 py-0.5 font-mono text-xs lowercase tracking-tight transition-colors ${
                  agendaView === "timeline" ? "bg-white text-black" : "text-ink-dim hover:text-ink"
                }`}
              >
                timeline
              </button>
            </div>
          </div>
        </div>
        {agendaView === "timeline" ? (
          <TimelineView
            sessions={sessions}
            selectedIds={selectedIds}
            conflictIds={conflicts}
            onToggle={() => {}}
            onDetail={setOpen}
            readOnly
          />
        ) : (
          <SessionList sessions={sessions} conflictIds={conflicts} onSelect={setOpen} selectedId={open?.id} />
        )}
      </section>

      {scanOpen && (
        <ScanCardOverlay
          name={name}
          url={cardUrl || ""}
          xHandle={xHandle}
          linkedin={linkedin}
          themeId={theme}
          onClose={() => setScanOpen(false)}
        />
      )}

      <SessionDetailPanel session={open} allSessions={sessions} onClose={() => setOpen(null)} />
    </main>
  );
}

function ScanCardOverlay({
  name,
  url,
  xHandle,
  linkedin,
  themeId,
  onClose,
}: {
  name: string;
  url: string;
  xHandle?: string;
  linkedin?: string;
  themeId: ThemeId;
  onClose: () => void;
}) {
  const displayName = name.trim() || "My AI Engineer agenda";
  const theme = getTheme(themeId);
  const tx = theme.textAt;
  const qrFrame = theme.isDark ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.96)";
  const qrShadow = theme.isDark ? "0 24px 90px rgba(255,255,255,0.14)" : "0 24px 90px rgba(0,0,0,0.18)";

  return (
    <div
      className="fixed inset-0 z-50 flex min-h-dvh flex-col overflow-hidden px-5 py-5 sm:px-8"
      style={{ background: theme.bg, color: theme.text }}
    >
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
        {theme.vignette && <div className="absolute inset-0" style={{ background: theme.vignette }} />}
        <div className="grain-overlay absolute inset-0 mix-blend-soft-light opacity-25" />
      </div>

      <div
        className="pointer-events-none absolute inset-4 rounded-2xl"
        style={{ border: `1px solid ${theme.frameBorder}` }}
        aria-hidden
      />

      <div className="flex items-center justify-between gap-4">
        <div className="relative label text-[10px]" style={{ color: tx(0.55) }}>scan agenda card</div>
        <button
          type="button"
          onClick={onClose}
          className="relative rounded-full px-3 py-1.5 font-mono text-xs lowercase transition-colors"
          style={{ border: `1px solid ${theme.frameBorder}`, color: tx(0.72), background: tx(0.08) }}
        >
          close
        </button>
      </div>

      <div className="relative flex flex-1 flex-col items-center justify-center gap-7 text-center">
        <div>
          <div className="serif text-4xl font-semibold leading-tight sm:text-6xl" style={{ color: theme.text }}>
            {displayName}
          </div>
          <div className="label mt-3 text-[11px]" style={{ color: tx(0.58) }}>
            AI Engineer Singapore · 2026
          </div>
        </div>

        <div className="w-full max-w-[min(82vw,420px)] rounded-2xl p-5" style={{ background: qrFrame, boxShadow: qrShadow }}>
          {url ? (
            <QRCode value={url} size={420} className="h-auto w-full" fgColor="#000000" bgColor="#ffffff" level="M" />
          ) : (
            <div className="aspect-square w-full animate-pulse rounded-lg bg-black/10" />
          )}
        </div>

        {(xHandle || linkedin) && (
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            {xHandle && (
              <span className="flex items-center gap-1.5 font-mono text-base" style={{ color: tx(0.78) }}>
                <XIcon className="h-4 w-4 shrink-0" />
                @{xHandle}
              </span>
            )}
            {linkedin && (
              <span className="flex items-center gap-1.5 font-mono text-base" style={{ color: tx(0.78) }}>
                <LinkedInIcon className="h-4 w-4 shrink-0" />
                {linkedin}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
