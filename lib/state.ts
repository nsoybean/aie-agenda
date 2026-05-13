import LZString from "lz-string";
import type { ThemeId } from "./themes";
import { DEFAULT_THEME, THEMES } from "./themes";

export interface AgendaState {
  name: string;
  ids: string[];
  theme?: ThemeId;
  x?: string;
  linkedin?: string;
}

const MAX_NAME = 40;
const MAX_HANDLE = 15;
const MAX_LINKEDIN = 60;

export function sanitizeName(raw: string): string {
  return raw.replace(/\s+/g, " ").trim().slice(0, MAX_NAME);
}

export function sanitizeX(raw: string): string {
  return raw.replace(/^@/, "").replace(/[^a-zA-Z0-9_]/g, "").slice(0, MAX_HANDLE);
}

export function sanitizeLinkedIn(raw: string): string {
  return raw
    .replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//i, "")
    .replace(/\/$/, "")
    .trim()
    .slice(0, MAX_LINKEDIN);
}

export function encodeAgenda(state: AgendaState): string {
  const params = new URLSearchParams();
  const name = sanitizeName(state.name);
  if (name) params.set("n", name);
  if (state.ids.length) {
    params.set("p", LZString.compressToEncodedURIComponent(state.ids.join(",")));
  }
  if (state.theme && state.theme !== DEFAULT_THEME) params.set("t", state.theme);
  if (state.x) params.set("x", state.x);
  if (state.linkedin) params.set("li", state.linkedin);
  return params.toString();
}

type SearchParamsLike =
  | URLSearchParams
  | Record<string, string | string[] | undefined>;

function getParam(sp: SearchParamsLike, key: string): string | undefined {
  if (sp instanceof URLSearchParams) return sp.get(key) ?? undefined;
  const v = sp[key];
  return Array.isArray(v) ? v[0] : v;
}

export function decodeAgenda(sp: SearchParamsLike): AgendaState {
  const name = sanitizeName(getParam(sp, "n") ?? "");
  const p = getParam(sp, "p");
  const t = getParam(sp, "t") as ThemeId | undefined;

  let ids: string[] = [];
  if (p) {
    try {
      const raw = LZString.decompressFromEncodedURIComponent(p) ?? "";
      ids = raw.split(",").map((s) => s.trim()).filter(Boolean);
    } catch {
      ids = [];
    }
  }
  const seen = new Set<string>();
  ids = ids.filter((id) => (seen.has(id) ? false : (seen.add(id), true)));

  const theme = t && t in THEMES ? t : DEFAULT_THEME;
  const x = sanitizeX(getParam(sp, "x") ?? "");
  const linkedin = sanitizeLinkedIn(getParam(sp, "li") ?? "");
  return { name, ids, theme, ...(x && { x }), ...(linkedin && { linkedin }) };
}

export function cardPath(state: AgendaState): string {
  const q = encodeAgenda(state);
  return q ? `/card?${q}` : "/card";
}

export function plannerPath(state: AgendaState): string {
  const q = encodeAgenda(state);
  return q ? `/?${q}` : "/";
}
