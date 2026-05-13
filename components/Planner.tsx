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
import { cardPath, plannerPath, sanitizeName } from "@/lib/state";
import { EVENT_NAME } from "@/lib/site";
import type { Session, SessionFormat, TopicCount } from "@/lib/types";
import HeroCard from "./HeroCard";
import SessionDetailPanel from "./SessionDetailPanel";

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
}: {
  sessions: Session[];
  topics: TopicCount[];
  initialName: string;
  initialIds: string[];
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [ids, setIds] = useState<string[]>(initialIds);
  const [format, setFormat] = useState<FormatFilter>("all");
  const [topic, setTopic] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [detail, setDetail] = useState<Session | null>(null);

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

  // keep the URL in sync (debounced) so a refresh / bookmark restores the agenda
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const t = setTimeout(() => {
      router.replace(plannerPath({ name: cleanName, ids }), { scroll: false });
    }, 350);
    return () => clearTimeout(t);
  }, [cleanName, ids, router]);

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
  const cardHref = cardPath({ name: cleanName, ids });

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

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(320px,380px)]">
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
              <div className="flex flex-wrap gap-1.5">
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
              </div>
            )}
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search talks, speakers, companies…"
              className="w-full rounded-xl border border-line bg-surface-1 px-4 py-2.5 text-sm text-ink outline-none placeholder:text-ink-faint focus:border-line-strong"
            />
          </div>

          {/* list */}
          <div className="mt-6 space-y-8">
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
        </div>

        {/* right: preview + name + cta */}
        <aside className="order-1 lg:order-2 lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-2xl border border-line-strong bg-surface-1 p-4 sm:p-5">
            <div className="label text-[10px] text-ink-faint">Your shareable card</div>
            <div className="mt-3 overflow-hidden rounded-xl shadow-[0_12px_40px_rgba(0,0,0,0.5)]">
              <HeroCard name={cleanName} sessions={selected} footer="ai.engineer/singapore" />
            </div>

            <label className="mt-4 block">
              <span className="label text-[10px] text-ink-faint">Your name or handle</span>
              <input
                value={name}
                maxLength={48}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Bin"
                className="mt-1.5 w-full rounded-xl border border-line bg-surface-2 px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-faint focus:border-line-strong"
              />
            </label>

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
      <span className="w-[3rem] shrink-0 font-mono text-xs text-ink-dim sm:text-sm">
        {formatTime(s.startsAt)}
      </span>
      <button type="button" onClick={onDetail} className="min-w-0 flex-1 text-left">
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
