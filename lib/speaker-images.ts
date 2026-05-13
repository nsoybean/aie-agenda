const BASE = "https://www.ai.engineer/singapore/speakers";
const TEAM_BASE = "https://www.ai.engineer/singapore/team";

/**
 * Generate URL candidates for a speaker's headshot, in priority order.
 * The main site hosts images at /speakers/{slug}.{ext} but the API returns
 * imageUrl: null for everyone. We try:
 *  1. full-name slug (e.g. "jacky-mok") with .jpg
 *  2. first-name-only slug (e.g. "jacky") — many speakers only have this
 *  3. The API-provided imageUrl as a final fallback
 *
 * The caller should try each URL in order, skipping to the next on 404/error.
 */
export function getSpeakerImageCandidates(
  name: string,
  apiImageUrl?: string | null,
): string[] {
  const candidates: string[] = [];

  const fullSlug = toSlug(name);
  const parts = fullSlug.split("-");
  const firstName = parts[0];
  // e.g. "Jack Min Ong" → "jackmin" (first + second word concatenated, no hyphen)
  const firstTwo = parts.length >= 2 ? parts[0] + parts[1] : null;

  if (fullSlug) candidates.push(`${BASE}/${fullSlug}.jpg`);
  if (fullSlug) candidates.push(`${BASE}/${fullSlug}.jpeg`);
  if (fullSlug) candidates.push(`${BASE}/${fullSlug}.png`);
  if (fullSlug) candidates.push(`${BASE}/${fullSlug}.webp`);
  if (firstTwo && firstTwo !== fullSlug) {
    candidates.push(`${BASE}/${firstTwo}.jpg`);
    candidates.push(`${BASE}/${firstTwo}.jpeg`);
    candidates.push(`${BASE}/${firstTwo}.png`);
    candidates.push(`${BASE}/${firstTwo}.webp`);
  }
  if (firstName && firstName !== fullSlug) {
    candidates.push(`${BASE}/${firstName}.jpg`);
    candidates.push(`${BASE}/${firstName}.jpeg`);
    candidates.push(`${BASE}/${firstName}.png`);
    candidates.push(`${BASE}/${firstName}.webp`);
  }
  // fallback: some team members have images under /team/ instead of /speakers/
  if (fullSlug) candidates.push(`${TEAM_BASE}/${fullSlug}.jpg`);
  if (fullSlug) candidates.push(`${TEAM_BASE}/${fullSlug}.jpeg`);
  if (fullSlug) candidates.push(`${TEAM_BASE}/${fullSlug}.png`);
  if (fullSlug) candidates.push(`${TEAM_BASE}/${fullSlug}.webp`);
  if (firstTwo && firstTwo !== fullSlug) {
    candidates.push(`${TEAM_BASE}/${firstTwo}.jpg`);
    candidates.push(`${TEAM_BASE}/${firstTwo}.jpeg`);
  }
  if (firstName && firstName !== fullSlug) {
    candidates.push(`${TEAM_BASE}/${firstName}.jpg`);
    candidates.push(`${TEAM_BASE}/${firstName}.jpeg`);
  }
  if (apiImageUrl) candidates.push(apiImageUrl);

  // de-dupe
  return [...new Set(candidates)];
}

/** Lowercase, normalize diacritics, strip parens/nicknames, replace spaces with hyphens. */
function toSlug(name: string): string {
  let s = name.trim();
  // remove parenthesised nicknames like "(SK)" or "(Vish)"
  s = s.replace(/\s*\([^)]*\)\s*/g, " ").trim();
  // normalise diacritics: decompose then drop combining marks
  s = s.normalize("NFD").replace(/[̀-ͯ]/g, "");
  s = s.toLowerCase();
  // drop anything that isn't letters/numbers/spaces/hyphens
  s = s.replace(/[^a-z0-9\s-]/g, "");
  s = s.replace(/\s+/g, "-").replace(/-+/g, "-");
  return s;
}
