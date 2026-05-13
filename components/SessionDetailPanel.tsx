"use client";

import { useEffect, useState } from "react";
import { DAY_LABEL, formatTime, formatTimeRange, googleCalUrl } from "@/lib/api";
import { FORMAT_LABEL, pillColors } from "@/lib/theme";
import type { Session, SpeakerRef } from "@/lib/types";
import SpeakerAvatar from "./SpeakerAvatar";
import TopicPill from "./TopicPill";

type View =
  | { type: "session" }
  | { type: "speaker"; name: string };

export default function SessionDetailPanel({
  session,
  allSessions,
  onClose,
  selectedIds,
  onToggle,
}: {
  session: Session | null;
  allSessions: Session[];
  onClose: () => void;
  selectedIds?: Set<string>;
  onToggle?: (id: string) => void;
}) {
  const [view, setView] = useState<View>({ type: "session" });

  // reset to session view whenever a new session is opened
  useEffect(() => {
    setView({ type: "session" });
  }, [session?.id]);

  useEffect(() => {
    if (!session) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (view.type === "speaker") setView({ type: "session" });
        else onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [session, onClose, view]);

  if (!session) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
      />
      <div className="scroll-thin relative z-10 flex h-full w-full max-w-md flex-col overflow-y-auto border-l border-line bg-surface-1 shadow-2xl max-sm:mt-auto max-sm:h-auto max-sm:max-h-[88vh] max-sm:max-w-none max-sm:rounded-t-2xl max-sm:border-l-0 max-sm:border-t">

        {/* header */}
        <div className="sticky top-0 flex items-center justify-between border-b border-line bg-surface-1/95 px-5 py-3 backdrop-blur">
          <div className="flex items-center gap-2">
            {view.type === "speaker" && (
              <button
                type="button"
                onClick={() => setView({ type: "session" })}
                className="mr-1 rounded-md p-1 text-ink-dim transition-colors hover:bg-white/10 hover:text-ink"
                title="Back to session"
              >
                ←
              </button>
            )}
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-ink-faint">
              {view.type === "speaker"
                ? "Speaker"
                : `${FORMAT_LABEL[session.format] ?? session.format}${session.status === "tentative" ? " · tentative" : ""}`}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-ink-dim transition-colors hover:bg-white/10 hover:text-ink"
          >
            ✕
          </button>
        </div>

        {view.type === "session" ? (
          <SessionView
            session={session}
            onSpeakerClick={(name) => setView({ type: "speaker", name })}
            isSelected={selectedIds?.has(session.id)}
            onToggle={onToggle ? () => onToggle(session.id) : undefined}
          />
        ) : (
          <SpeakerView
            speakerName={view.name}
            allSessions={allSessions}
            onSessionClick={() => setView({ type: "session" })}
            selectedIds={selectedIds}
            onToggle={onToggle}
          />
        )}
      </div>
    </div>
  );
}

/* ── Session view ─────────────────────────────────────────────────────────── */

function SessionView({
  session: s,
  onSpeakerClick,
  isSelected,
  onToggle,
}: {
  session: Session;
  onSpeakerClick: (name: string) => void;
  isSelected?: boolean;
  onToggle?: () => void;
}) {
  const track = s.track && s.track !== "TBD" ? s.track : null;
  const tc = track ? pillColors(track) : null;
  const link = s.links?.canonical || s.links?.source || s.sourceUrl || undefined;
  const filteredTopics = (s.topics ?? []).filter(
    (t) => !["tba", "main stage", "workshop", "leadership", "keynote"].includes(t.toLowerCase()),
  );

  return (
    <div className="flex flex-col pb-6">
      {/* ── Title block ── */}
      <div className="px-5 pt-5">
        <h2 className="serif text-2xl font-semibold leading-snug text-ink">
          {s.title === "TBA" ? (
            <span className="text-ink-dim italic">To be announced</span>
          ) : s.title}
        </h2>

        {/* meta row */}
        <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-xs text-ink-dim">
          <span className="text-ink">{DAY_LABEL[s.day]?.short ?? s.day}</span>
          <span className="text-ink-faint">·</span>
          <span>{formatTimeRange(s)}</span>
          <span className="text-ink-faint">·</span>
          <span>{s.durationMinutes} min</span>
        </div>

        {/* venue + track */}
        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          {s.venue?.name && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white/[0.04] px-2.5 py-1 text-xs text-ink-dim">
              <span className="text-ink-faint">📍</span>
              {[s.venue.name, s.venue.room].filter(Boolean).join(" · ")}
            </span>
          )}
          {track && tc && (
            <span
              className="rounded-full px-2.5 py-1 font-mono text-[11px] lowercase tracking-tight"
              style={{ backgroundColor: tc.bg, border: `1px solid ${tc.border}`, color: tc.fg }}
            >
              {track}
            </span>
          )}
        </div>

        {/* topic pills */}
        {filteredTopics.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {filteredTopics.map((t) => (
              <TopicPill key={t} topic={t} size="sm" />
            ))}
          </div>
        )}
      </div>

      {/* ── Primary CTA ── */}
      {onToggle && (
        <div className="mt-5 px-5">
          <button
            type="button"
            onClick={onToggle}
            className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium transition-all ${
              isSelected
                ? "bg-white/10 text-ink ring-1 ring-white/20 hover:bg-white/[0.07]"
                : "bg-white text-black hover:opacity-90"
            }`}
          >
            {isSelected ? (
              <><span>✓</span> Added to agenda</>
            ) : (
              <><span>+</span> Add to agenda</>
            )}
          </button>
        </div>
      )}

      {/* ── Description ── */}
      {s.description && (
        <div className="mt-5 border-t border-line px-5 pt-5">
          <p className="text-sm leading-relaxed text-ink-dim">{s.description}</p>
        </div>
      )}

      {/* ── Speakers ── */}
      {s.speakers?.length > 0 && (
        <div className="mt-5 border-t border-line px-5 pt-5">
          <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-faint">
            {s.speakers.length > 1 ? "Speakers" : "Speaker"}
          </div>
          <div className="flex flex-col gap-2">
            {s.speakers.map((sp, i) => (
              <SpeakerCard key={i} speaker={sp} onClick={() => onSpeakerClick(sp.name)} />
            ))}
          </div>
        </div>
      )}

      {/* ── Secondary actions ── */}
      <div className="mt-5 border-t border-line px-5 pt-4">
        <div className="flex flex-wrap gap-2">
          <a
            href={googleCalUrl(s)}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-line px-3 py-2 text-sm text-ink-dim transition-colors hover:border-line-strong hover:text-ink"
          >
            Add to Calendar
          </a>
          {link && (
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-line px-3 py-2 text-sm text-ink-dim transition-colors hover:border-line-strong hover:text-ink"
            >
              Source ↗
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Speaker card (clickable row) ─────────────────────────────────────────── */

function SpeakerCard({
  speaker: sp,
  onClick,
}: {
  speaker: SpeakerRef;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center gap-3 rounded-xl border border-line bg-white/[0.03] p-3 text-left transition-colors hover:border-line-strong hover:bg-white/[0.06]"
    >
      <SpeakerAvatar name={sp.name} apiImageUrl={sp.imageUrl} size={44} className="shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-ink">{sp.name}</div>
        {(sp.title || sp.company) && (
          <div className="mt-0.5 truncate text-xs text-ink-dim">
            {[sp.title, sp.company].filter(Boolean).join(" · ")}
          </div>
        )}
        {sp.bio && (
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-ink-faint">{sp.bio}</p>
        )}
      </div>
      <span className="shrink-0 text-xs text-ink-faint opacity-0 transition-opacity group-hover:opacity-100">
        sessions →
      </span>
    </button>
  );
}

/* ── Speaker view ─────────────────────────────────────────────────────────── */

function SpeakerView({
  speakerName,
  allSessions,
  onSessionClick,
  selectedIds,
  onToggle,
}: {
  speakerName: string;
  allSessions: Session[];
  onSessionClick: () => void;
  selectedIds?: Set<string>;
  onToggle?: (id: string) => void;
}) {
  // find richest speaker record and all sessions they appear in
  const speakerSessions = allSessions
    .filter((s) => s.speakers?.some((sp) => sp.name === speakerName))
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));

  const sp = speakerSessions
    .flatMap((s) => s.speakers)
    .filter((s) => s.name === speakerName)
    .reduce<SpeakerRef | null>((best, cur) => {
      if (!best) return cur;
      const score = (s: SpeakerRef) =>
        (s.bio ? 4 : 0) + (s.title ? 2 : 0) + (s.imageUrl ? 1 : 0);
      return score(cur) > score(best) ? cur : best;
    }, null);

  if (!sp) return null;

  return (
    <div className="flex flex-col gap-5 px-5 py-5">
      {/* speaker profile */}
      <div className="flex gap-4">
        <SpeakerAvatar name={sp.name} apiImageUrl={sp.imageUrl} size={56} className="mt-0.5 shrink-0" />
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-ink">{sp.name}</h2>
          {(sp.title || sp.company) && (
            <div className="mt-0.5 text-sm text-ink-dim">
              {[sp.title, sp.company].filter(Boolean).join(" · ")}
            </div>
          )}
        </div>
      </div>

      {sp.bio && (
        <p className="text-sm leading-relaxed text-ink-dim">{sp.bio}</p>
      )}

      {/* all sessions */}
      <div>
        <div className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-ink-faint">
          {speakerSessions.length} session{speakerSessions.length === 1 ? "" : "s"}
        </div>
        <ul className="space-y-1.5">
          {speakerSessions.map((s) => {
            const track = s.track && s.track !== "TBD" ? s.track : null;
            const tc = track ? pillColors(track) : null;
            const isSelected = selectedIds?.has(s.id);
            return (
              <li key={s.id} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onSessionClick}
                  className="group flex min-w-0 flex-1 items-start gap-3 rounded-xl border border-transparent px-3 py-2.5 text-left transition-colors hover:border-line hover:bg-white/[0.04]"
                >
                  <span className="w-11 shrink-0 font-mono text-xs text-ink-dim">
                    {formatTime(s.startsAt)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-ink">
                      {s.title === "TBA" ? "To be announced" : s.title}
                    </span>
                    <span className="mt-0.5 flex items-center gap-2">
                      <span className="font-mono text-xs text-ink-faint">
                        {DAY_LABEL[s.day]?.short ?? s.day}
                      </span>
                      {track && tc && (
                        <span
                          className="rounded-full px-1.5 py-0.5 font-mono text-[10px] lowercase tracking-tight"
                          style={{ backgroundColor: tc.bg, border: `1px solid ${tc.border}`, color: tc.fg }}
                        >
                          {track}
                        </span>
                      )}
                    </span>
                  </span>
                  <span className="shrink-0 text-ink-faint opacity-0 transition-opacity group-hover:opacity-100">
                    →
                  </span>
                </button>
                {onToggle && (
                  <button
                    type="button"
                    onClick={() => onToggle(s.id)}
                    title={isSelected ? "Remove from agenda" : "Add to agenda"}
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border text-xs transition-colors ${
                      isSelected
                        ? "border-white/30 bg-white/10 text-ink"
                        : "border-line text-ink-faint hover:border-white/40 hover:text-ink"
                    }`}
                  >
                    {isSelected ? "✓" : "+"}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
