"use client";

import { useEffect, useState } from "react";
import { DAY_LABEL, EVENT_DAYS, formatTime, groupByDay, speakerLine } from "@/lib/api";
import { pillColors } from "@/lib/theme";
import type { Session } from "@/lib/types";

/** Current date + epoch-ms timestamp in SGT (UTC+8). */
function getNowSGT(): { date: string; nowMs: number } {
  const nowMs = Date.now();
  const sgtMs = nowMs + 8 * 60 * 60 * 1000;
  const d = new Date(sgtMs);
  const date = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
  return { date, nowMs };
}

export default function SessionList({
  sessions,
  conflictIds,
  onSelect,
  selectedId,
}: {
  sessions: Session[];
  conflictIds?: Set<string>;
  onSelect?: (s: Session) => void;
  selectedId?: string | null;
}) {
  const [now, setNow] = useState<{ date: string; nowMs: number } | null>(null);
  const [collapsedDays, setCollapsedDays] = useState<Set<string>>(new Set());
  const [showPastForToday, setShowPastForToday] = useState(false);

  useEffect(() => {
    const n = getNowSGT();
    setNow(n);
    // Past days start collapsed
    setCollapsedDays(new Set(EVENT_DAYS.filter((d) => d < n.date)));
    const id = setInterval(() => setNow(getNowSGT()), 60_000);
    return () => clearInterval(id);
  }, []);

  function toggleDay(day: string) {
    setCollapsedDays((prev) => {
      const next = new Set(prev);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return next;
    });
  }

  const groups = groupByDay(sessions);

  return (
    <div className="space-y-8">
      {groups.map(({ day, sessions: daySessions }) => {
        const isPastDay = now ? day < now.date : false;
        const isToday = now ? day === now.date : false;
        const isCollapsed = collapsedDays.has(day);

        // Split today's sessions: over = current time strictly past session end time
        let pastSessions: Session[] = [];
        let upcomingSessions: Session[] = daySessions;
        if (isToday && now) {
          pastSessions = daySessions.filter((s) => new Date(s.endsAt).getTime() < now.nowMs);
          upcomingSessions = daySessions.filter((s) => new Date(s.endsAt).getTime() >= now.nowMs);
        }

        const showDayToggle = isPastDay || isToday;

        return (
          <section key={day}>
            <div className={`mb-3 flex items-center gap-3 ${isCollapsed ? "opacity-50" : ""}`}>
              <h3 className="font-mono text-sm tracking-[0.22em] text-ink-dim">
                {DAY_LABEL[day]?.short ?? day}
              </h3>
              <span className="font-mono text-xs text-ink-faint">{daySessions.length}</span>
              <div className="h-px flex-1 bg-line" />
              {showDayToggle && (
                <button
                  type="button"
                  onClick={() => toggleDay(day)}
                  className="font-mono text-[10px] text-ink-faint transition-colors hover:text-ink-dim"
                >
                  {isCollapsed ? "show ▼" : "hide ▲"}
                </button>
              )}
            </div>

            {!isCollapsed && (
              <>
                {isToday && pastSessions.length > 0 && (
                  <>
                    {showPastForToday && (
                      <ul className="mb-2 space-y-1.5 opacity-45">
                        {pastSessions.map((s) => (
                          <SessionRow
                            key={s.id}
                            session={s}
                            conflicting={conflictIds?.has(s.id) ?? false}
                            active={selectedId === s.id}
                            onClick={onSelect ? () => onSelect(s) : undefined}
                          />
                        ))}
                      </ul>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowPastForToday((p) => !p)}
                      className="group mb-4 flex w-full items-center gap-3 py-1 text-ink-faint transition-colors hover:text-ink-dim"
                    >
                      <div className="h-px flex-1 bg-line transition-colors group-hover:bg-line-strong" />
                      <span className="font-mono text-[10px] tracking-wide">
                        {showPastForToday
                          ? "▲ hide past sessions"
                          : `← ${pastSessions.length} past session${pastSessions.length !== 1 ? "s" : ""} →`}
                      </span>
                      <div className="h-px flex-1 bg-line transition-colors group-hover:bg-line-strong" />
                    </button>
                  </>
                )}
                <ul className="space-y-1.5">
                  {(isToday ? upcomingSessions : daySessions).map((s) => (
                    <SessionRow
                      key={s.id}
                      session={s}
                      conflicting={conflictIds?.has(s.id) ?? false}
                      active={selectedId === s.id}
                      onClick={onSelect ? () => onSelect(s) : undefined}
                    />
                  ))}
                </ul>
              </>
            )}
          </section>
        );
      })}
    </div>
  );
}

function SessionRow({
  session: s,
  conflicting,
  active,
  onClick,
}: {
  session: Session;
  conflicting: boolean;
  active: boolean;
  onClick?: () => void;
}) {
  const track = s.track && s.track !== "TBD" ? s.track : null;
  const tc = track ? pillColors(track) : null;
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className={`group flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors sm:gap-4 sm:px-4 ${
          active
            ? "border-line-strong bg-white/[0.06]"
            : "border-transparent hover:border-line hover:bg-white/[0.03]"
        }`}
      >
        <span className="w-[3.2rem] shrink-0 font-mono text-xs text-ink-dim sm:text-sm">
          {formatTime(s.startsAt)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="truncate text-[15px] font-medium text-ink">
              {s.title === "TBA" ? <span className="text-ink-faint">To be announced</span> : s.title}
            </span>
            {conflicting && (
              <span
                title="Overlaps with another session you picked"
                className="shrink-0 font-mono text-[10px] uppercase tracking-wide text-amber-300/90"
              >
                ⚠ clash
              </span>
            )}
          </span>
          {speakerLine(s) && (
            <span className="mt-0.5 block truncate text-xs text-ink-faint">{speakerLine(s)}</span>
          )}
        </span>
        {track && tc && (
          <span
            className="hidden shrink-0 rounded-full px-2 py-0.5 font-mono text-[10px] lowercase tracking-tight sm:inline"
            style={{ backgroundColor: tc.bg, border: `1px solid ${tc.border}`, color: tc.fg }}
          >
            {track}
          </span>
        )}
        <span className="shrink-0 text-ink-faint opacity-0 transition-opacity group-hover:opacity-100">→</span>
      </button>
    </li>
  );
}
