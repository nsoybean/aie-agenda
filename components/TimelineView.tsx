"use client";

import { DAY_LABEL, groupByDay, speakerLine } from "@/lib/api";
import { pillColors } from "@/lib/theme";
import type { Session } from "@/lib/types";

const BASE_PX_PER_MIN = 2.4; // height of one minute in pixels
const DENSE_TALK_PX_PER_MIN = 3.8;
const TIME_COL_W = 44;   // left gutter width (px)
const COL_GAP = 4;       // gap between parallel columns (px)
const MIN_SESSION_COL_W = 112;
const MIN_DENSE_SESSION_H = 54;
const TIMELINE_X_INSET = 8;
const TIMELINE_Y_INSET = 12;

type TimelineTick = {
  minute: number;
  label: boolean;
  strength: "major" | "minor" | "event";
};

/** Convert an ISO time to minutes since midnight (SGT). */
function toMinutes(iso: string): number {
  const d = new Date(iso);
  // Use the UTC offset embedded in the ISO string (+08:00)
  const utcMin = d.getUTCHours() * 60 + d.getUTCMinutes();
  return (utcMin + 8 * 60) % (24 * 60);
}

/** Assign column indices so time- or height-overlapping sessions don't stack. */
function assignColumns(
  sessions: Session[],
  minVisualDurationMinutes: number,
): { session: Session; col: number; totalCols: number }[] {
  const sorted = [...sessions].sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const out: { session: Session; col: number; totalCols: number }[] = [];
  let cluster: { session: Session; start: number; visualEnd: number }[] = [];
  let clusterEnd = -Infinity;

  function flushCluster() {
    if (cluster.length === 0) return;

    const colEnds: number[] = [];
    const assignments = cluster.map(({ session, start, visualEnd }) => {
      const col = colEnds.findIndex((end) => end <= start);
      const assigned = col === -1 ? colEnds.length : col;
      colEnds[assigned] = visualEnd;
      return { session, col: assigned };
    });
    const totalCols = Math.max(1, colEnds.length);
    out.push(...assignments.map((a) => ({ ...a, totalCols })));

    cluster = [];
    clusterEnd = -Infinity;
  }

  for (const session of sorted) {
    const start = toMinutes(session.startsAt);
    const visualEnd = start + Math.max(session.durationMinutes, minVisualDurationMinutes);
    if (cluster.length > 0 && start >= clusterEnd) flushCluster();
    cluster.push({ session, start, visualEnd });
    clusterEnd = Math.max(clusterEnd, visualEnd);
  }

  flushCluster();
  return out;
}

function DayTimeline({
  day,
  sessions,
  selectedIds,
  conflictIds,
  onToggle,
  onDetail,
}: {
  day: string;
  sessions: Session[];
  selectedIds: Set<string>;
  conflictIds: Set<string>;
  onToggle: (id: string) => void;
  onDetail: (s: Session) => void;
}) {
  if (sessions.length === 0) return null;

  const starts = sessions.map((s) => toMinutes(s.startsAt));
  const ends = sessions.map((s) => toMinutes(s.endsAt));
  const shortestDuration = Math.min(...sessions.map((s) => s.durationMinutes));
  const denseTalkDay = shortestDuration <= 20;
  const pxPerMin = denseTalkDay ? DENSE_TALK_PX_PER_MIN : BASE_PX_PER_MIN;
  const minMin = Math.min(...starts);
  const maxMin = Math.max(...ends);

  // Round gutter start/end to nearest 30-min boundary
  const gutterStart = Math.floor(minMin / 30) * 30;
  const gutterEnd = Math.ceil(maxMin / 30) * 30;
  const totalHeight = (gutterEnd - gutterStart) * pxPerMin;

  const sessionBoundaries = new Set([...starts, ...ends]);
  const tickMinutes = new Set<number>();
  for (let m = gutterStart; m <= gutterEnd; m += denseTalkDay ? 15 : 30) tickMinutes.add(m);
  sessionBoundaries.forEach((m) => tickMinutes.add(m));

  const ticks: TimelineTick[] = [...tickMinutes].sort((a, b) => a - b).map((minute) => {
    const isLabel = minute % 30 === 0;
    const strength = minute % 60 === 0 ? "major" : minute % 30 === 0 ? "minor" : "event";
    return { minute, label: isLabel, strength };
  });

  const minVisualDurationMinutes = (denseTalkDay ? MIN_DENSE_SESSION_H : 20) / pxPerMin;
  const assigned = assignColumns(sessions, minVisualDurationMinutes);
  const totalCols = Math.max(...assigned.map((a) => a.totalCols));
  const minTimelineWidth =
    TIME_COL_W + totalCols * MIN_SESSION_COL_W + (totalCols - 1) * COL_GAP + TIMELINE_X_INSET * 2;

  return (
    <section>
      <div className="mb-3 flex items-center gap-3">
        <h3 className="label text-sm text-ink-dim">{DAY_LABEL[day]?.short ?? day}</h3>
        <span className="font-mono text-xs text-ink-faint">{sessions.length}</span>
        <div className="h-px flex-1 bg-line" />
      </div>

      <div className="relative overflow-x-auto overflow-y-clip rounded-xl border border-line bg-surface-1">
        <div
          className="relative"
          style={{ height: totalHeight + TIMELINE_Y_INSET * 2, minWidth: minTimelineWidth }}
        >
          {/* Time guide lines */}
          {ticks.map(({ minute, label, strength }) => {
            const top = (minute - gutterStart) * pxPerMin + TIMELINE_Y_INSET;
            const h = Math.floor(minute / 60).toString().padStart(2, "0");
            const min = (minute % 60).toString().padStart(2, "0");
            const borderTop =
              strength === "major"
                ? "1px solid rgba(255,255,255,0.16)"
                : strength === "minor"
                  ? "1px dashed rgba(255,255,255,0.1)"
                  : "1px dashed rgba(255,255,255,0.07)";
            return (
              <div key={minute} className="absolute left-0 right-0 flex items-start" style={{ top }}>
                <span
                  className="shrink-0 select-none pr-2 text-right font-mono text-[10px] leading-none text-ink-faint"
                  style={{ width: TIME_COL_W }}
                >
                  {label ? `${h}:${min}` : null}
                </span>
                <div className="flex-1" style={{ marginRight: TIMELINE_X_INSET }}>
                  <div className="w-full" style={{ borderTop }} />
                </div>
              </div>
            );
          })}

          {/* Session blocks */}
          {assigned.map(({ session: s, col, totalCols }) => {
            const top = (toMinutes(s.startsAt) - gutterStart) * pxPerMin + TIMELINE_Y_INSET;
            const height = Math.max(s.durationMinutes * pxPerMin - COL_GAP, denseTalkDay ? MIN_DENSE_SESSION_H : 20);
            const track = s.track && s.track !== "TBD" ? s.track : null;
            const tc = track ? pillColors(track) : null;
            const isSel = selectedIds.has(s.id);
            const isConflict = conflictIds.has(s.id);

            return (
              <SessionBlock
                key={s.id}
                session={s}
                top={top}
                height={height}
                col={col}
                totalCols={totalCols}
                selected={isSel}
                conflicting={isConflict}
                trackColor={tc}
                onToggle={onToggle}
                onDetail={onDetail}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}

function SessionBlock({
  session: s,
  top,
  height,
  col,
  totalCols,
  selected,
  conflicting,
  trackColor,
  onToggle,
  onDetail,
}: {
  session: Session;
  top: number;
  height: number;
  col: number;
  totalCols: number;
  selected: boolean;
  conflicting: boolean;
  trackColor: { bg: string; border: string; fg: string } | null;
  onToggle: (id: string) => void;
  onDetail: (s: Session) => void;
}) {
  const colWidth = `calc((100% - ${TIME_COL_W}px - ${TIMELINE_X_INSET * 2}px - ${
    COL_GAP * (totalCols - 1)
  }px) / ${totalCols})`;
  const left = `calc(${TIME_COL_W + TIMELINE_X_INSET}px + ${col} * ((100% - ${TIME_COL_W}px - ${
    TIMELINE_X_INSET * 2
  }px - ${
    COL_GAP * (totalCols - 1)
  }px) / ${totalCols} + ${COL_GAP}px))`;
  const compactMode = height < 64;

  return (
    <div
      className="absolute flex flex-col overflow-hidden rounded-lg border transition-colors"
      style={{
        top,
        height,
        width: colWidth,
        left,
        borderColor: conflicting
          ? "rgba(252,211,77,0.5)"
          : selected
          ? "rgba(255,255,255,0.3)"
          : trackColor
          ? trackColor.border
          : "rgba(255,255,255,0.12)",
        background: selected
          ? "rgba(255,255,255,0.07)"
          : trackColor
          ? `${trackColor.bg}80`
          : "rgba(255,255,255,0.03)",
      }}
    >
      {/* Checkbox toggle strip */}
      <button
        type="button"
        onClick={() => onToggle(s.id)}
        aria-pressed={selected}
        title={selected ? "Remove from agenda" : "Add to agenda"}
        className="absolute right-1.5 top-1.5 z-10 flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[9px] transition-colors"
        style={{
          borderColor: selected ? "white" : "rgba(255,255,255,0.3)",
          background: selected ? "white" : "transparent",
          color: selected ? "black" : "transparent",
        }}
      >
        ✓
      </button>

      {/* Main content — click to open detail */}
      <button
        type="button"
        onClick={() => onDetail(s)}
        className="flex flex-1 flex-col overflow-hidden p-1.5 pr-6 text-left"
      >
        <span
          className={`${compactMode ? "line-clamp-1" : "line-clamp-2"} text-[11px] font-medium leading-tight text-ink`}
          style={trackColor && !selected ? { color: trackColor.fg } : undefined}
        >
          {s.title === "TBA" ? "TBA" : s.title}
        </span>
        {speakerLine(s) && (
          <span className="mt-0.5 line-clamp-1 text-[9px] leading-tight text-ink-faint">
            {speakerLine(s)}
          </span>
        )}
        {conflicting && (
          <span className="mt-auto shrink-0 font-mono text-[8px] uppercase tracking-wide text-amber-300/90">
            ⚠ clash
          </span>
        )}
      </button>
    </div>
  );
}

export default function TimelineView({
  sessions,
  selectedIds,
  conflictIds,
  onToggle,
  onDetail,
}: {
  sessions: Session[];
  selectedIds: Set<string>;
  conflictIds?: Set<string>;
  onToggle: (id: string) => void;
  onDetail: (s: Session) => void;
}) {
  const groups = groupByDay(sessions);
  return (
    <div className="space-y-8">
      {groups.length === 0 && (
        <p className="rounded-xl border border-line bg-surface-1 px-4 py-8 text-center text-ink-dim">
          Nothing matches those filters.
        </p>
      )}
      {groups.map(({ day, sessions: daySessions }) => (
        <DayTimeline
          key={day}
          day={day}
          sessions={daySessions}
          selectedIds={selectedIds}
          conflictIds={conflictIds ?? new Set()}
          onToggle={onToggle}
          onDetail={onDetail}
        />
      ))}
    </div>
  );
}
