const BASE = "https://www.ai.engineer/speakers";

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
  const firstName = fullSlug.split("-")[0];

  if (fullSlug) candidates.push(`${BASE}/${fullSlug}.jpg`);
  // also try jpeg/png for common edge cases with the full slug
  if (fullSlug) candidates.push(`${BASE}/${fullSlug}.jpeg`);
  if (fullSlug) candidates.push(`${BASE}/${fullSlug}.png`);
  if (firstName && firstName !== fullSlug) {
    candidates.push(`${BASE}/${firstName}.jpg`);
    candidates.push(`${BASE}/${firstName}.jpeg`);
    candidates.push(`${BASE}/${firstName}.png`);
    candidates.push(`${BASE}/${firstName}.webp`);
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
