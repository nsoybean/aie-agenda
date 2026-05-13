import type { Metadata } from "next";
import Link from "next/link";
import { aggregateTopics, getSchedule, resolveSessions } from "@/lib/api";
import { decodeAgenda, encodeAgenda, plannerPath } from "@/lib/state";
import { EVENT_NAME, siteHost } from "@/lib/site";
import CardView from "@/components/CardView";

type SP = Promise<Record<string, string | string[] | undefined>>;

export const dynamic = "force-dynamic";

async function load(searchParams: SP) {
  const sp = await searchParams;
  const { name, ids, theme, x, linkedin } = decodeAgenda(sp);
  const schedule = await getSchedule();
  const sessions = resolveSessions(schedule, ids);
  return { name, ids: sessions.map((s) => s.id), sessions, theme, x, linkedin };
}

export async function generateMetadata({ searchParams }: { searchParams: SP }): Promise<Metadata> {
  const { name, ids, sessions } = await load(searchParams);
  const who = name.trim() ? `${name.trim()}’s` : "My";
  const title = `${who} ${EVENT_NAME} 2026 agenda`;
  const topics = aggregateTopics(sessions).slice(0, 4).map((t) => t.topic);
  const description = sessions.length
    ? `${sessions.length} session${sessions.length === 1 ? "" : "s"}${
        topics.length ? " · " + topics.join(", ") : ""
      } · 15–17 May, Singapore`
    : "Build your AI Engineer Singapore 2026 agenda and get a shareable card.";
  const ogUrl = `/api/og?${encodeAgenda({ name, ids })}`;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      images: [{ url: ogUrl, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogUrl],
    },
  };
}

export default async function CardPage({ searchParams }: { searchParams: SP }) {
  const { name, ids, sessions, theme, x, linkedin } = await load(searchParams);

  if (!sessions.length) {
    return (
      <main className="mx-auto flex min-h-[70vh] w-full max-w-xl flex-col items-center justify-center px-6 text-center">
        <div className="label text-xs text-ink-faint">{EVENT_NAME} · 2026</div>
        <h1 className="serif mt-3 text-3xl font-semibold text-ink">No agenda here yet</h1>
        <p className="mt-3 text-ink-dim">
          This link doesn’t carry any picked sessions. Build your own agenda for the 3-day conference and
          you’ll get a shareable card like this one.
        </p>
        <Link
          href="/"
          className="mt-6 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black transition-opacity hover:opacity-90"
        >
          Build my agenda →
        </Link>
      </main>
    );
  }

  return (
    <CardView
      name={name}
      sessions={sessions}
      editHref={plannerPath({ name, ids, theme, ...(x && { x }), ...(linkedin && { linkedin }) })}
      siteHost={siteHost()}
      initialTheme={theme}
      xHandle={x}
      linkedin={linkedin}
    />
  );
}
