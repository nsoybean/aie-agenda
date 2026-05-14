"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  conflictIdSet,
  DAY_LABEL,
  formatTime,
  groupByDay,
  speakerLine,
} from "@/lib/api";
import { accentFor, pillColors } from "@/lib/theme";
import { cardPath, plannerPath, sanitizeName, sanitizeX, sanitizeLinkedIn } from "@/lib/state";
import { EVENT_NAME } from "@/lib/site";
import type { Session, SessionFormat, TopicCount } from "@/lib/types";
import HeroCard from "./HeroCard";
import SessionDetailPanel from "./SessionDetailPanel";
import ContentGraph from "./ContentGraph";
import TimelineView from "./TimelineView";

type FormatFilter = "all" | SessionFormat;

const FORMAT_FILTERS: { key: FormatFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "talk", label: "Talks" },
  { key: "workshop", label: "Workshops" },
  { key: "leadership", label: "Leadership" },
];

export default function Planner({
  sessions,
  topics,
  initialName,
  initialIds,
  initialX = "",
  initialLinkedIn = "",
}: {
  sessions: Session[];
  topics: TopicCount[];
  initialName: string;
  initialIds: string[];
  initialX?: string;
  initialLinkedIn?: string;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [ids, setIds] = useState<string[]>(initialIds);
  const [xHandle, setXHandle] = useState(initialX);
  const [linkedin, setLinkedIn] = useState(initialLinkedIn);
  const [format, setFormat] = useState<FormatFilter>("all");
  const [topic, setTopic] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [detail, setDetail] = useState<Session | null>(null);
  const [graphOpen, setGraphOpen] = useState(false);
  const [view, setView] = useState<"list" | "timeline">("list");

  const allIds = useMemo(() => sessions.map((s) => s.id), [sessions]);
  const byId = useMemo(() => new Map(sessions.map((s) => [s.id, s])), [sessions]);
  const idSet = useMemo(() => new Set(ids), [ids]);
  const selected = useMemo(
    () =>
      ids
        .map((id) => byId.get(id))
        .filter((s): s is Session => Boolean(s))
        .sort((a, b) => a.startsAt.localeCompare(b.startsAt)),
    [ids, byId],
  );
  const conflicts = useMemo(() => conflictIdSet(selected), [selected]);
  const cleanName = sanitizeName(name);
  const cleanX = sanitizeX(xHandle);
  const cleanLinkedIn = sanitizeLinkedIn(linkedin);

  // keep the URL in sync (debounced) so a refresh / bookmark restores the agenda
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const t = setTimeout(() => {
      router.replace(
        plannerPath({ name: cleanName, ids, ...(cleanX && { x: cleanX }), ...(cleanLinkedIn && { linkedin: cleanLinkedIn }) }, allIds),
        { scroll: false },
      );
    }, 350);
    return () => clearTimeout(t);
  }, [cleanName, ids, cleanX, cleanLinkedIn, router]);

  function toggle(id: string) {
    setIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }
  function clearAll() {
    setIds([]);
  }

  const ql = q.trim().toLowerCase();
  const filtered = useMemo(
    () =>
      sessions.filter((s) => {
        if (format !== "all" && s.format !== format) return false;
        if (topic && !(s.topics ?? []).some((t) => t.trim().toLowerCase() === topic.trim().toLowerCase()))
          return false;
        if (ql) {
          const hay = (
            s.title +
            " " +
            (s.description ?? "") +
            " " +
            s.speakers.map((sp) => `${sp.name} ${sp.company ?? ""}`).join(" ") +
            " " +
            (s.track ?? "") +
            " " +
            (s.topics ?? []).join(" ")
          ).toLowerCase();
          if (!hay.includes(ql)) return false;
        }
        return true;
      }),
    [sessions, format, topic, ql],
  );
  const groups = groupByDay(filtered);
  const total = ids.length;
  const cardHref = cardPath({ name: cleanName, ids, ...(cleanX && { x: cleanX }), ...(cleanLinkedIn && { linkedin: cleanLinkedIn }) }, allIds);

  return (
    <div className="mx-auto w-full max-w-6xl px-5 pb-28 pt-8 sm:pt-12 lg:pb-12">
      {/* header */}
      <header className="flex flex-col gap-3">
        <div className="label text-[11px] text-ink-faint">{EVENT_NAME} · 15–17 May 2026</div>
        <h1 className="serif text-4xl font-semibold leading-[1.05] text-ink sm:text-5xl">
          Build <span className="serif-italic font-normal">your</span> agenda
        </h1>
        <p className="max-w-xl text-ink-dim">
          Pick the talks, workshops and leadership sessions you care about across the three days. You’ll
          get a shareable card — and a link you can bookmark, since the whole thing lives in the URL.
        </p>
      </header>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(320px,380px)]">
        {/* left: filters + list */}
        <div className="order-2 lg:order-1">
          {/* filters */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-1.5">
              {FORMAT_FILTERS.map((f) => (
                <Chip key={f.key} active={format === f.key} onClick={() => setFormat(f.key)}>
                  {f.label}
                </Chip>
              ))}
            </div>
            {topics.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <Chip active={topic === null} onClick={() => setTopic(null)}>
                  any topic
                </Chip>
                {topics.map(({ topic: t, count }) => (
                  <Chip
                    key={t}
                    active={topic === t}
                    onClick={() => setTopic(topic === t ? null : t)}
                    tint={t}
                    count={count}
                  >
                    {t}
                  </Chip>
                ))}
                <div className="mt-2 flex w-full items-center gap-1.5 sm:mt-0 sm:ml-auto sm:w-auto">
                  {/* view toggle */}
                  <div className="flex items-center rounded-full border border-line p-0.5">
                    <button
                      type="button"
                      onClick={() => setView("list")}
                      className={`rounded-full px-2.5 py-0.5 font-mono text-xs lowercase tracking-tight transition-colors ${
                        view === "list" ? "bg-white text-black" : "text-ink-dim hover:text-ink"
                      }`}
                      title="List view"
                    >
                      list
                    </button>
                    <button
                      type="button"
                      onClick={() => setView("timeline")}
                      className={`rounded-full px-2.5 py-0.5 font-mono text-xs lowercase tracking-tight transition-colors ${
                        view === "timeline" ? "bg-white text-black" : "text-ink-dim hover:text-ink"
                      }`}
                      title="Timeline view"
                    >
                      timeline
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setGraphOpen((o) => !o)}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-xs lowercase tracking-tight transition-colors ${
                      graphOpen
                        ? "border-transparent bg-white text-black"
                        : "border-line text-ink-dim hover:border-line-strong hover:text-ink"
                    }`}
                    title="Toggle word cloud"
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="shrink-0">
                      <circle cx="2" cy="6" r="1.5" fill="currentColor" />
                      <circle cx="10" cy="2" r="1.5" fill="currentColor" />
                      <circle cx="10" cy="10" r="1.5" fill="currentColor" />
                      <circle cx="6" cy="6" r="2" fill="currentColor" fillOpacity="0.5" />
                      <line x1="3.5" y1="5.5" x2="8" y2="2.5" stroke="currentColor" strokeWidth="1" />
                      <line x1="3.5" y1="6.5" x2="8" y2="9.5" stroke="currentColor" strokeWidth="1" />
                      <line x1="4" y1="6" x2="8" y2="6" stroke="currentColor" strokeWidth="1" />
                    </svg>
                    explore
                  </button>
                </div>
              </div>
            )}
            {graphOpen && (
              <div className="rounded-xl border border-line bg-surface-1 p-4 overflow-hidden">
                <ContentGraph
                  sessions={sessions}
                  onSearch={(term) => { setQ(term); if (term) setTopic(null); }}
                />
              </div>
            )}
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search talks, speakers, companies…"
              className="w-full rounded-xl border border-line bg-surface-1 px-4 py-2.5 text-sm text-ink outline-none placeholder:text-ink-faint focus:border-line-strong"
            />
          </div>

          {/* list / timeline */}
          <div className="mt-6">
            {view === "timeline" ? (
              <TimelineView
                sessions={filtered}
                selectedIds={idSet}
                conflictIds={conflicts}
                onToggle={toggle}
                onDetail={setDetail}
              />
            ) : (
              <div className="space-y-8">
                {groups.length === 0 && (
                  <p className="rounded-xl border border-line bg-surface-1 px-4 py-8 text-center text-ink-dim">
                    Nothing matches those filters.
                  </p>
                )}
                {groups.map(({ day, sessions: daySessions }) => (
                  <section key={day}>
                    <div className="mb-3 flex items-center gap-3">
                      <h3 className="label text-sm text-ink-dim">{DAY_LABEL[day]?.short ?? day}</h3>
                      <span className="font-mono text-xs text-ink-faint">{daySessions.length}</span>
                      <div className="h-px flex-1 bg-line" />
                    </div>
                    <ul className="space-y-1.5">
                      {daySessions.map((s) => (
                        <PlannerRow
                          key={s.id}
                          session={s}
                          selected={idSet.has(s.id)}
                          conflicting={idSet.has(s.id) && conflicts.has(s.id)}
                          onToggle={() => toggle(s.id)}
                          onDetail={() => setDetail(s)}
                        />
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* right: preview + name + cta */}
        <aside className="order-1 mx-auto w-full max-w-sm lg:order-2 lg:mx-0 lg:max-w-none lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-2xl border border-line-strong bg-surface-1 p-4 sm:p-5">
            <div className="hidden lg:block">
              <div className="label text-[10px] text-ink-faint">Your shareable card</div>
              <div className="mt-3 overflow-hidden rounded-lg shadow-[0_12px_40px_rgba(0,0,0,0.5)]">
                <HeroCard name={cleanName} sessions={selected} footer="ai.engineer/singapore" xHandle={cleanX} linkedin={cleanLinkedIn} />
              </div>
            </div>

            <label className="block lg:mt-4">
              <span className="label text-[10px] text-ink-faint">Your name or handle</span>
              <input
                value={name}
                maxLength={48}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Bin"
                className="mt-1.5 w-full rounded-xl border border-line bg-surface-2 px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-faint focus:border-line-strong"
              />
            </label>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <label className="block">
                <span className="label text-[10px] text-ink-faint">X / Twitter</span>
                <div className="relative mt-1.5">
                  <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-ink-faint">@</span>
                  <input
                    value={xHandle}
                    maxLength={15}
                    onChange={(e) => setXHandle(sanitizeX(e.target.value))}
                    placeholder="handle"
                    className="w-full rounded-xl border border-line bg-surface-2 py-2 pl-6 pr-3 text-sm text-ink outline-none placeholder:text-ink-faint focus:border-line-strong"
                  />
                </div>
              </label>
              <label className="block">
                <span className="label text-[10px] text-ink-faint">LinkedIn</span>
                <div className="relative mt-1.5">
                  <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center font-mono text-[10px] text-ink-faint">in/</span>
                  <input
                    value={linkedin}
                    maxLength={60}
                    onChange={(e) => setLinkedIn(sanitizeLinkedIn(e.target.value))}
                    placeholder="username"
                    className="w-full rounded-xl border border-line bg-surface-2 py-2 pl-7 pr-3 text-sm text-ink outline-none placeholder:text-ink-faint focus:border-line-strong"
                  />
                </div>
              </label>
            </div>

            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-ink-dim">
                <span className="font-mono text-ink">{total}</span> session{total === 1 ? "" : "s"}
                {conflicts.size > 0 && (
                  <span className="ml-2 text-amber-300/80">· {conflicts.size} overlap</span>
                )}
              </span>
              {total > 0 && (
                <button
                  type="button"
                  onClick={clearAll}
                  className="text-ink-faint underline-offset-2 hover:text-ink-dim hover:underline"
                >
                  clear
                </button>
              )}
            </div>

            <Link
              href={total > 0 ? cardHref : "#"}
              aria-disabled={total === 0}
              className={`mt-3 block rounded-full px-5 py-2.5 text-center text-sm font-medium transition ${
                total > 0
                  ? "bg-white text-black hover:opacity-90"
                  : "pointer-events-none cursor-not-allowed border border-line text-ink-faint"
              }`}
            >
              Get my shareable card →
            </Link>
          </div>
        </aside>
      </div>

      {/* mobile sticky CTA */}
      {total > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface-0/95 px-4 py-3 backdrop-blur lg:hidden">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
            <span className="text-sm text-ink-dim">
              <span className="font-mono text-ink">{total}</span> selected
            </span>
            <Link
              href={cardHref}
              className="rounded-full bg-white px-5 py-2 text-sm font-medium text-black"
            >
              Get my card →
            </Link>
          </div>
        </div>
      )}

      <SessionDetailPanel
        session={detail}
        allSessions={sessions}
        onClose={() => setDetail(null)}
        selectedIds={idSet}
        onToggle={toggle}
      />
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
  tint,
  count,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  tint?: string;
  count?: number;
}) {
  const c = tint ? pillColors(tint) : null;
  const dot = tint ? accentFor(tint) : null;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-xs lowercase tracking-tight transition-colors ${
        active
          ? "border-transparent bg-white text-black"
          : "border-line text-ink-dim hover:border-line-strong hover:text-ink"
      }`}
      style={!active && c ? { color: c.fg, borderColor: c.border } : undefined}
    >
      {dot && !active && (
        <span
          className="h-1.5 w-1.5 shrink-0 rounded-full"
          style={{ background: dot }}
        />
      )}
      {children}
      {count != null && (
        <span className={active ? "text-black/50" : "text-ink-faint"}>
          {count}
        </span>
      )}
    </button>
  );
}

function PlannerRow({
  session: s,
  selected,
  conflicting,
  onToggle,
  onDetail,
}: {
  session: Session;
  selected: boolean;
  conflicting: boolean;
  onToggle: () => void;
  onDetail: () => void;
}) {
  const track = s.track && s.track !== "TBD" ? s.track : null;
  const tc = track ? pillColors(track) : null;
  return (
    <li
      className={`group flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors sm:gap-4 sm:px-4 ${
        selected ? "border-line-strong bg-white/[0.05]" : "border-transparent hover:border-line hover:bg-white/[0.025]"
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={selected}
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-xs transition-colors ${
          selected
            ? "border-white bg-white text-black"
            : "border-line-strong text-transparent hover:border-white"
        }`}
        title={selected ? "Remove from agenda" : "Add to agenda"}
      >
        ✓
      </button>
      <span className="w-[5.5rem] shrink-0 font-mono text-xs text-ink-dim sm:text-sm">
        {formatTime(s.startsAt)}
        <span className="text-ink-faint">–{formatTime(s.endsAt)}</span>
      </span>
      <button type="button" onClick={onDetail} className="min-w-0 flex-1 text-left">
        <span className="flex min-w-0 items-center gap-2">
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
          <span className="mt-0.5 block min-w-0 truncate text-xs text-ink-faint">{speakerLine(s)}</span>
        )}
      </button>
      {track && tc && (
        <span
          className="hidden shrink-0 rounded-full px-2 py-0.5 font-mono text-[10px] lowercase tracking-tight sm:inline"
          style={{ backgroundColor: tc.bg, border: `1px solid ${tc.border}`, color: tc.fg }}
        >
          {track}
        </span>
      )}
    </li>
  );
}
