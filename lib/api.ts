import type {
  ScheduleResponse,
  Session,
  SessionFormat,
  TopicCount,
} from "./types";

const API_BASE = "https://aie.65labs.org/api/v1";

export const EVENT_TZ = "Asia/Singapore";

/** Days of the conference, in order. */
export const EVENT_DAYS = ["2026-05-15", "2026-05-16", "2026-05-17"] as const;

export const DAY_LABEL: Record<string, { short: string; long: string }> = {
  "2026-05-15": { short: "FRI 15 MAY", long: "Friday 15 May · Workshops & Leadership" },
  "2026-05-16": { short: "SAT 16 MAY", long: "Saturday 16 May · Talks" },
  "2026-05-17": { short: "SUN 17 MAY", long: "Sunday 17 May · Talks" },
};

/** Formats a user can add to their agenda (everything except breaks). */
export const SELECTABLE_FORMATS: SessionFormat[] = ["talk", "workshop", "leadership"];

export async function getSchedule(): Promise<ScheduleResponse> {
  const res = await fetch(`${API_BASE}/schedule`, {
    next: { revalidate: 3600 }, // 1 hour — schedule is mostly locked pre-event
  });
  if (!res.ok) throw new Error(`Schedule fetch failed: ${res.status}`);
  const data = (await res.json()) as ScheduleResponse;
  return enrichSchedule(data);
}

/**
 * The API embeds speaker data per-session, but different source scrapers
 * include different fields (e.g. leadership-track-planner strips bio/title).
 * Scan all sessions, keep the richest record per speaker name, and backfill
 * null fields on every session so every panel shows full details.
 */
function enrichSchedule(schedule: ScheduleResponse): ScheduleResponse {
  type SP = ScheduleResponse["sessions"][number]["speakers"][number];
  const richness = (sp: SP) =>
    (sp.bio ? 4 : 0) + (sp.title ? 2 : 0) + (sp.imageUrl ? 1 : 0) + (sp.company ? 1 : 0);

  const best = new Map<string, SP>();
  for (const s of schedule.sessions) {
    for (const sp of s.speakers ?? []) {
      const existing = best.get(sp.name);
      if (!existing || richness(sp) > richness(existing)) best.set(sp.name, sp);
    }
  }

  return {
    ...schedule,
    sessions: schedule.sessions.map((s) => ({
      ...s,
      speakers: (s.speakers ?? []).map((sp) => {
        const r = best.get(sp.name);
        return {
          ...sp,
          title: sp.title ?? r?.title ?? null,
          bio: sp.bio ?? r?.bio ?? null,
          imageUrl: sp.imageUrl ?? r?.imageUrl ?? null,
          company: sp.company ?? r?.company ?? null,
        };
      }),
    })),
  };
}

/** All sessions a user is allowed to pick (drops breaks), sorted by start time. */
export function selectableSessions(schedule: ScheduleResponse): Session[] {
  return schedule.sessions
    .filter((s) => SELECTABLE_FORMATS.includes(s.format))
    .slice()
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

export function resolveSessions(schedule: ScheduleResponse, ids: string[]): Session[] {
  const byId = new Map(schedule.sessions.map((s) => [s.id, s]));
  const seen = new Set<string>();
  const out: Session[] = [];
  for (const id of ids) {
    if (seen.has(id)) continue;
    const s = byId.get(id);
    if (s) {
      out.push(s);
      seen.add(id);
    }
  }
  return out.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

// Tags that duplicate format/venue/track fields — not useful as content filters.
const SKIP_TOPICS = new Set([
  "break",
  "tba",
  "main stage",
  "workshop",
  "leadership",
  "keynote", // already surfaced via format/track context
]);

export function aggregateTopics(sessions: Session[]): TopicCount[] {
  const counts = new Map<string, number>();
  for (const s of sessions) {
    for (const t of s.topics ?? []) {
      const norm = t.trim().toLowerCase();
      if (!norm || SKIP_TOPICS.has(norm)) continue;
      counts.set(t.trim(), (counts.get(t.trim()) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([topic, count]) => ({ topic, count }))
    .sort((a, b) => b.count - a.count || a.topic.localeCompare(b.topic));
}

export function groupByDay(sessions: Session[]): { day: string; sessions: Session[] }[] {
  const map = new Map<string, Session[]>();
  for (const s of sessions) {
    if (!map.has(s.day)) map.set(s.day, []);
    map.get(s.day)!.push(s);
  }
  return EVENT_DAYS.filter((d) => map.has(d)).map((d) => ({
    day: d,
    sessions: map.get(d)!.slice().sort((a, b) => a.startsAt.localeCompare(b.startsAt)),
  }));
}

export function countByDay(sessions: Session[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const d of EVENT_DAYS) out[d] = 0;
  for (const s of sessions) out[s.day] = (out[s.day] ?? 0) + 1;
  return out;
}

export interface ConflictPair {
  a: Session;
  b: Session;
}

/** Returns pairs of selected sessions whose time ranges overlap. */
export function detectConflicts(sessions: Session[]): ConflictPair[] {
  const sorted = sessions.slice().sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const pairs: ConflictPair[] = [];
  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      const a = sorted[i];
      const b = sorted[j];
      if (a.day !== b.day) continue;
      // overlap if a.start < b.end && b.start < a.end
      if (a.startsAt < b.endsAt && b.startsAt < a.endsAt) pairs.push({ a, b });
    }
  }
  return pairs;
}

export function conflictIdSet(sessions: Session[]): Set<string> {
  const ids = new Set<string>();
  for (const { a, b } of detectConflicts(sessions)) {
    ids.add(a.id);
    ids.add(b.id);
  }
  return ids;
}

// ---- Time formatting (always in Asia/Singapore) ----

const TIME_FMT = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: EVENT_TZ,
});

export function formatTime(iso: string): string {
  return TIME_FMT.format(new Date(iso));
}

export function formatTimeRange(s: Session): string {
  return `${formatTime(s.startsAt)}–${formatTime(s.endsAt)}`;
}

export function speakerLine(s: Session): string {
  if (!s.speakers?.length) return "";
  return s.speakers
    .map((sp) => (sp.company && sp.company !== sp.name ? `${sp.name} · ${sp.company}` : sp.name))
    .join(", ");
}

// ---- Calendar export ----

function icsDate(iso: string): string {
  // ICS UTC format: YYYYMMDDTHHMMSSZ
  return new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function icsEscape(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

export function buildIcs(sessions: Session[], calName = "My AI Engineer Singapore 2026"): string {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//aie-agenda//EN",
    "CALSCALE:GREGORIAN",
    `X-WR-CALNAME:${icsEscape(calName)}`,
  ];
  const stamp = icsDate(new Date().toISOString());
  for (const s of sessions) {
    const loc = [s.venue?.name, s.venue?.room].filter(Boolean).join(", ");
    const desc = [s.description, speakerLine(s) && `Speakers: ${speakerLine(s)}`, s.links?.canonical]
      .filter(Boolean)
      .join("\n\n");
    lines.push(
      "BEGIN:VEVENT",
      `UID:${s.id}@aie-agenda`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${icsDate(s.startsAt)}`,
      `DTEND:${icsDate(s.endsAt)}`,
      `SUMMARY:${icsEscape(s.title)}`,
      loc ? `LOCATION:${icsEscape(loc)}` : "",
      desc ? `DESCRIPTION:${icsEscape(desc)}` : "",
      s.links?.canonical ? `URL:${s.links.canonical}` : "",
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");
  return lines.filter(Boolean).join("\r\n");
}

export function googleCalUrl(s: Session): string {
  const dates = `${icsDate(s.startsAt)}/${icsDate(s.endsAt)}`;
  const loc = [s.venue?.name, s.venue?.room].filter(Boolean).join(", ");
  const details = [s.description, speakerLine(s) && `Speakers: ${speakerLine(s)}`, s.links?.canonical]
    .filter(Boolean)
    .join("\n\n");
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: s.title,
    dates,
    ...(loc ? { location: loc } : {}),
    ...(details ? { details } : {}),
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
