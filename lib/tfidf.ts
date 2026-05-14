import type { Session } from "./types";

const STOPWORDS = new Set(
  `a about above after again against all am an and any are arent as at be because been
   before being below between both but by cant cannot could couldnt did didnt do does
   doesnt doing dont down during each few for from further get gets getting got had hadnt
   has hasnt have havent having he hed hell hes her here heres hers herself him himself
   his how hows if in into is isnt its itself lets me more most mustnt my myself no nor
   not of off on once only or other ought our ours ourselves out over own same shant she
   shed shell shes should shouldnt so some such than that thats the their theirs them
   themselves then there theres these they theyd theyll theyre theyve this those through
   to too under until up very was wasnt we wed well were weve were werent what whats when
   whens where wheres which while who whos whom why whys will with wont would wouldnt you
   youd youll youre youve your yours yourself yourselves also just talk talks session
   sessions share well new make using work works use uses used explore explores explores
   show shows come comes going goes look looks help helps give gives need needs want wants
   think thinks like likes know knows take takes see sees say says tell tells find finds
   true false real world today still even much many can now may must first last next
   back away around learn learns look looks build builds built building create creates
   created creating move moves moving start starts started starting run runs running
   turn turns turning call calls called calling open opens opened opening keep keeps
   keeping lets lets let making takes doing going getting coming coming back every
   high low big small long short fast slow good better best great well already quite
   often never always sometimes usually generally typically actually really fairly very
   truly clearly simply easily quickly quickly fully fully fully
   stage demo stage demos closing minutes wave everyone everything dive directions
   including include includes within without across whether another others either
   both those these their there where here when then than that this with have been
   will would could should might must shall were from into onto upon over under
   between through during before after above below same different various several
   many much more most less least some none such both each only even still also
   just ever never always already quite rather fairly very truly clearly simply`.split(/\s+/).filter(Boolean),
);

function tokenize(text: string): string[] {
  const raw = text.toLowerCase().match(/[a-z][a-z]{2,}/g) ?? [];
  return raw.filter((w) => !STOPWORDS.has(w) && w.length >= 4);
}

export interface TermWeight {
  term: string;
  score: number; // global TF-IDF importance
  docFreq: number; // how many sessions mention this
  sessions: string[]; // session ids that contain this term
}

export interface SessionTerms {
  id: string;
  terms: Array<{ term: string; tfidf: number }>;
}

export interface TFIDFIndex {
  globalTerms: TermWeight[]; // sorted by score desc
  sessionTerms: Map<string, SessionTerms>;
  coOccurrence: Map<string, Map<string, number>>; // term → (term → count)
  sessionsByTerm: Map<string, string[]>; // term → session ids
}

export function buildIndex(sessions: Session[]): TFIDFIndex {
  const withText = sessions.filter((s) => s.description || s.title);
  const N = withText.length;

  // Per-session token bags — description weighted 3× over title so rare
  // but important description terms surface above generic title words
  const sessionBags = new Map<string, Map<string, number>>();
  for (const s of withText) {
    const text = `${s.title} ${s.description ?? ""} ${s.description ?? ""} ${s.description ?? ""}`;
    const tokens = tokenize(text);
    const bag = new Map<string, number>();
    for (const t of tokens) bag.set(t, (bag.get(t) ?? 0) + 1);
    sessionBags.set(s.id, bag);
  }

  // Document frequency
  const df = new Map<string, number>();
  for (const bag of sessionBags.values()) {
    for (const term of bag.keys()) {
      df.set(term, (df.get(term) ?? 0) + 1);
    }
  }

  // Keep terms that appear in 1–55% of sessions
  // minDf=1 lets specific/niche terms through; IDF naturally down-weights common ones
  const minDf = 1;
  const maxDf = Math.ceil(N * 0.55);
  const validTerms = new Set([...df.entries()].filter(([, d]) => d >= minDf && d <= maxDf).map(([t]) => t));

  // TF-IDF per session
  const sessionTermsMap = new Map<string, SessionTerms>();
  for (const s of withText) {
    const bag = sessionBags.get(s.id)!;
    const totalTokens = [...bag.values()].reduce((a, b) => a + b, 0);
    const terms: Array<{ term: string; tfidf: number }> = [];
    for (const [term, count] of bag.entries()) {
      if (!validTerms.has(term)) continue;
      const tf = count / totalTokens;
      const idf = Math.log(N / (df.get(term) ?? 1));
      terms.push({ term, tfidf: tf * idf });
    }
    terms.sort((a, b) => b.tfidf - a.tfidf);
    sessionTermsMap.set(s.id, { id: s.id, terms });
  }

  // Global term importance = sum of (tfidf * idf) across all sessions
  const globalScores = new Map<string, number>();
  const sessionsByTerm = new Map<string, string[]>();
  for (const [sid, { terms }] of sessionTermsMap.entries()) {
    for (const { term, tfidf } of terms) {
      globalScores.set(term, (globalScores.get(term) ?? 0) + tfidf);
      if (!sessionsByTerm.has(term)) sessionsByTerm.set(term, []);
      sessionsByTerm.get(term)!.push(sid);
    }
  }

  const globalTerms: TermWeight[] = [...globalScores.entries()]
    .map(([term, score]) => ({
      term,
      score,
      docFreq: df.get(term) ?? 0,
      sessions: sessionsByTerm.get(term) ?? [],
    }))
    .sort((a, b) => b.score - a.score);

  // Co-occurrence: take top 12 terms per session, count pairwise appearances
  const coOccurrence = new Map<string, Map<string, number>>();
  for (const { terms } of sessionTermsMap.values()) {
    const top = terms.slice(0, 12).map((t) => t.term);
    for (let i = 0; i < top.length; i++) {
      for (let j = i + 1; j < top.length; j++) {
        const a = top[i];
        const b = top[j];
        if (!coOccurrence.has(a)) coOccurrence.set(a, new Map());
        if (!coOccurrence.has(b)) coOccurrence.set(b, new Map());
        coOccurrence.get(a)!.set(b, (coOccurrence.get(a)!.get(b) ?? 0) + 1);
        coOccurrence.get(b)!.set(a, (coOccurrence.get(b)!.get(a) ?? 0) + 1);
      }
    }
  }

  return { globalTerms, sessionTerms: sessionTermsMap, coOccurrence, sessionsByTerm };
}
