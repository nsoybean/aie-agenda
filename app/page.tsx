import { aggregateTopics, getSchedule, selectableSessions } from "@/lib/api";
import { decodeAgenda } from "@/lib/state";
import Planner from "@/components/Planner";

type SP = Promise<Record<string, string | string[] | undefined>>;

export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const initial = decodeAgenda(sp);
  const schedule = await getSchedule();
  const sessions = selectableSessions(schedule);
  const validIds = new Set(sessions.map((s) => s.id));
  const topTopics = aggregateTopics(sessions)
    .slice(0, 8)
    .map((t) => t.topic);

  return (
    <Planner
      sessions={sessions}
      topics={topTopics}
      initialName={initial.name}
      initialIds={initial.ids.filter((id) => validIds.has(id))}
    />
  );
}
