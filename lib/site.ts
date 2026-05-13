export function siteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return stripTrailingSlash(process.env.NEXT_PUBLIC_SITE_URL);
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

function stripTrailingSlash(s: string): string {
  return s.endsWith("/") ? s.slice(0, -1) : s;
}

/** Host without protocol — for display on the card footer. */
export function siteHost(): string {
  try {
    return new URL(siteUrl()).host;
  } catch {
    return "ai.engineer/singapore";
  }
}

export const X_TAG = "@aiDotEngineer";
export const EVENT_NAME = "AI Engineer Singapore";
export const EVENT_YEAR = "2026";
export const EVENT_DATES = "15–17 May 2026";
export const OFFICIAL_URL = "https://ai.engineer/singapore";
