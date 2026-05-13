"use client";

import { useEffect } from "react";
import { DAY_LABEL, formatTimeRange, googleCalUrl } from "@/lib/api";
import { FORMAT_LABEL, pillColors } from "@/lib/theme";
import type { Session } from "@/lib/types";
import SpeakerAvatar from "./SpeakerAvatar";
import TopicPill from "./TopicPill";

export default function SessionDetailPanel({
  session,
  onClose,
}: {
  session: Session | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!session) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [session, onClose]);

  if (!session) return null;
  const s = session;
  const track = s.track && s.track !== "TBD" ? s.track : null;
  const tc = track ? pillColors(track) : null;
  const link = s.links?.canonical || s.links?.source || s.sourceUrl || undefined;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
      />
      <div className="scroll-thin relative z-10 flex h-full w-full max-w-md flex-col overflow-y-auto border-l border-line bg-surface-1 shadow-2xl max-sm:mt-auto max-sm:h-auto max-sm:max-h-[88vh] max-sm:max-w-none max-sm:rounded-t-2xl max-sm:border-l-0 max-sm:border-t">
        <div className="sticky top-0 flex items-center justify-between border-b border-line bg-surface-1/95 px-5 py-3 backdrop-blur">
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-ink-faint">
            {FORMAT_LABEL[s.format] ?? s.format}
            {s.status === "tentative" ? " · tentative" : ""}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-ink-dim transition-colors hover:bg-white/10 hover:text-ink"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-5 px-5 py-5">
          <div>
            <h2 className="text-xl font-bold leading-snug text-ink">
              {s.title === "TBA" ? "To be announced" : s.title}
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-sm text-ink-dim">
              <span>{DAY_LABEL[s.day]?.short ?? s.day}</span>
              <span className="text-ink-faint">·</span>
              <span>{formatTimeRange(s)}</span>
              <span className="text-ink-faint">·</span>
              <span>{s.durationMinutes} min</span>
            </div>
            {(s.venue?.name || track) && (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {s.venue?.name && (
                  <span className="rounded-full border border-line bg-white/[0.04] px-2 py-0.5 text-xs text-ink-dim">
                    {[s.venue.name, s.venue.room].filter(Boolean).join(" · ")}
                  </span>
                )}
                {track && tc && (
                  <span
                    className="rounded-full px-2 py-0.5 font-mono text-[11px] lowercase tracking-tight"
                    style={{ backgroundColor: tc.bg, border: `1px solid ${tc.border}`, color: tc.fg }}
                  >
                    {track}
                  </span>
                )}
              </div>
            )}
          </div>

          {s.topics?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {s.topics
                .filter((t) => t.toLowerCase() !== "tba")
                .map((t) => (
                  <TopicPill key={t} topic={t} size="sm" />
                ))}
            </div>
          )}

          {s.description && (
            <p className="whitespace-pre-line text-sm leading-relaxed text-ink-dim">{s.description}</p>
          )}

          {s.speakers?.length > 0 && (
            <div className="flex flex-col gap-3">
              <div className="font-mono text-xs uppercase tracking-[0.2em] text-ink-faint">
                {s.speakers.length > 1 ? "Speakers" : "Speaker"}
              </div>
              {s.speakers.map((sp, i) => (
                <div key={i} className="flex gap-3">
                  <SpeakerAvatar name={sp.name} apiImageUrl={sp.imageUrl} size={40} />
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-ink">{sp.name}</div>
                    {(sp.title || sp.company) && (
                      <div className="truncate text-xs text-ink-faint">
                        {[sp.title, sp.company].filter(Boolean).join(" · ")}
                      </div>
                    )}
                    {sp.bio && <p className="mt-1 text-xs leading-relaxed text-ink-dim">{sp.bio}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-1 flex flex-wrap gap-2">
            <a
              href={googleCalUrl(s)}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-line bg-white/[0.04] px-3 py-2 text-sm text-ink transition-colors hover:bg-white/[0.08]"
            >
              Add to Google Calendar
            </a>
            {link && (
              <a
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-line px-3 py-2 text-sm text-ink-dim transition-colors hover:bg-white/[0.05] hover:text-ink"
              >
                Source ↗
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
