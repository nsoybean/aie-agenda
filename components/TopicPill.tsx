import { pillColors } from "@/lib/theme";

export default function TopicPill({
  topic,
  count,
  size = "md",
}: {
  topic: string;
  count?: number;
  size?: "sm" | "md";
}) {
  const c = pillColors(topic);
  const pad = size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-mono lowercase tracking-tight ${pad}`}
      style={{ backgroundColor: c.bg, border: `1px solid ${c.border}`, color: c.fg }}
    >
      {topic}
      {count != null && count > 1 && (
        <span className="opacity-60" style={{ fontSize: "0.85em" }}>
          ×{count}
        </span>
      )}
    </span>
  );
}
