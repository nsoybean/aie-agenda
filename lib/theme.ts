// Deterministic color helpers for topic pills + track tags.
// Known tracks/topics get hand-picked hues that echo the official site's tags;
// everything else falls back to a stable hash → hue.

function hashString(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const KNOWN_HUE: Record<string, number> = {
  // tracks
  software: 217,
  design: 28,
  "physical ai": 172,
  robotics: 172,
  leadership: 268,
  // common topics
  agents: 0,
  "coding agents": 8,
  tooling: 142,
  infrastructure: 262,
  evals: 200,
  "main stage": 48,
  keynote: 48,
  government: 95,
};

export function hueFor(name: string): number {
  const key = name.trim().toLowerCase();
  if (key in KNOWN_HUE) return KNOWN_HUE[key];
  return hashString(key) % 360;
}

export interface PillColors {
  bg: string;
  border: string;
  fg: string;
}

/** Pill colors for use on a dark/black surface. */
export function pillColors(name: string): PillColors {
  const h = hueFor(name);
  return {
    bg: `hsla(${h}, 65%, 55%, 0.14)`,
    border: `hsla(${h}, 60%, 62%, 0.32)`,
    fg: `hsl(${h}, 78%, 78%)`,
  };
}

/** Solid-ish accent for sparklines / glows. */
export function accentFor(name: string): string {
  return `hsl(${hueFor(name)}, 72%, 66%)`;
}

export const FORMAT_LABEL: Record<string, string> = {
  talk: "Talk",
  workshop: "Workshop",
  leadership: "Leadership",
  break: "Break",
};
