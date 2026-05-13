export type SessionFormat = "talk" | "workshop" | "leadership" | "break";

export interface SpeakerRef {
  name: string;
  company: string | null;
  title: string | null;
  bio: string | null;
  imageUrl: string | null;
}

export interface Session {
  id: string;
  sourceId: string | null;
  title: string;
  description: string | null;
  format: SessionFormat;
  track: string | null;
  topics: string[];
  status: string;
  day: string; // YYYY-MM-DD
  startsAt: string; // ISO with +08:00
  endsAt: string;
  timezone: string;
  durationMinutes: number;
  venue: { name: string | null; room: string | null };
  speakers: SpeakerRef[];
  links: { canonical?: string | null; source?: string | null };
  sourceUrl: string | null;
}

export interface EventMeta {
  name: string;
  summary: string;
  startsOn: string;
  endsOn: string;
  timezone: string;
  venue: { name: string | null; addressLocality?: string | null };
}

export interface ScheduleResponse {
  event: EventMeta;
  sessions: Session[];
}

export interface TopicCount {
  topic: string;
  count: number;
}
