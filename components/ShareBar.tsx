"use client";

import { useState } from "react";
import { toPng } from "html-to-image";
import { buildIcs } from "@/lib/api";
import { X_TAG } from "@/lib/site";
import type { Session } from "@/lib/types";

function download(filename: string, dataUrl: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export default function ShareBar({
  name,
  sessions,
  cardNodeId,
  editHref,
}: {
  name: string;
  sessions: Session[];
  cardNodeId: string;
  editHref: string;
}) {
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState<null | "png">(null);

  const url = typeof window !== "undefined" ? window.location.href : "";
  const who = name.trim() ? `${name.trim()}'s` : "my";
  const tweet = `Built ${who} AI Engineer Singapore agenda — ${sessions.length} sessions across 3 days. Plan yours 👇 ${X_TAG}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  }

  function shareX() {
    const u = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweet)}&url=${encodeURIComponent(url)}`;
    window.open(u, "_blank", "noopener,noreferrer");
  }

  async function downloadPng() {
    const node = document.getElementById(cardNodeId);
    if (!node) return;
    setBusy("png");
    try {
      const scale = Math.max(1, Math.round((1200 / node.offsetWidth) * 2));
      const dataUrl = await toPng(node, {
        pixelRatio: scale,
        cacheBust: true,
        backgroundColor: "#000000",
      });
      const slug = (name.trim() || "my").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      download(`aie-singapore-agenda-${slug || "card"}.png`, dataUrl);
    } finally {
      setBusy(null);
    }
  }

  function downloadIcs() {
    const ics = buildIcs(sessions, `${who === "my" ? "My" : who} AI Engineer Singapore 2026`);
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const dataUrl = URL.createObjectURL(blob);
    download("aie-singapore-agenda.ics", dataUrl);
    setTimeout(() => URL.revokeObjectURL(dataUrl), 5000);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={shareX}
        className="rounded-full bg-white px-4 py-2 text-sm font-medium text-black transition-opacity hover:opacity-90"
      >
        Share on X
      </button>
      <button
        type="button"
        onClick={copyLink}
        className="rounded-full border border-line px-4 py-2 text-sm text-ink transition-colors hover:bg-white/[0.06]"
      >
        {copied ? "Link copied ✓" : "Copy link"}
      </button>
      <button
        type="button"
        onClick={downloadPng}
        disabled={busy === "png"}
        className="rounded-full border border-line px-4 py-2 text-sm text-ink transition-colors hover:bg-white/[0.06] disabled:opacity-50"
      >
        {busy === "png" ? "Rendering…" : "Download card (PNG)"}
      </button>
      <button
        type="button"
        onClick={downloadIcs}
        className="rounded-full border border-line px-4 py-2 text-sm text-ink transition-colors hover:bg-white/[0.06]"
      >
        Add all to calendar (.ics)
      </button>
      <a
        href={editHref}
        className="rounded-full border border-transparent px-4 py-2 text-sm text-ink-dim transition-colors hover:text-ink"
      >
        Edit my picks →
      </a>
    </div>
  );
}
