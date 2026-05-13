import LZString from "lz-string";

export interface AgendaState {
  name: string;
  ids: string[];
}

const MAX_NAME = 40;

export function sanitizeName(raw: string): string {
  return raw.replace(/\s+/g, " ").trim().slice(0, MAX_NAME);
}

/** Build a query string carrying the full agenda state. `name` stays readable; ids are compressed. */
export function encodeAgenda(state: AgendaState): string {
  const params = new URLSearchParams();
  const name = sanitizeName(state.name);
  if (name) params.set("n", name);
  if (state.ids.length) {
    params.set("p", LZString.compressToEncodedURIComponent(state.ids.join(",")));
  }
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
  let ids: string[] = [];
  if (p) {
    try {
      const raw = LZString.decompressFromEncodedURIComponent(p) ?? "";
      ids = raw.split(",").map((s) => s.trim()).filter(Boolean);
    } catch {
      ids = [];
    }
  }
  // de-dupe, preserve order
  const seen = new Set<string>();
  ids = ids.filter((id) => (seen.has(id) ? false : (seen.add(id), true)));
  return { name, ids };
}

export function cardPath(state: AgendaState): string {
  const q = encodeAgenda(state);
  return q ? `/card?${q}` : "/card";
}

export function plannerPath(state: AgendaState): string {
  const q = encodeAgenda(state);
  return q ? `/?${q}` : "/";
}
